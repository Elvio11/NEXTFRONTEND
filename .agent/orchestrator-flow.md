# Talvix — Orchestrator Flow

## Daily Execution Timeline (IST)

```
7:00 AM   Agent 8 — Daily Coach
          → Runs for all paid users with wa_opted_in = true
          → Sarvam-M Think. Hyper-variant prompts. Checks notif_prefs.quiet_hours.

7:30 PM   Session Health Check (pre-apply gate)
          → Agent 12 validates all user_connections before apply window
          → Failing sessions: auto_apply_paused = true + WhatsApp alert

8:00 PM   Agent 9 — Job Scraper STARTS
          → asyncio.gather() — all 10 platforms scraped concurrently
          → Webshare proxy ONLY for LinkedIn scraping within Agent 9
          → Each job: SHA-256 fingerprint → ON CONFLICT (fingerprint) DO UPDATE last_seen_at
          → xmax = 0 → is_new = TRUE (new job). xmax ≠ 0 → last_seen_at update only
          → Expected: ~5,000-8,000 new jobs. ~26,000 refreshed.
          → On complete: writes scrape_runs record. Triggers Agent 7 (Server 2).

8:00 PM   Agent 12 — Auto-Apply WINDOW OPENS (runs parallel to scraping)
          → Dynamic Continuous Queue. NOT a batch at a fixed time.
          → Each user gets slot = hash(user_id + date). Deterministic per night.
          → Pre-apply eligibility_checker: daily_apply_limit (10/day) + monthly (250/month) + session valid + not blacklisted
          → Review Mode (first 14 days after auto_apply_activated_at): queued status → user approves via dashboard
          → Platform priority: LinkedIn Easy Apply first, then Indeed Easy Apply
          → On CAPTCHA: log, failed_captcha status, increment retry_count. 3 consecutive → pause user.
          → Agent 13 (Form Q&A) called inline if custom question detected

9:00 PM   Agent 7 — JD Cleaning STARTS (triggered by Agent 9 completion)
          → Server 2. Processes only jd_cleaned = FALSE AND is_active = TRUE jobs.
          → Gemini Flash Lite. Strips boilerplate, extracts skills, writes jd_summary.
          → Sets jd_cleaned = TRUE per job.

~10 PM    Agent 6 — Fit Scoring (delta mode, triggered after Agent 7 completes)
          → Scores only is_new = TRUE jobs for each active user
          → prefilter_engine first: SQL filter (role_family, seniority, city) + TF-IDF → ~100-300 jobs per user
          → fit_calculator: Sarvam-M No-Think, batch 100 jobs per call
          → Writes only scores >= 40 to job_fit_scores
          → Marks is_new = FALSE on all scored jobs
          → Updates user_fit_score_cursors

9:00 AM   Agent 14 — LinkedIn Outreach WINDOW OPENS (9 AM to 6 PM IST)
          → Searches recruiter at company 2 days after application
          → Sends personalised connection request (max 15/day/user)
          → 2 days after acceptance: sends follow-up message (max 30/day/user)
          → Global kill switch: 1,500 total LinkedIn actions/day across ALL users on server

Hourly    Agent 14 — Email Track
          → Gmail scan: reads inbox for replies to sent applications
          → Day 7/14/21: sends follow-up emails (9 AM - 11 AM IST only)
          → Sarvam-M Precise. No two emails share same opening sentence.

6:00 AM   Agent 12 — Auto-Apply WINDOW CLOSES
```

## Onboarding Flow (CareerPlannerFlow via CrewAI)

```
User completes Step 2 (Resume Upload)
    ↓
Agent 3 (Resume Intelligence) — SYNC, must complete before next step
    ↓ parses resume, generates ai_generated_persona options
User selects persona (Step 4)
    ↓
and_() parallel execution (Steps 5-6 run, then triggers):
    ├── Agent 4 (Skill Gap)
    ├── Agent 5 (Career Intelligence)
    └── Agent 6 (Fit Scoring — FULL SCAN mode, all active jobs)
    ↓ all three complete
users.dashboard_ready = TRUE
Frontend realtime notification via Supabase JS
```

## pg_cron Scheduled Jobs

| Time (UTC) | IST | Job |
|---|---|---|
| 4:30 PM daily | 10:00 PM | Agent 9 scrape trigger |
| 10:30 AM daily | 4:00 AM | Delete dead jobs (30+ days inactive) |
| 11:00 AM daily | 4:30 AM | Mark stale jobs (14+ days unseen) |
| 11:30 AM daily | 5:00 AM | Layer 2 micro-calibration trigger |
| 6:30 PM daily | Midnight | WA reply count reset |
| 6:35 PM daily | 12:05 AM | Subscription expiry check |
| 7:00 PM 1st month | 12:30 AM 1st | Monthly apply count reset |
| 6:30 PM Saturday | Sunday midnight | Weekly fit score reset + cursor wipe |
| 6:35 PM Saturday | Sunday 12:05 AM | learning_signals cleanup (7-day TTL) |
| 6:45 PM Saturday | Sunday 12:15 AM | Layer 3 weekly deep calibration trigger |

## Server Communication Pattern

```
Browser → Server 1 (public, Nginx, JWT verified on every request)
Server 1 → Server 2 (HTTP POST + X-Agent-Secret, UFW protected)
Server 1 → Server 3 (HTTP POST + X-Agent-Secret, UFW protected)
Server 2 → Server 3 (HTTP POST + X-Agent-Secret for Agent 7 → Agent 9 handoff)
Server 2 → Supabase (service_role key via Doppler)
Server 3 → Supabase (service_role key via Doppler)
Server 1 → Supabase (anon + service_role keys)
```

## State Flags (Critical for Flow)

| Flag | Table | Meaning |
|---|---|---|
| `fit_scores_stale = TRUE` | users | Triggers FULL SCAN on next Agent 6 run |
| `is_new = TRUE` | jobs | Job not yet scored. Set FALSE after Agent 6 runs. |
| `jd_cleaned = FALSE` | jobs | Agent 7 hasn't processed this JD yet |
| `scoring_complete = FALSE` | scrape_runs | Agent 6 hasn't run against this scrape yet |
| `dashboard_ready = TRUE` | users | All 3 onboarding agents complete |
| `auto_apply_paused = TRUE` | users | Session invalid or cap hit. No applies. |
| `is_valid = FALSE` | user_connections | Session expired. Must reconnect via popup. |
