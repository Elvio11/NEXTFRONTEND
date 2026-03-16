-- ─────────────────────────────────────────────────────────────
-- Agent 14: Hourly follow-up trigger
-- Runs email Gmail scan every hour
-- Send window (9–11 AM IST) enforced inside the agent
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'talvix_agent14_hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.server3_url') || '/api/agents/follow-up/all',
    headers    := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Agent-Secret', current_setting('app.agent_secret')
    ),
    body       := '{}'::jsonb
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- Agent 9: Nightly scrape trigger (8 PM IST = 2:30 PM UTC)
-- (Fixes the missing scrape trigger identified in earlier session)
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'talvix_nightly_scrape',
  '30 14 * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.server3_url') || '/api/agents/scraper',
    headers    := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Agent-Secret', current_setting('app.agent_secret')
    ),
    body       := '{}'::jsonb
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- Agent 15 Layer 2: Daily calibration (5 AM IST = 11:30 PM UTC)
-- Now points to Server 2 after migration
-- ─────────────────────────────────────────────────────────────
SELECT cron.unschedule('careeros_micro_learning');
SELECT cron.schedule(
  'talvix_calibrate_daily',
  '30 23 * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.server2_url') || '/api/agents/calibrate/daily',
    headers    := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Agent-Secret', current_setting('app.agent_secret')
    ),
    body       := '{}'::jsonb
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- Agent 15 Layer 3: Weekly deep calibration (Sunday midnight IST)
-- Now points to Server 2 after migration
-- ─────────────────────────────────────────────────────────────
SELECT cron.unschedule('careeros_weekly_calibration_trigger');
SELECT cron.schedule(
  'talvix_calibrate_weekly',
  '0 18 * * 6',
  $$
  SELECT net.http_post(
    url        := current_setting('app.server2_url') || '/api/agents/calibrate/weekly',
    headers    := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Agent-Secret', current_setting('app.agent_secret')
    ),
    body       := '{}'::jsonb
  );
  $$
);
