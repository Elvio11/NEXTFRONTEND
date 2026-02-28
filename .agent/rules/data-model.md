---
trigger: always_on
---

# Talvix — Data Model Reference

## 23 Tables — Groups and Purpose

### Core User (4 tables)
- **users** — Master user table. Every other table references this. Key flags: `tier`, `fit_scores_stale`, `auto_apply_paused`, `daily_apply_count`, `monthly_apply_count`, `last_active_at`, `notif_prefs`, `auto_apply_activated_at`.
- **user_target_roles** — Up to 5 role families per user. Used by scraping pre-filter and fit scoring.
- **user_company_prefs** — Dream companies (lower fit threshold) and blacklist (never apply).
- **resumes** — Metadata only. Parsed JSON lives on FluxShare. SHA-256 dedup via `file_hash`.

### Job Pool (4 tables)
- **jobs** — 150K–200K active jobs. `fingerprint` (SHA-256) ensures dedup across platforms. `is_new` flag drives scoring efficiency. `role_family` set by Agent 7 — critical for prefilter.
- **job_sources** — Which platforms found each job. Enables best apply_url selection.
- **job_skills** — Extracted skills per job. Set by Agent 7 (JD Cleaning). Used by Agent 4 (Skill Gap).
- **scrape_runs** — Each nightly scrape audit trail. `scoring_complete` flag tells Agent 6 when to run.

### Scoring (2 tables)
- **job_fit_scores** — Per-user fit scores. Free: top 3/week. Paid: top 25/week. Only scores ≥ 40 stored. `fit_reasons`, `missing_skills`, `strengths` NULL for free users.
- **user_fit_score_cursors** — Tracks last `scrape_run` each user was scored against. Enables delta-only scoring.

### Applications (3 tables)
- **job_applications** — Full audit trail. Soft delete via `status = 'withdrawn'`. `job_id` FK is SET NULL (not CASCADE) — history preserved even after job is deleted.
- **user_connections** — AES-256 encrypted platform sessions. `session_encrypted` NEVER returned by API. `warning_7d_sent`, `warning_3d_sent`, `warning_1d_sent` prevent duplicate alerts.
- **linkedin_daily_limits** — Per-user per-day LinkedIn action counters. Composite PK: `(user_id, limit_date)`.

### Career Intel (3 tables)
- **skill_gap_results** — One row per user. `top_gaps` JSONB (top 3 in DB). Full report on FluxShare.
- **career_intelligence** — One row per user. Career score 0–100 across 4 dimensions. Salary percentiles.
- **salary_benchmarks** — System-wide reference. India market data. Updated quarterly.

### Communication (2 tables)
- **notifications** — Hot window only. HIGH: 7-day TTL. LOW: 48-hour TTL. All: 24h after read.
- **wa_bot_health** — Single row. Baileys socket status. `id = 1` always.

### Self-Learning (7 tables)
- **learning_signals** — 7-day hot window. Every system event captured here. Aggregated Sunday then deleted.
- **model_performance_snapshots** — Permanent. Never deleted. Weekly aggregates by agent/platform/seniority.
- **model_weights** — 23 tunable parameters with hard `min_value`/`max_value` bounds. Calibration cannot exceed bounds.
- **prompt_versions** — Version-controlled prompts. One active per agent enforced by unique partial index.
- **ab_test_runs** — A/B prompt testing. Requires ≥ 95% confidence before promoting winner.
- **calibration_runs** — Full audit of every Layer 3 calibration. `top_finding` is human-readable summary.
- **agent_logs** — 3-day TTL (success), 30-day TTL (errors). Set `expires_at` at INSERT time.

## Critical Flag Reference

| Flag | Table | Set When | Effect |
|---|---|---|---|
| `fit_scores_stale = TRUE` | users | Resume uploaded, target roles changed, weekly reset | Agent 6 runs FULL SCAN mode |
| `is_new = TRUE` | jobs | First INSERT via scraper | Agent 6 scores this job. Set FALSE after scoring. |
| `jd_cleaned = FALSE` | jobs | Default on INSERT | Agent 7 must process this job |
| `scoring_complete = FALSE` | scrape_runs | Default on INSERT | Agent 6 not yet run against this scrape |
| `dashboard_ready = TRUE` | users | Agents 4+5+6 all complete | Frontend realtime notification fires |
| `auto_apply_paused = TRUE` | users | Session invalid, 3x failure, cap hit | No auto-apply attempts for this user |
| `is_valid = FALSE` | user_connections | Session expired or 3x failure | User must reconnect via Vault popup |

## Job Lifecycle — Exact SQL

```sql
-- Upsert (Agent 9 runs this for every scraped job)
INSERT INTO jobs (fingerprint, ...) VALUES (...)
ON CONFLICT (fingerprint) DO UPDATE SET last_seen_at = NOW();
-- xmax = 0 → brand new INSERT → is_new = TRUE (already set by DEFAULT)
-- xmax ≠ 0 → existing row updated → is_new stays FALSE (no change)

-- Mark stale (pg_cron 4:30 AM IST)
UPDATE jobs SET is_active = FALSE WHERE last_seen_at < NOW() - INTERVAL '14 days';

-- Delete dead (pg_cron 4:00 AM IST)
DELETE FROM jobs WHERE is_active = FALSE AND last_seen_at < NOW() - INTERVAL '30 days';
```

## Fit Scoring Modes

| Mode | Trigger | Scope |
|---|---|---|
| Full Scan | `fit_scores_stale = TRUE` (new user, new resume, weekly reset) | All `is_active = TRUE` jobs after prefilter |
| Delta Only | Normal nightly run | Only `is_new = TRUE` jobs from latest scrape_run |

## Storage Path Reference

| Content | Path | TTL |
|---|---|---|
| Parsed resume JSON | `/storage/parsed-resumes/{user_id}.json.gz` | Permanent |
| Raw JD text | `/storage/jds/{fingerprint}.txt` | 30 days |
| Skill gap report | `/storage/skill-gaps/{user_id}.json.gz` | Overwritten |
| Career intel | `/storage/career-intel/{user_id}.json.gz` | Overwritten |
| Tailored resume | `/storage/tailored/{user_id}/{app_id}.pdf` | 7 days |
| Cover letter | `/storage/cover-letters/{user_id}/{app_id}.txt` | 7 days |
| Apply screenshot | `/storage/screenshots/{app_id}.png` | 7 days |
| Live weights | `/storage/model-data/weights_current.json` | Permanent (overwritten) |
| Calibration report | `/storage/calibration/{run_id}.json.gz` | 90 days |
