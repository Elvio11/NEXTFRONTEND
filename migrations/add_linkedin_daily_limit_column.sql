-- Add configurable limit column to system_daily_limits
-- Run this in Supabase SQL editor before deploying Fix 3
ALTER TABLE system_daily_limits
    ADD COLUMN IF NOT EXISTS linkedin_daily_limit INTEGER NOT NULL DEFAULT 1500;

COMMENT ON COLUMN system_daily_limits.linkedin_daily_limit IS
    'Configurable daily LinkedIn action cap. Adjust live without deployment.';
