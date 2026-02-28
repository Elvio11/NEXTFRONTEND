# Execution Model

## Core Execution Principles

### No Queues, No Redis
There are no message queues of any kind in Talvix. No BullMQ. No Redis. No RabbitMQ. Inter-agent communication is direct HTTP POST with X-Agent-Secret header authentication. State lives in Supabase. This keeps the stack simple and cost at zero.

### Dynamic Continuous Queue (Auto-Apply)
Agent 12 does NOT batch all users at a fixed time. Each user gets a deterministic apply slot:

```python
slot_offset_minutes = hash(user_id + date_string) % 600  # 0 to 600 min within the 8PM-6AM window
apply_at = 20:00 IST + slot_offset_minutes
```

This spreads apply load across the full 10-hour window and prevents LinkedIn/Indeed from seeing a suspicious burst of identical-IP apply traffic.

### CrewAI Framework (Servers 2 and 3)
- CareerPlannerFlow: sequential + parallel with and_() for onboarding pipeline
- Individual agents run as CrewAI Crew or Task objects depending on complexity
- No CrewAI for single-function skills (form_answerer, deduplicator, session_validator) — pure Python functions

### asyncio Concurrency (Agent 9 Scraping)
```python
await asyncio.gather(
    scrape_indeed(), scrape_naukri(), scrape_linkedin(),
    scrape_glassdoor(), scrape_google(), scrape_internshala(),
    scrape_foundit(), scrape_shine(), scrape_timesjobs(), scrape_cutshort()
)
```
All 10 platforms scraped concurrently. Total expected runtime: 15-25 minutes.

## Apply Session Model

### Tier 1 — Full Auto (Indeed + LinkedIn Easy Apply)
1. eligibility_checker: verify daily/monthly caps + session valid
2. session_validator: load session_encrypted from DB, decrypt with AES-256 key from Doppler
3. selenium_apply: launch headless Chrome on Xvfb, inject session cookies
4. form_answerer: called inline if custom question detected
5. Submit form → screenshot on failure
6. Update job_applications: status, auto_status, retry_count
7. Write learning_signals: application_submitted event

### Tier 2 — One-Click (all other platforms)
1. User taps Apply Now on dashboard
2. Server 1 opens native job URL in browser (redirect)
3. Resume + cover letter displayed alongside for manual copy-paste
4. No Selenium. No session. No form filling.

## LLM Execution Strategy

| Task | LLM | Mode | Reason |
|---|---|---|---|
| Fit scoring (full scan) | Sarvam-M | Think | Accuracy for user's initial full assessment |
| Fit scoring (delta, nightly) | Sarvam-M | No-Think | Speed — 100 jobs/call, must complete before 6 AM |
| Skill gap analysis | Sarvam-M | Think | Complex gap analysis requires reasoning |
| Career intelligence | Sarvam-M | Think | 4-dimension scoring requires reasoning |
| Resume tailoring | Sarvam-M | Think | Keyword alignment must be precise |
| Form Q&A (inline apply) | Sarvam-M | No-Think | Inline during Selenium — cannot add latency |
| Follow-up emails | Sarvam-M | Precise | Tone control, deliverability, uniqueness |
| Daily coach | Sarvam-M | Think | Personalised, not templated |
| JD cleaning | Gemini Flash Lite | — | Extraction task, Gemini sufficient, saves Sarvam RPM |
| Cover letters | Gemini Flash | — | Sufficient quality, saves Sarvam RPM |
| Weekly calibration | Gemini Flash | — | Analysis task during low-traffic window |

### The Sarvam-M Cost Moat
At 1,00,000 users: Sarvam-M costs ₹0/month (self-hosted, Apache 2.0). Gemini equivalent would cost ~₹4L/month. This is the core unit economics that makes Talvix viable at ₹199/month pricing. Never replace Sarvam-M with paid LLM APIs.

## Error Handling Model
- Every agent wraps execution in try/except
- On failure: log to agent_logs (status = 'failed', error_message, 30-day TTL)
- On success: log to agent_logs (status = 'completed', 3-day TTL)
- Agent retry: max 3 attempts for apply failures, 1 attempt for scoring/analysis
- Critical failures (session invalid, CAPTCHA 3x): escalate to WhatsApp alert to user
