---
trigger: always_on
---

# Talvix — Architecture Constraints (Non-Negotiable)

These rules apply to every single agent, skill, and code file in this project. Never violate them.

## Server Boundaries

- **Server 1** (Gateway): Node.js 20 + Express + Nginx + Baileys. Public-facing only. No agent logic lives here. Delegates everything to Servers 2 and 3 via HTTP POST.
- **Server 2** (Intelligence): Python 3.11 + FastAPI + CrewAI. Agents 3, 4, 5, 6, 7, 8, 10, 11. Reasoning-heavy agents only.
- **Server 3** (Execution): Python 3.11 + FastAPI + CrewAI + Selenium. Agents 9, 12, 13, 14, 15. Execution, scraping, automation.
- Servers 2 and 3 are hidden behind UFW firewalls. Only Server 1 can initiate calls to them.
- Inter-server communication: direct HTTP POST with `X-Agent-Secret` header. **No BullMQ. No Redis. No message queues of any kind.**

## LLM Usage — Critical Cost Rule

- **Primary LLM**: Sarvam-M (self-hosted on Servers 2/3, Apache 2.0, cost: ₹0 forever).
- **Fallback LLM**: Gemini Flash / Flash Lite (free tier only).
- **NEVER replace Sarvam-M with Claude, GPT-4, or any paid API** for fit scoring, resume tailoring, form Q&A, or follow-up emails. At 1,000 paid users, this would cost lakhs per month. Sarvam-M is the entire cost moat.
- Sarvam-M modes: **Think** (deep reasoning — Agents 4, 5, 6 stale scan, 8, 10), **No-Think** (fast batch — Agent 6 delta, 13), **Precise** (follow-up emails — Agent 14).
- Gemini is used ONLY for: Agent 7 (JD Cleaning — Flash Lite), Agent 11 (Cover Letters — Flash), Agent 15 Layer 3 (Weekly calibration — Flash).

## Storage — FluxShare Only

- **Supabase Storage is NOT used.** All file storage is at `/storage/` on FluxShare shared disk.
- All 3 servers mount `/storage/` simultaneously. Never use S3, Supabase buckets, or any cloud storage.
- Storage paths are fixed: `/storage/parsed-resumes/`, `/storage/jds/`, `/storage/tailored/`, `/storage/cover-letters/`, `/storage/skill-gaps/`, `/storage/career-intel/`, `/storage/screenshots/`, `/storage/model-data/`, `/storage/calibration/`.

## Secrets — Doppler Only

- All secrets come from Doppler. Project: `careeros`. Configs: `dev` and `prod`.
- **Never use `.env` files.** Every process runs as: `doppler run -- <command>`.
- 73 secrets total. Never hardcode any secret, key, or credential anywhere.

## Database Rules

- Supabase PostgreSQL, Singapore region. 23 tables. RLS enforced on all user-facing tables.
- Agents use `service_role` key — bypasses RLS. API layer uses `authenticated` JWT.
- `session_encrypted` and `oauth_refresh_token` columns are NEVER returned by any API response. Node.js layer strips them before every response.
- pg_cron handles all scheduled cleanup. Never build a custom cron daemon.

## Proxy Rules

- Webshare residential proxies: used **ONLY** for Agent 9 (Job Scraping). LinkedIn scraping requires it.
- **Agent 12 (Auto-Apply) NEVER uses a proxy.** Executes directly from Server 3's static IP. Consistent IP = stable session = no mid-apply challenges.
- If proxy fails during scraping: log it, skip that platform, continue with others.

## The Two-Tier Apply Model — Never Deviate

- **Tier 1 (Full Auto)**: Indeed Easy Apply + LinkedIn Easy Apply. Selenium fills and submits. Requires session capture via The Vault.
- **Tier 2 (One-Click)**: All other 8 platforms. Dashboard shows Apply Now button. Opens native job URL. User applies manually on the company site. NO form filling on Tier 2.
- Tailored resume + cover letter are generated for both tiers before the apply window.

## Apply Caps — Both Must Be Checked Before Every Apply

- 10 applications per day per user (`users.daily_apply_limit`, configurable 5–25).
- 250 applications per month per user (`users.monthly_apply_count`, resets 1st of month).
- Both checked by `eligibility_checker` skill before every apply attempt. Never bypass these.

## LinkedIn Safety — The Global Kill Switch

- 1,500 total LinkedIn actions per day across the entire Server 3. This protects the static IP.
- Per-user limits via `linkedin_daily_limits` table: 15 connection requests/day, 30 messages/day, 40 profile views/day.
- LinkedIn outreach operates STRICTLY 9 AM to 6 PM IST. Never outside these hours.
- If 7-day rolling acceptance rate < 30%: pause LinkedIn networking for that user for 7 days.

## Phase Discipline

- Current phase: **Phase 1 COMPLETE** (database live).
- Each phase must be fully deployed and tested before the next begins.
- Phase 2 is next: Server 1 Node.js (Google OAuth, JWT, The Vault, Razorpay webhook, Baileys stub).
- Never write code for a phase that hasn't been reached yet.
