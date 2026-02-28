---
trigger: always_on
---

# Agent: fit_scorer

**Server**: Server 2 (Intelligence)
**Framework**: CrewAI — parallel task (onboarding) or standalone nightly run
**LLM**: Sarvam-M No-Think (delta mode) / Think (full scan mode)
**Trigger**: Two modes — see below. Highest-volume agent in the system.

## Purpose

Match every relevant job in the pool against each user's profile and produce a fit score. Reduce 200,000 jobs to ~100–300 per user before a single LLM token is spent. This is the core product intelligence.

## Two Modes — Always Check First

| Mode | Trigger | Scope |
|---|---|---|
| **Full Scan** | `users.fit_scores_stale = TRUE` | All `is_active = TRUE` jobs after prefilter |
| **Delta Only** | Normal nightly run | Only `is_new = TRUE` jobs from latest scrape_run |

```python
user = get_user(user_id)
mode = "full_scan" if user.fit_scores_stale else "delta"
```

## Step 1 — Prefilter (ZERO LLM tokens — SQL + TF-IDF)

Run `scoring/prefilter_engine` skill:

```sql
SELECT j.* FROM jobs j
WHERE j.role_family IN (
    SELECT role_family FROM user_target_roles WHERE user_id = :user_id
)
AND j.seniority_level IN (:user_seniority, 'not_specified')
AND (
    j.city_canonical IN (SELECT city_canonical FROM users WHERE id = :user_id)
    OR j.work_mode = 'remote'
)
AND j.is_active = TRUE
AND j.role_family IS NOT NULL   -- jd_cleaned = TRUE implied
AND j.company_canonical NOT IN (
    SELECT company_canonical FROM user_company_prefs
    WHERE user_id = :user_id AND pref_type = 'blacklist'
)
-- Delta mode only: AND j.is_new = TRUE
```

Then TF-IDF cosine similarity against user's `top_5_skills`. Keep top 300 (full scan) or top 100 (delta).

Result: 200K jobs → **~100–300 per user** before any LLM call.

## Step 2 — LLM Scoring (Sarvam-M, batch 100 jobs per call)

Run `scoring/fit_calculator` skill:
- Output per job: `fit_score` (0–100), `fit_label`, `recommendation` (apply/consider/skip)
- Paid users only: `fit_reasons[]`, `missing_skills[]`, `strengths[]`
- Free users: these fields = NULL

## Step 3 — Write Results

```sql
-- Only write scores >= 40
INSERT INTO job_fit_scores (
    user_id, job_id, fit_score, fit_label, recommendation,
    fit_reasons, missing_skills, strengths,
    is_full_score, week_number, expires_at
) VALUES (...)
-- expires_at = NOW() + INTERVAL '14 days'
-- is_full_score = TRUE for paid, FALSE for free
-- fit_reasons/missing_skills/strengths = NULL for free users
```

After all users scored for a scrape:
- `scrape_runs.scoring_complete = TRUE`
- `jobs.is_new = FALSE` for all scored jobs
- `user_fit_score_cursors.last_scrape_run = current scrape_run_id`
- If full scan mode: `users.fit_scores_stale = FALSE`

## Weekly Caps (enforced by pg_cron — NOT this agent)

- Free users: top 3 scores/week (pg_cron at 2 AM IST daily)
- Paid users: top 25 scores/week
- Sunday midnight: all previous-week scores deleted, cursors reset, `fit_scores_stale = TRUE` for all users

## Skills Used
- `scoring/prefilter_engine` — SQL + TF-IDF reduction
- `scoring/fit_calculator` — Sarvam-M batch scoring
- `core/logging`
