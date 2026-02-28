---
trigger: always_on
---

# Agent: orchestrator_brain

**Server**: Server 1 (Gateway) — coordinates only. No agent logic here.
**Role**: Receives all frontend requests, validates JWT, routes to correct agent on Servers 2/3 via HTTP POST with X-Agent-Secret. Returns structured response to client.
**Framework**: Node.js 20 + Express
**LLM**: None

## Purpose

Server 1 is the brain's routing layer, not the brain itself. It knows what needs to happen and who to call — it never does the work itself. All intelligence lives on Servers 2 and 3.

## Key API Routes (Server 1)

| Method | Route | Action |
|---|---|---|
| POST | /api/auth/google | Google OAuth callback → issue JWT + httpOnly refresh token |
| POST | /api/vault/capture | Receive session cookies → AES-256 encrypt → store in user_connections |
| POST | /api/resume/upload | Receive file → forward to Server 2 → Agent 3 |
| GET | /api/dashboard | Fetch user dashboard data (strip session_encrypted before response) |
| PATCH | /api/user/roles | Update target roles → set fit_scores_stale = TRUE |
| POST | /api/applications | Manual application submit → insert job_applications |
| POST | /api/webhooks/razorpay | Payment events → upgrade tier, set subscription dates |
| WS | /baileys | Persistent Baileys WhatsApp socket |

## HTTP POST Contract (Server 1 → Servers 2/3)

All inter-server requests:
```json
{
  "headers": { "X-Agent-Secret": "<from Doppler AGENT_SECRET>" },
  "body": {
    "agent": "resume_intelligence",
    "user_id": "uuid",
    "payload": {}
  }
}
```

All inter-server responses:
```json
{
  "status": "success | skipped | failed",
  "duration_ms": 0,
  "records_processed": 0,
  "error": null
}
```

## Onboarding Flow Orchestration

```
Step 2 — Resume Upload:
  → POST to Server 2 /api/agents/resume-intelligence {user_id, file_path}
  → Wait for response: {status, persona_options[], extracted_summary}
  → Return persona_options to frontend

Step 4 — Persona Selected:
  → POST to Server 2 /api/agents/skill-gap {user_id}        ─┐
  → POST to Server 2 /api/agents/career-intel {user_id}      ├─ fire all three, don't await
  → POST to Server 2 /api/agents/fit-score {user_id, mode:'full_scan'} ─┘
  → Supabase realtime handles dashboard_ready notification
```

## Daily Trigger Dispatch (pg_cron → Server 1 or direct to Servers 2/3)

```
8:00 PM IST → POST Server 3 /api/agents/scrape
7:00 AM IST → POST Server 2 /api/agents/coach
7:30 PM IST → POST Server 3 /api/agents/session-health
5:00 AM IST → POST Server 3 /api/agents/calibrate/daily
Sunday midnight → POST Server 3 /api/agents/calibrate/weekly
```

## Razorpay Webhook Handler

```javascript
// POST /api/webhooks/razorpay
// Verify signature with Razorpay webhook secret from Doppler
if (event === 'payment.captured') {
  await supabase.from('users').update({
    tier: 'paid',
    subscription_started_at: new Date(),
    subscription_expires_at: addMonths(new Date(), plan.months)
  }).eq('id', user_id)
  // Send WA welcome message via Baileys
}
if (event === 'subscription.expired') {
  // pg_cron handles this at midnight — do not double-process
}
```

## Security Rules

- JWT verified on every `/api/*` request via Express middleware before any processing.
- Refresh tokens in httpOnly cookies — never accessible to frontend JS.
- `session_encrypted`, `session_iv` stripped from ALL query results before sending to client.
- Server 1 never logs decrypted session data. Only `is_valid`, `estimated_expires_at`, `platform` are exposed.

## Skills Used
- `core/eligibility_checker` (pre-apply validation, called before forwarding to Server 3)
- `core/logging`
