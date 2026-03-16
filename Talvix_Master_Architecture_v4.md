**TALVIX**

Complete Master Architecture

*Version 4.0 \| Status: Phase 5 Live (Updated Codebase Source of Truth)*

**AI-First Career Automation for India**

*Confidential --- Single Founder Build*

**1. PRODUCT OVERVIEW & BUSINESS MODEL**

Talvix is an AI-first career automation platform built specifically for India. It finds jobs, scores them against a user\'s profile, tailors resumes, applies automatically, and networks with recruiters --- all without user intervention once configured.

**1.1 The One-Line Pitch**

Talvix finds jobs, scores them, tailors your resume, applies automatically, follows up with recruiters --- all while you sleep.

**1.2 The Two-Tier Apply Model**

**This is the most critical product decision. NEVER deviate from it.**

  ------------------------------------------------------------------------
                **Tier 1 --- Full  **Tier 2 ---       **Scope**
                Auto**             One-Click**        
  ------------- ------------------ ------------------ --------------------
  Platforms     Indeed Easy        All other          Tier 1 = 2
                Apply + LinkedIn   platforms (Naukri, platforms. Tier 2 =
                Easy Apply ONLY    Glassdoor,         8 platforms.
                                   Foundit, Shine,    
                                   TimesJobs,         
                                   Cutshort,          
                                   Internshala,       
                                   Google Jobs)       

  Mechanism     Selenium fills and Dashboard shows    NO form filling on
                submits forms      Apply Now button.  Tier 2. URL redirect
                completely in the  Button opens       only.
                background         native job URL in  
                                   a new browser tab. 
                                   Nothing else.      

  User action   None after initial One tap on the     Tier 2 user applies
  needed        session capture    Apply Now button   manually on the
                                                      company site.

  Pre-work done Resume tailored +  Resume             Tailoring happens
                cover letter       pre-tailored +     regardless of tier.
                generated before   cover letter       
                apply window       pre-written,       
                                   displayed          
                                   alongside job card 
                                   for user reference 

  Requires      User must connect  Nothing. No        Session capture is
                Indeed + LinkedIn  session needed.    Tier 1 only.
                sessions via popup                    
                flow (The Vault)                      
  ------------------------------------------------------------------------

**1.3 Business Model**

  -----------------------------------------------------------------------
  **Tier**          **Price     **Price     **What They Get**
                    (excl.      (incl.      
                    GST)**      GST)**      
  ----------------- ----------- ----------- -----------------------------
  Free              ₹0          ₹0          Top 3 job matches/week,
                                            dashboard, basic WhatsApp
                                            commands

  Early Bird (3     ₹399        ₹470        Full platform --- active for
  months)                                   3 months from launch date

  Regular Monthly   ₹199        ₹234        Full platform --- monthly

  Regular Quarterly ₹499        ₹588        Full platform --- 3 months
  -----------------------------------------------------------------------

Full platform includes: Top 25 matches/week, Auto-Apply (250/month cap, 10/day cap), full WhatsApp command suite, AI coach, follow-up email + LinkedIn sequences.

-   Break-even: 10 paid users.
-   Cash-flow positive: Month 3.

**2. LAYER 1: INFRASTRUCTURE & STORAGE**

Three dedicated FluxCloud servers with static IPs. Fixed monthly cost regardless of traffic. Zero egress fees on bandwidth.

**2.1 Server Cluster**

  ------------------------------------------------------------------------------
  **Server**       **Spec**          **Role**        **Hosts**
  ---------------- ----------------- --------------- ---------------------------
  Server 1         2vCPU / 8GB RAM / Public-facing   Node.js 24 + Express API,
  (Gateway)        100GB SSD                         Baileys WhatsApp bot, Nginx
                                                     reverse proxy

  Server 2         8vCPU / 32GB RAM  Agent A         Python 3.12 + FastAPI +
  (Intelligence)   / 100GB SSD       pipeline        CrewAI --- all career
                                                     intelligence agents

  Server 3         8vCPU / 32GB RAM  Agent B         Python 3.11 + FastAPI +
  (Execution)      / 100GB SSD       pipeline        CrewAI --- scraping,
                                                     Selenium, follow-up agents
  ------------------------------------------------------------------------------

**2.2 Networking & Port Binding Rules**

-   No BullMQ. No Redis. No message queues of any kind.
-   Inter-server calls use direct HTTP POST with X-Agent-Secret header authentication.
-   Servers 2 and 3 are hidden behind UFW firewalls --- only Server 1 can reach them.
-   All 3 servers have static IPs. Server 3\'s static IP is the auto-apply identity for Indeed/LinkedIn --- never route apply traffic through proxies.
-   (*v4 Update*) **Port Binding Rule**: FluxCloud strictly expects applications to bind to `0.0.0.0:8080`. Hardcoding `localhost` or `3000` causes 503 HTTP Service Unavailable.

**2.3 Storage --- FluxShare**

Supabase Storage is NOT used. All file storage is on a shared FluxShare disk mounted at /storage/ --- accessible by all 3 servers simultaneously. Bandwidth is unlimited and never charged.

  ----------------------------------------------------------------------------------------------------
  **Path**                                        **Contents**   **TTL**       **Notes**
  ----------------------------------------------- -------------- ------------- -----------------------
  /storage/parsed-resumes/{user_id}.json.gz       Parsed resume  Permanent     \~3KB avg. Never
                                                  JSON                         deleted unless user
                                                                               deletes account.

  /storage/jds/{fingerprint}.txt                  Raw JD text    30 days       Deleted when parent job
                                                                               row is deleted from DB.

  /storage/skill-gaps/{user_id}.json.gz           Full skill gap Overwritten   In-DB summary is top 3
                                                  report                       only. Full report here
                                                                               for paid users.

  /storage/career-intel/{user_id}.json.gz         Full career    Overwritten   Career paths, full
                                                  intel                        analysis. Overwritten
                                                                               on each recalculation.

  /storage/tailored/{user_id}/{app_id}.pdf        Tailored       7 days        Paid users only.
                                                  resume PDF                   Cleaned by pg_cron
                                                                               after 7 days.

  /storage/cover-letters/{user_id}/{app_id}.txt   Cover letter   7 days        Paid users only.
                                                  text                         

  /storage/screenshots/{app_id}.png               Apply failure  7 days        Selenium failure
                                                  screenshots                  captures for debugging.

  /storage/model-data/weights_current.json        Live system    Permanent     23 tunable weights.
                                                  weights                      Overwritten by
                                                                               calibration agent.

  /storage/calibration/{run_id}.json.gz           Calibration    90 days       Full analysis from each
                                                  reports                      Sunday calibration run.
  ----------------------------------------------------------------------------------------------------

**2.4 Secrets Management & Container Reality**

-   (*v4 Update*) **FluxCloud Environment Injection**: While Doppler is still the *system of record* for organizing secrets (`careeros`), strict runtime execution (`doppler run --`) breaks in some FluxCloud container bootstraps because of missing tokens. Thus, Server 1 relies on Native Flux environment variables parsed locally into Node.js, and Server 2/3 utilize `os.environ.setdefault()` logic.
-   73 secrets total. Key groups: Supabase, Google OAuth, JWT/Encryption (AES-256 key), Razorpay, Sarvam API, Gemini API, Webshare proxy credentials, WhatsApp phone.

**3. LAYER 2: DATABASE & STATE**

Supabase PostgreSQL hosted in Singapore. 23 tables total. Strict Row Level Security (RLS) on all user-facing tables. pg_cron handles all scheduled cleanup and maintenance. Service role bypasses RLS --- used exclusively by agents.

**3.1 Table Groups**

  -----------------------------------------------------------------------
  **Group**         **Tables**                          **Purpose**
  ----------------- ----------------------------------- -----------------
  Core User         users, user_target_roles,           Identity,
                    user_company_prefs, resumes         preferences,
                                                        resume state

  Job Pool          jobs, job_sources, job_skills,      The active
                    scrape_runs                         150K-200K job
                                                        pool

  Scoring           job_fit_scores,                     Per-user fit
                    user_fit_score_cursors              scores with
                                                        weekly caps

  Applications      job_applications, user_connections, Apply state,
                    linkedin_daily_limits               encrypted
                                                        sessions, safety
                                                        counters

  Career Intel      skill_gap_results,                  AI analysis
                    career_intelligence,                outputs
                    salary_benchmarks                   

  Communication     notifications, wa_connect_tokens    Realtime alerts,
                                                        WA pairing

  Self-Learning     learning_signals,                   The
                    model_performance_snapshots,        self-improving
                    model_weights, ab_test_runs,        brain
                    prompt_versions, calibration_runs,  
                    system_health_metrics, agent_logs,  
                    wa_bot_health                       
  -----------------------------------------------------------------------

**3.2 The Active Job Pool --- How It Stays Healthy**

The job pool maintains 150K-200K active jobs at all times. This is a global pool --- scraped once nightly, scored against all users. Jobs have a full lifecycle.

**3.2.1 Job Lifecycle States**

  -----------------------------------------------------------------------
  **State**   **Condition**     **DB Flags**      **Action**
  ----------- ----------------- ----------------- -----------------------
  NEW         First time seen   is_new = TRUE,    Insert row. Triggers JD
              by scraper        is_active = TRUE  cleaning + fit scoring.

  REFRESHED   Seen again in a   last_seen_at      Update last_seen_at
              subsequent scrape updated. is_new   only. No re-scoring.
                                stays FALSE.      

  STALE       Not seen for 14   is_active = FALSE Marked inactive by
              days                                pg_cron at 4:30 AM.
                                                  Excluded from scoring
                                                  and auto-apply.

  DEAD        Not seen for 30   Row deleted       Hard DELETE from jobs
              days                                table at 4 AM. Cascades
                                                  to job_sources and
                                                  job_skills. Does NOT
                                                  cascade to
                                                  job_applications
                                                  (preserved for
                                                  history).
  -----------------------------------------------------------------------

**3.2.2 Fingerprint Deduplication**

Every scraped job receives a SHA-256 fingerprint before any DB write. This prevents the same job appearing twice because it was found on both Indeed and LinkedIn.

> fingerprint = SHA-256( title.lower() + company.lower() + city.lower() + employment_type )
>
> Excluded from fingerprint: salary, apply_url, posted_date
> Reason: these vary per platform for the same job.
>
> On upsert: ON CONFLICT (fingerprint) DO UPDATE SET last_seen_at = now()
> xmax = 0 → new job (INSERT) → is_new = TRUE
> xmax ≠ 0 → existing job (UPDATE) → is_new unchanged (stays FALSE)

**3.2.3 pg_cron Maintenance Schedule**

  -----------------------------------------------------------------------
  **Time        **Job**                      **SQL Action**
  (IST)**                                    
  ------------- ---------------------------- ----------------------------
  4:00 AM daily Delete dead jobs             DELETE FROM jobs WHERE
                                             last_seen_at \< now() -
                                             interval \'30 days\' AND
                                             is_active = false

  4:30 AM daily Mark stale jobs              UPDATE jobs SET is_active =
                                             false WHERE last_seen_at \<
                                             now() - interval \'14 days\'
                                             AND is_active = true

  Every hour    Expire fit scores            DELETE FROM job_fit_scores
                                             WHERE expires_at \< now()

  2:00 AM daily Cap fit scores               Free ≤ 3 rows, Paid ≤ 25
                                             rows per user (by fit_score
                                             DESC)

  Sunday        Weekly fit score reset       Delete previous week scores.
  midnight                                   Reset all user cursors. Set
                                             fit_scores_stale = true for
                                             all users.

  Every hour    Expire notifications         DELETE FROM notifications
                                             WHERE expires_at \< now()

  Every 5 min   Expire WA tokens             DELETE FROM
                                             wa_connect_tokens WHERE
                                             expires_at \< now() OR used
                                             = true

  Midnight      Expire paid subscriptions    UPDATE users SET tier =
  daily                                      \'free\', auto_apply_enabled
                                             = false WHERE
                                             subscription_expires_at \<
                                             now()

  1st of month  Reset monthly apply count    UPDATE users SET
                                             monthly_apply_count = 0

  3:00 AM daily Expire agent logs            DELETE FROM agent_logs WHERE
                                             expires_at \< now() (3d
                                             success TTL, 30d error TTL)

  Sunday 1:00   DPDP erasure execution       Flag users for deletion who
  AM                                         requested 30+ days ago
  -----------------------------------------------------------------------

**3.3 Fit Scoring State Logic**

Two distinct scoring modes exist. The mode is determined by the users.fit_scores_stale flag.

  -----------------------------------------------------------------------
  **Mode**          **When It Triggers**       **What Agent 6 Does**
  ----------------- -------------------------- --------------------------
  Stale Full Scan   User signs up, uploads new Scores user against ENTIRE
                    resume, or                 active job pool (all jobs
                    fit_scores_stale = TRUE    where is_active = TRUE).
                                               Resets fit_scores_stale =
                                               FALSE after completion.

  Delta-Only        All other runs             Scores user ONLY against
  (normal nightly)                             is_new = TRUE jobs from
                                               the latest scrape run.
                                               Uses
                                               user_fit_score_cursors to
                                               know which scrape run was
                                               last processed per user.
  -----------------------------------------------------------------------

-   Score threshold: only scores ≥ 40 are written to job_fit_scores. Scores below 40 are not stored.
-   Weekly caps enforced by pg_cron: Free users keep top 3 by fit_score. Paid users keep top 25.
-   The scrape_runs table records each scrape. user_fit_score_cursors tracks the last scrape_run each user was scored against.

**3.4 Session Lifecycle & Health**

User sessions (Indeed/LinkedIn cookies) expire in 7-14 days. The system monitors expiry proactively.
-   user_connections table tracks: session_encrypted, session_iv, estimated_expires_at, is_valid, warning_7d_sent, warning_3d_sent, consecutive_failures.
-   Daily health check: Agent 12 validates sessions before the apply window. If a session fails 3 consecutive apply attempts → auto_apply_paused = true.
-   7 days before expiry: WhatsApp alert + dashboard notification (warning_7d_sent = true).
-   3 days before expiry: Second warning (warning_3d_sent = true).
-   On expiry: auto_apply_paused = true. User must reconnect via the frontend popup flow to resume.
-   Session health is checked daily at 7:30 PM IST, 30 minutes before the apply window opens at 8 PM.

**4. LAYER 3: CORE BACKEND --- SERVER 1**

Server 1 is the public-facing gateway and orchestrator. It runs Node.js 24 + Express. All /api/\* routes require a valid JWT. No agent logic lives here --- Server 1 delegates to Servers 2 and 3.

**4.1 Authentication**
-   Google OAuth via Supabase Auth --- issues a short-lived JWT (15 min expiry) on successful login.
-   JWT verified on every /api/\* request via Express middleware.
-   Refresh tokens stored in httpOnly cookies --- never accessible to frontend JS.

**4.2 The Vault --- Session Capture**
This is how Tier 1 auto-apply gets authorized. Both LinkedIn and Indeed use session cookie capture --- NOT OAuth.
-   User clicks Connect on the frontend. A popup window opens to the platform\'s login page.
-   After the user logs in, the frontend captures the session cookies (li_at for LinkedIn, session cookies for Indeed) using a postMessage bridge.
-   Server 1 receives the raw cookies via POST /api/vault/capture.
-   Cookies are encrypted using AES-256-CBC. The AES key lives in Doppler, never in the DB.
-   Stored in user_connections: session_encrypted (encrypted blob) + session_iv (initialisation vector).
-   session_encrypted is NEVER returned by any API response. The Node.js layer strips it before all responses.
-   Frontend only ever sees: platform, is_valid, estimated_expires_at.

**4.3 WhatsApp Engine (Baileys)**
-   A single Baileys socket runs persistently on Server 1 using one Jio SIM number (fails safely with 405 error if unauthenticated).
-   Rate limited to 1 message per 1500ms to avoid WhatsApp flagging.

**3-Layer Security Gate on every inbound WA command:**
  -------------------------------------------------------------------------
  **Gate**   **Check**                  **Fail Behaviour**
  ---------- -------------------------- -----------------------------------
  1          Does this phone number     Silently ignore. No response sent.
             exist in users.wa_phone?   

  2          Has the user opted in to   Reply: \'Please connect your
             WhatsApp (wa_opted_in =    WhatsApp first via the Talvix
             true)?                     dashboard.\'

  3          Is this command a          Reply: \'This command requires a
             paid-only command? Is the  Talvix paid plan. Upgrade at
             user on paid tier?         talvix.in\'
  -------------------------------------------------------------------------

**4.4 Razorpay Webhooks**
-   POST /api/webhooks/razorpay handles payment events.
-   On payment.captured: update users.tier = \'paid\', set subscription_started_at and subscription_expires_at, send WhatsApp welcome.
-   On subscription.expired: revert to free tier via pg_cron (midnight daily check).

**5. LAYER 4A: CAREER INTELLIGENCE --- SERVER 2**

Server 2 hosts Agent A --- all reasoning-heavy intelligence agents.
Primary LLM: Sarvam-M (Apache 2.0 licence, self-hosted, ₹0 forever).
Fallback LLM: Gemini Flash/Flash Lite (free tier).

+-----------------------------------------------------------------------+
| **CRITICAL --- Never Replace Sarvam-M with Paid LLM APIs**            |
|                                                                       |
| -   (*v4 Update*) **Hard Guardrails**: If Sarvam goes down, the task  |
|     is marked `skipped`. It NEVER delegates routing context to Gemini.|
|     At 1,000 paid users, Claude/GPT would cost ₹1,50,000/month vs ₹0. |
|                                                                       |
| -   Sarvam-M is the entire cost moat. Protect it.                     |
|                                                                       |
| -   Gemini is ONLY a fallback for non-critical tasks (JD cleaning,    |
|     cover letters).                                                   |
+-----------------------------------------------------------------------+

**5.1 Sarvam-M Modes**

  -----------------------------------------------------------------------
  **Mode**      **Use Case**                 **Agents That Use It**
  ------------- ---------------------------- ----------------------------
  Think (deep   Complex analysis where       Agent 4 (Skill Gap), Agent 5
  reasoning)    accuracy is paramount        (Career Intel), Agent 6 (Fit
                                             Scoring --- stale scan mode)

  No-Think      High-volume batch scoring    Agent 6 (Fit Scoring ---
  (fast         where speed matters          delta mode, 100 jobs/call)
  inference)                                 

  Precise       Follow-up email generation,  Agent 14 (Follow-Up emails)
                cover letters                
  -----------------------------------------------------------------------

**5.2 OnBoarding Flow --- CareerPlannerFlow (CrewAI)**
When a user completes onboarding and uploads their resume, this CrewAI flow triggers:
> \@start → Agent 3 (Resume Intelligence)
> ↓
> and\_() parallel execution:
> Agent 4 (Skill Gap), Agent 5 (Career Intel), Agent 6 (Fit Scoring --- full scan)
> ↓
> users.dashboard_ready = TRUE
> Frontend receives realtime notification via Supabase JS

**5.3 Agent Specifications --- Server 2**

**Agent 3 --- Resume Intelligence**
-   Accepts: .pdf (PyPDF2) and .docx (python-docx)
-   Parses: skills\[\], experience_years, current_title, seniority_level, education, certifications
-   Generates: ai_generated_persona --- a rich 200-word personality + positioning string used throughout the system
-   Writes: parsed JSON to /storage/parsed-resumes/{user_id}.json.gz
-   Sets: users.fit_scores_stale = TRUE (triggers full re-score), users.onboarding_completed = TRUE

**Agent 4 --- Skill Gap Analyzer**
-   Input: parsed resume (from Storage) + job_skills junction table (top 50 jobs in user\'s role family)
-   Output: top 3 skill gaps with ROI ranking, estimated learning time, and specific resource suggestions.
-   Writes: top_gaps JSONB to skill_gap_results table. Full report to /storage/skill-gaps/{user_id}.json.gz.

**Agent 5 --- Career Intelligence**
-   Scores user 0-100 across 4 dimensions: skills match (30%), experience (25%), market demand (25%), salary positioning (20%).
-   Maps user\'s current salary to p25/p50/p75/p90 benchmarks from salary_benchmarks table.
-   Writes: career_score, salary percentiles to career_intelligence table.

**Agent 6 --- Fit Scoring**
**The highest-volume agent. Runs after every nightly scrape and on-demand for stale users.**
-   Pre-filtering (before any LLM call --- pure SQL + TF-IDF):
    -   SQL filter: WHERE role_family IN (target roles) AND seniority_level matches resume AND city_canonical IN (preferred cities).
    -   TF-IDF: score remaining jobs against resume keywords. Keep top N by cosine similarity.
    -   This reduces 200K jobs to \~100-300 per user before a single LLM token is spent.
-   LLM scoring: Sarvam-M NO-THINK mode. Batch size: 100 jobs per call.
-   Output per job: fit_score (0-100), fit_label, recommendation (apply/consider/skip), fit_reasons\[\], missing_skills\[\], strengths\[\]
-   Storage: only scores ≥ 40 written to job_fit_scores.
-   Cap: Free users --- top 3. Paid users --- top 25. Enforced by pg_cron on Sunday midnight.

**Agent 7 --- JD Cleaning**
**Runs on Server 2 immediately after Agent 9 (scraping) completes.**
-   Input: raw JD text from /storage/jds/{fingerprint}.txt
-   Strips: HTML boilerplate, repetitive legal disclaimers, formatting noise.
-   Extracts: required_skills\[\], nice_to_have_skills\[\]
-   Writes: 2-3 sentence jd_summary to jobs.jd_summary.
-   LLM: Gemini Flash Lite (cheap, sufficient for extraction tasks).

**Agent 8 --- Daily Coach**
-   Runs 7 AM IST daily for all paid users.
-   Generates a personalized career push message based on: recent applications, skill gaps, career score trajectory, market demand for their role.
-   Uses Sarvam-M Think mode with hyper-variant prompts.
-   Respects users.notif_prefs.quiet_hours_start/end.

**6. LAYER 4B: EXECUTION & STEALTH --- SERVER 3**

Server 3 hosts Agent B --- all execution agents. This server is where the platform\'s operational integrity lives. Selenium runs here. The static IP is the identity. Everything is designed to mimic human behaviour.

**6.1 Stealth Architecture**

+-----------------------------------------------------------------------+
| **The Digital Identity Vault**                                        |
|                                                                       |
| -   Every user gets a persistent User-Agent string assigned on first  |
|     apply.                                                            |
|                                                                       |
| -   Every user gets a persistent Canvas fingerprint seed.             |
|                                                                       |
| -   These NEVER rotate mid-session. Rotation = bot network signature  |
|     = instant ban.                                                    |
|                                                                       |
| -   Stored encrypted in user_connections alongside session cookies.   |
|                                                                       |
| -   Agent 12 strictly uses this identity for every apply action.      |
+-----------------------------------------------------------------------+

**6.1.1 Global Kill Switch**
-   system_daily_limits table enforces a hard cap of 1,500 LinkedIn actions per day across the ENTIRE server.
-   This protects Server 3\'s static FluxCloud IP from LinkedIn\'s server-side rate limiting.
-   When the cap is hit: no further LinkedIn actions for the rest of that UTC day. Counter resets at midnight UTC via pg_cron.

**6.1.2 Proxy Rules**
-   Webshare residential proxies (\$5/month): Used ONLY for Agent 9 (Job Scraping) to protect the static IP from scraping rate limits.
-   LinkedIn scraping within Agent 9 specifically requires the proxy.
-   Agent 12 (Auto-Apply) executes DIRECTLY from Server 3\'s static IP --- never through a proxy.

**6.1.3 Xvfb Framebuffer Boot**
-   Agent 12 headless mode triggers detection flags. Server 3 runs `Xvfb` via `/start.sh` so Chrome can literally pop a window in memory.

**6.2 Agent Specifications --- Server 3**

**Agent 9 --- Job Scraper**
-   Trigger: 8 PM IST daily (pg_cron → HTTP POST to Server 3)
-   Sources: JobSpy (5 platforms), Custom scrapers (5 platforms).
-   Execution: asyncio.gather() --- all 10 sources scraped concurrently.
-   Deduplication: SHA-256 fingerprint before any DB write. xmax detection sets is_new = TRUE on insert.
-   Expected yield: \~5,000-8,000 genuinely new jobs per nightly run.

**Agent 10 --- Resume Tailoring**
-   Triggered: when a new high-scoring job is found for a paid user (fit_score ≥ 75 for Tier 1 jobs).
-   Output: tailored .pdf resume saved to /storage/tailored/{user_id}/{app_id}.pdf
-   LLM: Sarvam-M Think mode.
-   (*v4 Humanize Framework*): Governed by `humanizer_prompt.py`. Strips all "delve/testament/landscape" AI-sounding vocab to prevent recruiter detection.
-   Constraint: never fabricate experience. Only reframe and reorder existing content.

**Agent 11 --- Cover Letter Generator**
-   LLM: Gemini Flash (saves Sarvam RPM for scoring).
-   Style: matches user\'s ai_generated_persona. (*v4 Humanize Framework applied*). No two cover letters share the same opening sentence.

**Agent 12 --- Auto-Apply**
**The most complex agent. Operates on a Dynamic Continuous Queue. Never batches all users at the same time.**
-   Window: 8 PM to 6 AM IST
-   Scheduling: each user gets a randomized apply slot determined by hash(user_id + date). Jitter ±15 minutes applied.
-   Apply caps: 10 applications per day per user, 250 applications per month per user.
-   Review Mode: active for first 14 days after auto_apply_activated_at. User must approve via dashboard before submission.
-   Platform order: prioritizes highest fit_score jobs first.
-   Failure handling: on CAPTCHA → log, mark auto_status = \'failed_captcha\', increment retry_count. On 3 consecutive failures of the same type → pause user\'s auto-apply (auto_apply_paused = true).

**Agent 13 --- Form Q&A**
-   Scope: Tier 1 ONLY.
-   Called inline during Agent 12 execution when a custom question field is detected on the apply form.
-   LLM: Sarvam-M No-Think mode (fast, inline).

**Agent 14 --- Follow-Up**
-   Email Track: Gmail scan runs hourly. Reads inbox for replies. Follow-up schedule: Day 7, Day 14, Day 21 (9 AM to 11 AM IST). LLM: Sarvam-M Precise. (*v4 Humanize Framework Applied*).
-   LinkedIn Networking Track: STRICTLY 9 AM to 6 PM IST only. Connection requests: max 15/day/user. Messages to 1st-degree connections: max 30/day/user. Profile views: max 40/day/user.

**Agent 15 --- Feedback Calibration**
**The self-learning brain. Three layers of learning with hard safety bounds.**
-   Layer 1 --- Real-Time Signal Capture: Every meaningful event writes a row to learning_signals.
-   Layer 2 --- Daily Micro-Adjustments (5 AM IST daily): Reads learning_signals from last 7 days. Makes small safe adjustments to model_weights (max 5% change per weight per day constraint).
-   Layer 3 --- Weekly Deep Calibration (Sunday midnight): Requires minimum 50 outcome signals. Full analysis. LLM used: Gemini Flash.

**7. LAYER 5: USER FLOWS --- FRONTEND**

**React 18 + Next.js 14 + Tailwind + Zustand**. Hosted on Vercel. Communicates exclusively with Server 1\'s /api/\* endpoints. Never directly touches Supabase DB (except realtime notifications).
-   (*v4 Update*) **Next.js Transition**: Officially migrated from Vite to Next.js for better Server-Side Rendering pipelines and native Vercel integrations. 

**7.1 4-State User Matrix**

  ------------------------------------------------------------------------------
  **State**   **Tier**   **WhatsApp**   **Gets**
  ----------- ---------- -------------- ----------------------------------------
  1           Free       Not connected  Dashboard, top 3 job matches per week,
                                        basic features only

  2           Free       Connected      State 1 + WA job alerts, basic WA
                                        commands

  3           Paid       Not connected  Top 25 matches, auto-apply, AI coach,
                                        follow-up sequences (no WA alerts)

  4           Paid       Connected      Full platform --- everything. This is
                                        the target state.
  ------------------------------------------------------------------------------

**7.2 7-Step Onboarding**

  ---------------------------------------------------------------------------
  **Step**   **Screen**           **Details**
  ---------- -------------------- -------------------------------------------
  1          Persona Selection    User selects one: Student, Early Career,
                                  Professional, Career Switcher, Returning to
                                  Work, Freelancer. Stored in users.persona.

  2          Resume Upload        .pdf or .docx. Triggers Agent 3 (Resume
                                  Intelligence) immediately. Upload must
                                  succeed before proceeding.

  3          Target Roles         User enters up to 5 target roles. Stored in
                                  user_target_roles junction table with
                                  role_family normalization.

  4          AI Persona Selection Agent 3 generates 3 ai_generated_persona
                                  options. User selects one. This persona is
                                  used in cover letters, follow-up emails,
                                  and coach messages.

  5          Preferences          Preferred cities (multi-select), work mode
                                  (remote/hybrid/onsite/any), expected salary
                                  range, employment type preference.

  6          Profile Verification Review extracted experience years, current
                                  title, top skills. User corrects any
                                  parsing errors. Writes back to users table.

  7          Platform Connections Optional. Indeed + LinkedIn session capture
                                  (The Vault) for Tier 1 auto-apply. Gmail +
                                  Calendar OAuth for follow-up + interview
                                  scheduling. All connections are optional.
  ---------------------------------------------------------------------------

**7.3 Dashboard --- Realtime Updates**
-   Subscribes to the notifications table via Supabase JS realtime. Toast notifications and bell badge update instantly without page refresh.
-   Job cards show: company logo, title, fit score, fit label, match reasons (paid), apply button (Tier 1 auto-queued / Tier 2 one-click).
-   Free users: top 3 job cards visible. Remaining cards shown blurred with a padlock icon and upgrade prompt.
-   Application tracker: shows status for all submitted applications with timeline.

**8. THE 12 BUILD PHASES**

Each phase must be fully deployed and tested before the next begins.
Phase 1-4 are Complete. Phase 5 is active.

  ---------------------------------------------------------------------------
  **\#**   **Phase Name**         **Key Deliverable**
  -------- ---------------------- -------------------------------------------
  ✅ 1     Database Foundation    Supabase schema live --- all 23 tables,
                                  RLS, pg_cron jobs, seed data.

  ✅ 2     Server 1 --- Node.js   Google OAuth, JWT middleware, AES-256
                                  helpers (The Vault), Razorpay webhook,
                                  Baileys WA init, 3-layer security gate.

  ✅ 3     Agent Service Core     FastAPI on Servers 2 + 3, CrewAI setup,
                                  Agent 3 (Resume Intelligence) live ---
                                  first user can onboard.

  ✅ 4     Career Intelligence    Agents 4, 5, 6 live --- Skill Gap, Career
                                  Intel, Fit Scoring. CareerPlannerFlow
                                  complete. Dashboard_ready flow works.

  🔨 5     React/Next Frontend    7-step onboarding UI, dashboard UI, Zustand
                                  state, Supabase realtime subscription, job
                                  cards (with blur/padlock for free users).

  6        Job Pool               Agent 9 (Scraping --- 10 platforms live) +
                                  Agent 7 (JD Cleaning). Nightly 8 PM scrape
                                  running. Pool reaching 150K+ jobs.

  7        Auto-Apply System      Agent 12 (Selenium, dynamic queue) +
                                  Session Capture UI (The Vault popup) +
                                  Digital Identity Vault + Agent 13 (Form Q&A).

  8        Resume & Cover Letter  Agents 10 + 11 live. Tailored resume
                                  generation working. Cover letter generation
                                  working. 

  9        WhatsApp System        Baileys socket stable, QR connect flow
                                  working, all WA commands live, 3-layer
                                  security gate enforced.

  10       Follow-Up & Interview  Agent 14 live --- Gmail hourly scan
                                  working, Day 7/14/21 email sequence
                                  running, LinkedIn networking 9 AM-6 PM IST.

  11       Self-Learning          Agent 15 live --- Layer 1 signal capture
                                  running, Layer 2 daily micro-adjustments at
                                  5 AM, Layer 3 Sunday midnight calibration.

  12       Production Hardening   FluxCloud 3-server deployment, UFW
                                  firewalls, Let\'s Encrypt SSL, static IP
                                  whitelisted in Supabase.
  ---------------------------------------------------------------------------

**9. COMPLETE TECH STACK**

  ----------------------------------------------------------------------------
  **Layer**          **Technology**        **Monthly       **Notes**
                                           Cost**          
  ------------------ --------------------- --------------- -------------------
  Frontend           Next.js 14 + React    ₹0              Hosted on Vercel
                     18 + Tailwind +                       free tier
                     Zustand               

  Gateway Server     Node.js 24 +          \~₹191          FluxCloud
                     Express + Nginx       (\~\$2.29)      2vCPU/8GB/100GB SSD

  Intelligence       Python 3.12 +         \~₹339          FluxCloud
  Server             FastAPI + CrewAI      (\~\$4.07)      8vCPU/32GB/100GB
                                                           SSD

  Execution Server   Python 3.11 +         \~₹339          FluxCloud
                     FastAPI + CrewAI +    (\~\$4.07)      8vCPU/32GB/100GB
                     Selenium + Xvfb                       SSD

  Database           Supabase PostgreSQL   ₹0 → \$25 at    Free tier: 500MB
                     (Singapore)           34K users       DB. Pro: 8GB.

  Primary LLM        Sarvam-M (Think /     ₹0 forever      Apache 2.0,
                     No-Think / Precise)                   self-hosted on
                                                           Server 2/3

  Fallback LLM       Gemini Flash / Flash  ₹0 (free tier)  JD cleaning, cover
                     Lite                                  letters,
                                                           calibration

  WhatsApp           Baileys (unofficial   ₹350/month (Jio ₹0 per message.
                     WA Web API)           SIM)            Self-hosted bot.

  Payments           Razorpay              2% per          No monthly fee
                                           transaction     

  Secrets            Doppler               ₹0 (free tier)  73 secrets across
                                                           dev + prod configs

  Proxy              Webshare residential  \~₹415          Scraping ONLY. Not
                                           (\~\$5/month)   used for
                                                           auto-apply.

  Auth               Google OAuth via      ₹0              Short-lived JWT,
                     Supabase Auth                         httpOnly refresh
                                                           tokens
  ----------------------------------------------------------------------------

**9.1 Day 1 Cost Summary**

  -----------------------------------------------------------------------
  **Component**                       **Monthly (₹)**   **Annual (₹)**
  ----------------------------------- ----------------- -----------------
  FluxCloud --- 3 servers (6-month    \~870             \~10,440
  contract)                                             

  Webshare proxy                      \~415             \~4,980

  Jio SIM (WhatsApp bot)              \~350             \~4,200

  Supabase (free until 34K users)     ₹0                ₹0

  All LLMs, Auth, Frontend hosting    ₹0                ₹0

  TOTAL                               \~₹1,635          \~₹19,620
  -----------------------------------------------------------------------

**9.2 GitHub Repository**
-   URL: https://github.com/Elvio11/NEXTFRONTEND
-   Structure: Contains 4 separate worktrees for Phase decoupled building.

**9.3 Pending Configuration (fill when services ready)**
-   Domain (talvix.in) → update Supabase auth redirect URLs + Google OAuth allowed origins + Doppler prod SERVER_URL
-   FluxCloud static IPs → whitelist in Supabase Dashboard → Database → Network Restrictions
-   Razorpay live keys → swap test keys in Doppler prod config
-   Jio SIM phone number → update WA_BOT_PHONE in Doppler prod
-   Webshare credentials → update PROXY_HOST, PROXY_USER, PROXY_PASS in Doppler prod
