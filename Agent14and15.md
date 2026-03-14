================================================================================
TALVIX — FIX 1: CREATE AGENT 14 (FOLLOW-UP SENDER) + AGENT 15 (FEEDBACK CALIBRATOR)
Branch: branch-server3
Target files:
  branch-server3/agents/agent14_follow_up.py
  branch-server3/agents/agent15_calibrator.py
================================================================================

## CONTEXT

You are implementing two missing agents on Server 3 (Python 3.11 + FastAPI).
Both files are confirmed absent from the codebase. All other agents 1–13 are
present and passing audit. These two are the only blockers for Phase 6 launch.

Copy the structural patterns from existing passing agents:
  branch-server3/agents/agent9_scraper.py   (for async + storage pattern)
  branch-server3/agents/agent8_coach.py     (for LLM + log_utils pattern)

## MANDATORY CONSTRAINTS (non-negotiable — audit will verify)

1. SECRETS: Never os.environ.get(). Always os.environ["KEY_NAME"].
   Hard fail on missing secret — never silent null.

2. LOGGING: Every function must call log_utils.agent_logger at entry and in
   finally block. Zero bare except: clauses. Use structured JSON log format
   matching existing agents.

3. STORAGE: All file I/O via skills/storage_client.py only.
   Never write to local filesystem. Never /tmp/. Never /storage/ paths directly.

4. DB: Use service_role Supabase client (imported from db/client.py or
   equivalent existing pattern). Never re-initialise the client.

5. AUTH: Every router endpoint must validate X-Agent-Secret header via the
   existing verify_agent_secret dependency used in other routers.

6. LINKEDIN KILL SWITCH: Agent 14 sends LinkedIn messages. Before any LinkedIn
   action, query system_daily_limits WHERE date = CURRENT_DATE.
   If total_linkedin_actions >= threshold from DB: abort, log skip,
   return {"status": "skipped", "reason": "linkedin_rate_limit"}.
   Do NOT read threshold from env var — read from system_daily_limits table.

7. SARVAM-M PRIMARY LLM: If Sarvam-M call fails or is unavailable:
   set status='skipped', log the failure, return {"status": "skipped"}.
   NEVER silently fall back to Gemini or any paid LLM for Sarvam tasks.
   Agent 15 uses Gemini Flash — that is correct and intentional.

8. TIMESTAMPS: All datetime values must be timezone-aware UTC.
   Use datetime.now(timezone.utc). Never naive datetime. All Supabase inserts
   use TIMESTAMPTZ.

9. AGENT LOGS TABLE: Write to agent_logs at start (log_start) and in finally
   block (log_end). Set expires_at at INSERT time:
     success → NOW() + INTERVAL '3 days'
     failed  → NOW() + INTERVAL '30 days'
   Never rely on pg_cron to clean logs.

10. RESPONSE CONTRACT: All endpoints return:
    {"status": "success|skipped|failed", "duration_ms": int,
     "records_processed": int|null, "error": str|null}

================================================================================
## FILE 1: branch-server3/agents/agent14_follow_up.py
================================================================================

### Agent 14 — Follow-Up Sender
LLM: Sarvam-M Precise (temperature=0.2)
Trigger: HTTP POST /tasks/followup (called by pg_cron hourly sweep)

### What it does:

EMAIL SEQUENCE (via Gmail OAuth — user's own Gmail account):
  Reads job_applications where:
    - auto_status = 'applied'
    - follow_up_stage IN (0, 1, 2)  [0=none sent, 1=first sent, 2=second sent]
    - applied_at <= NOW() - appropriate interval per stage:
        stage 0 → 5–7 days after applied_at
        stage 1 → 12–14 days after applied_at
        stage 2 → 21 days after applied_at
    - follow_up_stopped = FALSE
    - user.subscription_tier = 'paid'

  For each eligible application:
    1. Fetch user profile, job details, company name from DB
    2. Check Gmail thread for replies using Gmail API
       (user's OAuth token from user_connections — decrypt via AES key)
       If reply detected: set follow_up_stopped=TRUE, stage stays, skip email
    3. Generate email via Sarvam-M Precise:
       Stage 0 email: brief check-in, express continued interest (~100 words)
       Stage 1 email: add value, reference a project or skill (~120 words)
       Stage 2 email: final close loop, graceful sign-off (~80 words)
    4. Send via Gmail API using user's OAuth token
    5. Update job_applications:
       follow_up_stage += 1
       follow_up_last_sent_at = NOW()
       If stage was 2: follow_up_stopped = TRUE (sequence complete)
    6. Insert learning_signal (type='follow_up_sent')

STOP CONDITIONS (check before sending any email):
  - Reply detected in Gmail thread → follow_up_stopped = TRUE
  - Rejection keyword in subject/body: ["rejected", "unfortunately", "not moving forward",
    "other candidates", "position filled"] → follow_up_stopped = TRUE
  - User manual stop → follow_up_stopped already TRUE, skip
  - Job is_active = FALSE → skip

LINKEDIN SEQUENCE:
  Reads job_applications where:
    - auto_status = 'applied'
    - li_connection_sent = FALSE
    - applied_at >= NOW() - INTERVAL '21 days'
    - user.subscription_tier = 'paid'

  Check LinkedIn kill switch before any action (constraint 6 above).

  Per application:
    1. Look up recruiter via LinkedIn search (company + role title)
    2. Send connection request (cap: 15/day per user — read from model_weights)
    3. Set li_connection_sent = TRUE, li_connection_sent_at = NOW()

  Reads job_applications where:
    - li_connection_sent = TRUE
    - li_message_sent = FALSE
    - li_connection_accepted = TRUE  (webhook or poll sets this)
    - li_connection_sent_at <= NOW() - INTERVAL '2 days'

  Per application:
    1. Generate personalised message via Sarvam-M Precise (~60 words)
    2. Send message (cap: 30/day per user — read from model_weights)
    3. Set li_message_sent = TRUE, li_message_sent_at = NOW()
    4. Increment system_daily_limits.total_linkedin_actions via existing RPC

INTERVIEW DETECTION (runs on every sweep, not just follow-up sends):
  Scan Gmail threads for keyword triggers in subject or body:
    ["interview", "call scheduled", "meet with", "video call", "phone screen",
     "we'd like to", "invitation to interview", "next steps"]

  On detection:
    1. Update job_applications.interview_detected = TRUE
    2. Update job_applications.interview_detected_at = NOW()
    3. Create Google Calendar event (via Google Calendar API, same OAuth token)
    4. Insert notification record for user (type='interview_detected')
    5. HTTP POST to Server 1 /internal/notify (X-Agent-Secret header)
       to trigger WhatsApp/Telegram alert to user
    6. Draft thank-you email template (via Sarvam-M Precise), store in
       job_applications.thank_you_draft (TEXT column)

### DB tables read:
  job_applications, user_connections, users, jobs, model_weights,
  system_daily_limits

### DB tables written:
  job_applications (stage, stopped, li_* fields, interview fields)
  learning_signals, agent_logs, notifications
  system_daily_limits (via existing increment RPC)

### Doppler secrets used:
  AGENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  SARVAM_API_KEY, AES_SESSION_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### FastAPI router:
  POST /tasks/followup
  Returns standard response contract (constraint 10)

================================================================================
## FILE 2: branch-server3/agents/agent15_calibrator.py
================================================================================

### Agent 15 — Feedback Calibrator
LLM: Gemini Flash (NOT Sarvam-M — this is intentional and correct)
Triggers:
  - HTTP POST /tasks/calibrate/daily   (called by pg_cron 5AM IST)
  - HTTP POST /tasks/calibrate/weekly  (called by pg_cron Sunday midnight IST)

### What it does:

LAYER 2 — DAILY MICRO-ADJUSTMENT (endpoint: /tasks/calibrate/daily):
  Minimum required signals: 10 (if < 10: log skip, return skipped)

  1. Pull learning_signals from last 7 days:
     SELECT * FROM learning_signals WHERE created_at >= NOW() - INTERVAL '7 days'

  2. Compute callback rate per dimension:
     - By platform (indeed, linkedin, naukri, etc.)
     - By seniority level (entry, mid, senior)
     - By persona (student, professional, switcher, returning, freelancer)

  3. For each model_weight in DB (per user where applicable):
     a. Compare current weight against signal-implied optimal
     b. Compute delta (max ±5% of current value per day — hard cap)
     c. Clamp to weight's min_value/max_value bounds from DB
     d. UPDATE model_weights SET weight_value = new_value,
        updated_at = NOW() WHERE weight_key = X

  4. Insert calibration_run record:
     {run_type: 'daily', signals_used: N, weights_adjusted: N,
      summary: {}, created_at: NOW()}

  5. Log to agent_logs (log_start at entry, log_end in finally)

LAYER 3 — WEEKLY DEEP CALIBRATION (endpoint: /tasks/calibrate/weekly):
  Minimum required signals: 50 (if < 50: log skip, return skipped)

  1. Pull learning_signals from last 30 days

  2. Send to Gemini Flash for full regression analysis:
     Prompt: provide all signals as structured JSON, ask for:
     - Which weight combinations correlate with highest callback rate
     - Which prompt_versions performed best
     - Recommended weight adjustments (bounded to max ±20% from current)
     - Confidence score per recommendation

  3. Apply weight adjustments from Gemini analysis:
     - Each adjustment bounded to weight's min_value/max_value
     - Max 20% shift per weight (weekly cap, harder than daily)
     - Only apply if Gemini confidence score >= 0.7

  4. Check if callback rate improved >= 10% week-over-week:
     If yes: update prompt_versions (set is_active=TRUE for new version)

  5. Insert model_performance_snapshot:
     {week_start, week_end, avg_callback_rate, weights_snapshot JSONB,
      signals_count, top_performing_persona, top_performing_platform}

  6. Insert calibration_run record:
     {run_type: 'weekly', signals_used: N, weights_adjusted: N,
      gemini_confidence: float, summary: {}, created_at: NOW()}

  7. HTTP POST to Server 1 /internal/notify with founder summary
     (type='calibration_complete', payload includes key metrics)

### DB tables read:
  learning_signals, model_weights, prompt_versions, users

### DB tables written:
  model_weights, calibration_runs, model_performance_snapshots,
  prompt_versions, agent_logs, notifications

### Doppler secrets used:
  AGENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

### FastAPI routers:
  POST /tasks/calibrate/daily
  POST /tasks/calibrate/weekly
  Both return standard response contract (constraint 10)

================================================================================
## VALIDATION CHECKLIST (run after implementation)
================================================================================

[ ] agent14_follow_up.py exists at branch-server3/agents/
[ ] agent15_calibrator.py exists at branch-server3/agents/
[ ] Both files import from log_utils (not raw logging)
[ ] Both files import storage_client from skills/storage_client
[ ] Both files use os.environ["KEY"] not os.environ.get()
[ ] Both files use datetime.now(timezone.utc) — no naive datetime
[ ] Agent 14 checks LinkedIn kill switch via system_daily_limits table query
[ ] Agent 14 uses Sarvam-M Precise for all email/message generation
[ ] Agent 15 uses Gemini Flash (correct — not Sarvam-M)
[ ] Agent 15 Layer 2 skips if signals < 10
[ ] Agent 15 Layer 3 skips if signals < 50
[ ] Both routers validate X-Agent-Secret via existing verify dependency
[ ] Both return {"status", "duration_ms", "records_processed", "error"}
[ ] agent_logs written at start and in finally block on both agents
[ ] expires_at set at INSERT time (3 days success / 30 days failed)
[ ] Zero bare except: clauses in either file

================================================================================