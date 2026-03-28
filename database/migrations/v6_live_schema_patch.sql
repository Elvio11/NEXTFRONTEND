-- Migration: v6_live_schema_patch
-- Description: Safely align live database schema with project requirements
-- This script uses non-destructive operations (IF EXISTS, IF NOT EXISTS, DO blocks)
-- to be safe for execution on a live production database.

-- 1. Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Fix syntax issues with ARRAY pseudo-types 
-- Safely converting to Postgres TEXT[] where columns exist
DO $$ 
BEGIN
    -- Fix job_fit_scores
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_fit_scores' AND column_name = 'fit_reasons') THEN
        ALTER TABLE public.job_fit_scores ALTER COLUMN fit_reasons TYPE TEXT[] USING fit_reasons::TEXT[];
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_fit_scores' AND column_name = 'missing_skills') THEN
        ALTER TABLE public.job_fit_scores ALTER COLUMN missing_skills TYPE TEXT[] USING missing_skills::TEXT[];
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_fit_scores' AND column_name = 'strengths') THEN
        ALTER TABLE public.job_fit_scores ALTER COLUMN strengths TYPE TEXT[] USING strengths::TEXT[];
    END IF;

    -- Fix scrape_runs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrape_runs' AND column_name = 'source_failures') THEN
        ALTER TABLE public.scrape_runs ALTER COLUMN source_failures TYPE TEXT[] USING source_failures::TEXT[];
    END IF;

    -- Fix users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cities_preferred') THEN
        ALTER TABLE public.users ALTER COLUMN cities_preferred TYPE TEXT[] USING cities_preferred::TEXT[];
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'work_modes_preferred') THEN
        ALTER TABLE public.users ALTER COLUMN work_modes_preferred TYPE TEXT[] USING work_modes_preferred::TEXT[];
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error fixing ARRAY types, they might already be fixed or tables might not exist: %', SQLERRM;
END $$;


-- 3. Update users table constraints (Tier migration placeholder to professional)
-- This updates existing records before applying the new constraint
UPDATE public.users SET tier = 'professional' WHERE tier = 'paid';

-- Safely drop old constraint and apply the new one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'student', 'professional'));

-- 4. Add missing columns to jobs table safely
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS pool_tier SMALLINT NOT NULL DEFAULT 1 CHECK (pool_tier IN (1, 2, 3));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS remote_viability_score SMALLINT NOT NULL DEFAULT 1 CHECK (remote_viability_score IN (0, 1, 2, 3));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS jd_embedding vector(768);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS jd_tsvector tsvector;

-- 5. Add missing columns and correct constraints to resumes table safely
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_embedding vector(768);

-- The codebase (Agent 3) uses upsert on user_id, which requires a UNIQUE constraint.
-- It also doesn't always provide file_hash, original_name, and file_type initially.
DO $$ 
BEGIN
    ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_user_id_key;
    ALTER TABLE public.resumes ADD CONSTRAINT resumes_user_id_key UNIQUE (user_id);
    ALTER TABLE public.resumes ALTER COLUMN file_hash DROP NOT NULL;
    ALTER TABLE public.resumes ALTER COLUMN original_name DROP NOT NULL;
    ALTER TABLE public.resumes ALTER COLUMN file_type DROP NOT NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error altering resumes table: %', SQLERRM;
END $$;

-- 6. Create remote_filter_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.remote_filter_config (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern       TEXT NOT NULL,
    pattern_type  TEXT CHECK (pattern_type IN ('hard_reject', 'eo_provider', 'global_signal', 'timezone_good', 'timezone_bad')),
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for remote_filter_config cleanly
ALTER TABLE public.remote_filter_config ENABLE ROW LEVEL SECURITY;

-- Add RLS Policy using DO block to avoid 'policy already exists' errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'remote_filter_config' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY "service_role_all" ON public.remote_filter_config FOR ALL USING (true);
    END IF;
END $$;


-- 7. Create missing Indexes idempotently
-- HNSW for vector cosine similarity (Semantic Search)
CREATE INDEX IF NOT EXISTS idx_jobs_jd_embedding_hnsw 
ON public.jobs USING hnsw (jd_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- GIN for full-text search (BM25)
CREATE INDEX IF NOT EXISTS idx_jobs_jd_tsvector_gin 
ON public.jobs USING GIN (jd_tsvector);

-- 8. Upsert new model_weights entries safely
-- Note: Assuming the table uses 'weight_name' as UNIQUE based on the user's schema dump
INSERT INTO public.model_weights (weight_name, weight_value, min_value, max_value, description)
VALUES 
('remote.timezone_overlap_weight', 0.15, 0.05, 0.40, 'Boost applied to jobs in timezone-compatible regions for IST users'),
('remote.eo_provider_boost', 0.20, 0.10, 0.50, 'Boost applied to jobs from companies using EOR providers confirming India hireability')
ON CONFLICT (weight_name) DO UPDATE SET
    weight_value = EXCLUDED.weight_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    description = EXCLUDED.description,
    last_updated_at = NOW();

-- 9. Create or Replace RPC Functions ensuring logic is updated
CREATE OR REPLACE FUNCTION public.update_jd_tsvector(p_job_id UUID, p_jd_text TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.jobs
    SET jd_tsvector = to_tsvector('english', p_jd_text)
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sql_query(query TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || query || ') t' INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Centralized automated updated_at trigger logic
-- Function logic for the trigger
CREATE OR REPLACE FUNCTION public.sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DO block to apply the trigger safely to all tables that have 'updated_at' column
DO $$
DECLARE
    t_name text;
    has_trigger boolean;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        -- Check if trigger already exists
        SELECT EXISTS (
            SELECT 1 
            FROM pg_trigger 
            WHERE tgrelid = (t_name)::regclass AND tgname = ('trg_update_' || t_name || '_timestamp')
        ) INTO has_trigger;
        
        IF NOT has_trigger THEN
            EXECUTE format('
                CREATE TRIGGER trg_update_%I_timestamp
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.sync_updated_at();
            ', t_name, t_name);
        END IF;
    END LOOP;
END $$;
