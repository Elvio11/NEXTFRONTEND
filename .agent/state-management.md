# State Management

## Primary State Store: Supabase PostgreSQL
All system state lives in Supabase. No in-memory state that matters beyond a single request. No Redis. Servers are stateless — they read DB, act, write DB.

## Critical State Flags

### User Flags (users table)
| Flag | Type | Default | Meaning |
|---|---|---|---|
| fit_scores_stale | BOOLEAN | TRUE | Triggers full scan on next Agent 6 run |
| skill_gap_stale | BOOLEAN | TRUE | Triggers Agent 4 refresh |
| career_intel_stale | BOOLEAN | TRUE | Triggers Agent 5 refresh |
| dashboard_ready | BOOLEAN | FALSE | Set TRUE when onboarding agents all complete |
| auto_apply_enabled | BOOLEAN | FALSE | User has turned on auto-apply |
| auto_apply_paused | BOOLEAN | FALSE | System paused due to session failure or cap hit |
| onboarding_completed | BOOLEAN | FALSE | First resume parse completed |

### User Tier State
| Field | Meaning |
|---|---|
| tier | 'free' \| 'paid' — drives all feature gates |
| subscription_expires_at | Checked daily at midnight by pg_cron |
| monthly_apply_count | Incremented per apply. Reset 1st of month. |
| daily_apply_count | Incremented per apply. Reset midnight IST. |

### Job Pool State (jobs table)
| Flag | Meaning |
|---|---|
| is_new = TRUE | Not yet scored. Set FALSE after Agent 6 runs. |
| is_active = TRUE | In the active pool. |
| jd_cleaned = FALSE | Agent 7 hasn't processed this yet. |
| is_active = FALSE | STALE — not seen in 14 days. Excluded from scoring. |

### Application State (job_applications)
| Field | Values | Transitions |
|---|---|---|
| status | applied → viewed → callback → interview → offer / rejected / withdrawn / ghosted | Updated by Agent 14 (email scan) or user action |
| auto_status | queued → in_progress → submitted / failed_* / skipped_review | Set by Agent 12 |
| fu_stopped | BOOLEAN | Set TRUE when reply received or user withdraws |

### Session State (user_connections)
| Field | Meaning |
|---|---|
| is_valid | Session is usable for auto-apply |
| consecutive_failures | Incremented per apply failure. 3 → pause user. |
| estimated_expires_at | Used for proactive warning alerts |
| warning_7d_sent | Prevents duplicate 7-day expiry alert |
| warning_3d_sent | Prevents duplicate 3-day expiry alert |
| warning_1d_sent | Prevents duplicate 1-day expiry alert |

## 4-State User Matrix
| State | Tier | WhatsApp | Experience |
|---|---|---|---|
| 1 | Free | Not connected | Dashboard, top 3 job matches/week |
| 2 | Free | Connected | State 1 + WA job alerts + basic WA commands |
| 3 | Paid | Not connected | Top 25 matches, auto-apply, AI coach, follow-ups (no WA) |
| 4 | Paid | Connected | Full platform — everything. Target state. |

## Scoring State Machine
```
[STALE] fit_scores_stale = TRUE
    → Agent 6 triggered (full scan mode)
    → Scores entire active job pool
    → fit_scores_stale = FALSE

[NORMAL] New scrape_runs row (scoring_complete = FALSE)
    → Agent 6 triggered (delta mode)
    → Scores only is_new = TRUE jobs
    → Updates user_fit_score_cursors.last_scrape_run
    → scrape_runs.scoring_complete = TRUE

[WEEKLY RESET] Sunday midnight
    → Delete previous week's fit scores
    → user_fit_score_cursors.last_scrape_run = NULL
    → users.fit_scores_stale = TRUE (forces full rescore)
```

## Onboarding State (7 steps)
| Step | Screen | Completion Flag |
|---|---|---|
| 1 | Persona selection | users.persona set |
| 2 | Resume upload | resumes row created, Agent 3 triggered |
| 3 | Target roles | user_target_roles rows created |
| 4 | AI persona selection | users.ai_generated_persona selected |
| 5 | Preferences (city, work mode, salary) | users profile fields updated |
| 6 | Profile verification | users.onboarding_completed = TRUE |
| 7 | Platform connections (optional) | user_connections rows created |
| → | All agents complete | users.dashboard_ready = TRUE |
