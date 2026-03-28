-- Migration: baseline_scrape_targets
-- Description: Create table for tracking high-demand roles to pre-populate the job pool.

CREATE TABLE IF NOT EXISTS baseline_scrape_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT NOT NULL,
    location TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    last_scraped_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_name, location)
);

-- Seed with 10 high-demand roles across key Indian hubs
INSERT INTO baseline_scrape_targets (role_name, location, priority) VALUES
('Software Engineer', 'Bangalore', 10),
('Data Scientist', 'Hyderabad', 9),
('Frontend Developer', 'Remote', 9),
('DevOps Engineer', 'Pune', 8),
('Product Manager', 'Mumbai', 8),
('Full Stack Developer', 'Bangalore', 10),
('Backend Developer', 'Remote', 9),
('QA Automation Engineer', 'Pune', 7),
('ML Engineer', 'Bangalore', 8),
('UI/UX Designer', 'Hyderabad', 7)
ON CONFLICT (role_name, location) DO NOTHING;
