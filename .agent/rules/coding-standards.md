---
trigger: always_on
---

# Talvix — Coding Standards

## Language & Runtime

- **Server 1**: Node.js 20, Express 4.x. TypeScript optional but preferred.
- **Servers 2 & 3**: Python 3.11. FastAPI for HTTP endpoints. CrewAI for agent orchestration.
- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand. Hosted on Vercel free tier.

## Error Handling

- Every agent run must write to `agent_logs` table: status (`started`, `completed`, `failed`, `skipped`), `duration_ms`, token counts, `error_message` if failed.
- Success log TTL: 3 days. Error log TTL: 30 days. Set `expires_at` at INSERT time.
- On CAPTCHA detection: set `auto_status = 'failed_captcha'`, increment `retry_count`. After 3 consecutive failures of the same type: set `auto_apply_paused = TRUE`, send WhatsApp alert.
- Never let an agent failure cascade silently. Every failure must be logged and surfaced.

## Database Access Patterns

- All DB access via Supabase client with `service_role` key from Doppler.
- Never write raw SQL from agent code unless it's a complex upsert or pg_cron job.
- Use Supabase JS client (Server 1) or `supabase-py` (Servers 2/3).
- All timestamps in UTC. Display in IST on frontend only.

## File I/O — MinIO Only

- **All file reads/writes go through MinIO (S3-compatible).** Direct `/storage/` filesystem access is deprecated.
- Use `storage_client.py` for all object operations.
- Compress storage files with gzip where specified (`.json.gz`).
- Generate `{user_id}` and `{fingerprint}` keys exactly as specified in architecture. No variations.
- **Library Migration**: Replace `PyPDF2` with `pypdf` across all Python code.

## Agent Output Contracts

Every agent must return a structured response that includes:
- `status`: `success` | `skipped` | `failed`
- `duration_ms`: integer
- `records_processed`: integer (where applicable)
- `error`: string | null

Never return unstructured text from an agent. The orchestrator parses these contracts.

## WhatsApp Messages

- Rate limit: 1 message per 1500ms via Baileys. Never batch-send.
- Always check `users.wa_opted_in = TRUE` and `users.wa_window_expires_at` before sending.
- Always pass 3-layer security gate for inbound commands: phone exists → opted_in → tier check.
- Check `notif_prefs.quiet_hours_start/end` before sending coach messages.

## Security

- AES-256-CBC encryption for all session cookies. IV stored alongside encrypted blob. AES key from Doppler only.
- JWT expiry: 15 minutes. Refresh tokens in httpOnly cookies only.
- `session_encrypted`, `session_iv`, `oauth_access_token`, `oauth_refresh_token` must be stripped from every API response in the Node.js layer before returning to client.
- **6-Layer File Upload Security**:
  1. Server 1: Size limit (5MB), Ext whitelist (.pdf, .docx), Filename sanitization.
  2. Server 1: Magic bytes validation (%PDF, PK ZIP headers).
  3. Server 2: DOCX bomb check (ratio < 100, uncompressed < 50MB).
  4. Server 2: Macro/Object stripping (DOCX reconstruction).
  5. Server 2: Sandboxed subprocess parsing (30s timeout).
  6. Isolation: User-scoped keys, no public access, delete original after parse.
- No agent logic in Server 1. Server 1 receives, validates JWT, delegates to Server 2/3, returns response.

## Learning Signals — Always Capture

Every meaningful system event must write to `learning_signals`. This is not optional. The self-learning system is only as good as its signal coverage. Key signals to never miss:
- `application_submitted` — with platform, fit_score, used_tailored, seniority in context
- `callback_received`, `rejection_received`, `ghosted`
- `low_score_callback` — model predicted low fit but user got callback. Most critical signal.
- `fit_score_overridden` — user skipped a high-score job
- `apply_failed_captcha`, `apply_failed_session`
- `li_connection_accepted`, `li_connection_declined`
