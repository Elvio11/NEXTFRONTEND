# Events Architecture

## Event Flow Overview
Talvix is event-driven but uses NO message queues (no BullMQ, no Redis, no RabbitMQ). Events are triggered via direct HTTP POST between servers, pg_cron scheduled jobs, and DB state flags that agents poll.

## Event Categories

### 1. User-Triggered Events (real-time)
| Event | Source | Triggered Action |
|---|---|---|
| Resume uploaded | Frontend → Server 1 POST /api/resume/upload | Agent 3 (Resume Intelligence) on Server 2 |
| Platform connected (vault) | Frontend → Server 1 POST /api/vault/capture | AES-256 encrypt + store in user_connections |
| Target roles changed | Frontend → Server 1 PATCH /api/user/roles | Set fit_scores_stale = TRUE |
| Manual application submitted | Frontend → Server 1 POST /api/applications | Insert job_applications, log signal |
| Notification marked read | Frontend → Server 1 PATCH /api/notifications/{id} | Update status = 'read' |
| Payment captured | Razorpay webhook → Server 1 POST /api/webhooks/razorpay | Upgrade tier, set subscription dates, send WA welcome |
| WA command received | Baileys socket → Server 1 handler | Parse command, 3-gate security, route to agent |

### 2. Scheduled Events (pg_cron)
| Schedule | Job | Target |
|---|---|---|
| 8 PM IST daily | Scrape trigger | Server 3 POST /api/agents/scrape |
| After scrape complete | JD cleaning trigger | Server 2 POST /api/agents/jd-clean |
| After JD cleaning complete | Fit scoring trigger (delta) | Server 2 POST /api/agents/fit-score |
| 7 AM IST daily | Daily coach trigger | Server 2 POST /api/agents/coach |
| 7:30 PM IST daily | Session health check | Server 3 POST /api/agents/session-health |
| 5 AM IST daily | Layer 2 calibration | Server 3 POST /api/agents/calibrate/daily |
| Sunday midnight IST | Weekly reset + Layer 3 calibration | Server 3 POST /api/agents/calibrate/weekly |

### 3. Agent Chain Events (server-to-server HTTP POST)
```
Agent 9 completes scrape
  → Server 3 POST to Server 2: /api/agents/jd-clean {scrape_run_id}
  
Agent 7 completes JD cleaning
  → Server 2 POST to self: /api/agents/fit-score {scrape_run_id, mode: 'delta'}

Agent 3 completes resume parse (onboarding)
  → Server 2 triggers CrewAI and_() parallel:
      POST /api/agents/skill-gap {user_id}
      POST /api/agents/career-intel {user_id}
      POST /api/agents/fit-score {user_id, mode: 'full_scan'}
  → All 3 complete → users.dashboard_ready = TRUE
  → Supabase realtime pushes to frontend
  
Agent 12 queues an apply
  → Triggers Agent 10 (Resume Tailoring) + Agent 11 (Cover Letter) if fit_score >= 75
  → Agent 10 completes → job_applications.tailored_resume_path updated
  → Agent 11 completes → job_applications.cover_letter_path updated
  → Agent 12 proceeds with apply
```

### 4. DB-State-Driven Events (agents poll on schedule)
| Flag | Table | Meaning | Agent Response |
|---|---|---|---|
| fit_scores_stale = TRUE | users | New resume or roles changed | Agent 6 runs full scan for this user next cycle |
| jd_cleaned = FALSE | jobs | New job, JD not yet processed | Agent 7 picks this up in its queue |
| scoring_complete = FALSE | scrape_runs | Scrape done, fit scoring not run | Agent 6 picks this up |
| auto_status = 'queued' | job_applications | Review mode: user hasn't approved | Agent 12 skips until approved or review_mode expires |
| is_valid = FALSE | user_connections | Session expired | Agent 12 skips user. WA alert sent. |

## Realtime to Frontend
- Supabase JS realtime subscription on notifications table
- When new notification row inserted for user_id → toast on dashboard
- When dashboard_ready = TRUE → CareerPlannerFlow completion notification
- No polling — pure Supabase realtime push
