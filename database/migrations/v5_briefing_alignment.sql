-- Migration: v5_briefing_alignment
-- Description: Align schema with March 16 Locked Decisions (pgvector, Job Pooling, new Tiers)

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Update users.tier check constraint
-- First, migrate any existing 'paid' users to 'professional'
UPDATE users SET tier = 'professional' WHERE tier = 'paid';

-- Drop old constraint and add new one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'student', 'professional'));

-- 3. Add columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pool_tier SMALLINT NOT NULL DEFAULT 1 CHECK (pool_tier IN (1, 2, 3));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote_viability_score SMALLINT NOT NULL DEFAULT 1 CHECK (remote_viability_score IN (0, 1, 2, 3));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jd_embedding vector(768);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jd_tsvector tsvector;

-- 4. Add column to resumes table
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS resume_embedding vector(768);

-- 5. Create remote_filter_config table
CREATE TABLE IF NOT EXISTS remote_filter_config (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern       TEXT NOT NULL,
    pattern_type  TEXT CHECK (pattern_type IN ('hard_reject', 'eo_provider', 'global_signal', 'timezone_good', 'timezone_bad')),
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for remote_filter_config
ALTER TABLE remote_filter_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON remote_filter_config FOR ALL USING (true); -- Agent access

-- 6. Create Indexes
-- HNSW for vector cosine similarity (Semantic Search)
CREATE INDEX IF NOT EXISTS idx_jobs_jd_embedding_hnsw 
ON jobs USING hnsw (jd_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- GIN for full-text search (BM25)
CREATE INDEX IF NOT EXISTS idx_jobs_jd_tsvector_gin 
ON jobs USING GIN (jd_tsvector);

-- 7. Insert new model_weights entries
INSERT INTO model_weights (weight_key, weight_value, min_value, max_value, description)
VALUES 
('remote.timezone_overlap_weight', 0.15, 0.05, 0.40, 'Boost applied to jobs in timezone-compatible regions for IST users'),
('remote.eo_provider_boost', 0.20, 0.10, 0.50, 'Boost applied to jobs from companies using EOR providers confirming India hireability')
ON CONFLICT (weight_key) DO UPDATE SET
    weight_value = EXCLUDED.weight_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    description = EXCLUDED.description;

-- 8. RPC: Update JD tsvector (called by Agent 7)
CREATE OR REPLACE FUNCTION update_jd_tsvector(p_job_id UUID, p_jd_text TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs
    SET jd_tsvector = to_tsvector('english', p_jd_text)
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Generic SQL Query Executor (Restricted to service_role)
-- Allows agents to run complex RRF / Hybrid search queries
CREATE OR REPLACE FUNCTION sql_query(query TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || query || ') t' INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

