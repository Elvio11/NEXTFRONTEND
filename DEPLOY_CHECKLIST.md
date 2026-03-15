# Talvix Infrastructure Fixes — Deploy Checklist
Generated: 2026-03-15

## Step 1: Doppler — Add/Rename Secrets
- [ ] Server 1: Set TELEGRAM_BOT_TOKEN (from @BotFather)
- [ ] Server 1: Set TELEGRAM_WEBHOOK_SECRET (32 random chars)
- [ ] Server 3: Rename SUPABASE_SERVICE_KEY → SUPABASE_SERVICE_ROLE_KEY
- [ ] Server 3: Add GOOGLE_CLIENT_ID (Google Cloud Console OAuth)
- [ ] Server 3: Add GOOGLE_CLIENT_SECRET (Google Cloud Console OAuth)
- [ ] Server 2 + 3: Confirm S4_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET are set in both server2 and server3 Doppler configs

## Step 2: Supabase SQL — Run in this order
- [ ] Run server3/migrations/agent14_rpcs.sql
      (creates get_eligible_followups, get_eligible_linkedin_tasks,
       increment_linkedin_action, calculate_li_acceptance_rate,
       adds recruiter_email column to jobs)
- [ ] Run server3/migrations/pg_cron_additions.sql
      (adds nightly scrape, hourly Agent 14, daily/weekly calibration triggers)
- [ ] Verify pg_net extension is enabled (required for all HTTP triggers)
      Dashboard → Database → Extensions → pg_net → Enable

## Step 3: Deploy Server 2
- [ ] Agent 15 files migrated from server3 to server2
- [ ] /api/agents/calibrate/daily route live
- [ ] /api/agents/calibrate/weekly route live
- [ ] Verify /health returns 200

## Step 4: Deploy Server 3
- [ ] Agent 15 files removed from server3
- [ ] SUPABASE_SERVICE_ROLE_KEY naming correct
- [ ] Agent 14 acceptance rate monitoring added
- [ ] Verify /health returns 200

## Step 5: Deploy Server 1
- [ ] /api/vault/status/:platform reads from req.params
- [ ] Verify /health returns 200

## Step 6: Deploy Frontend
- [ ] /dashboard/coach page live
- [ ] Coach tab in dashboard nav

## Step 7: Verify pg_cron Jobs
Run in Supabase SQL editor:
```sql
SELECT jobname, schedule, active FROM cron.job
WHERE jobname LIKE 'talvix_%'
ORDER BY jobname;
```

Expected: talvix_nightly_scrape, talvix_agent14_hourly,
          talvix_calibrate_daily, talvix_calibrate_weekly
