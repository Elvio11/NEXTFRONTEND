# TALVIX — PROJECT STATE REPORT
*Generated: 2026-03-14*

This report provides a comprehensive snapshot of the Talvix project state across all branches. It is designed to give a fresh AI assistant complete context on the infrastructure, code, database, and agents.

---

## 1. INFRASTRUCTURE & ORCHESTRATION

| Server | Port | Role | Stack |
|---|---|---|---|
| **Server 1 (Gateway)** | 8080 | Auth, Routing, Validation | Node.js 24 + Express |
| **Server 2 (Intelligence)** | 8001 | Reasoning-heavy Agents (3-8) | Python 3.11 + FastAPI + CrewAI |
| **Server 3 (Execution)** | 8003 | Automation, Scraping (9-15) | Python 3.11 + FastAPI + Selenium |
| **Server 4 (Storage)** | 9000 | MinIO Object Storage | Docker + MinIO |
| **Database** | 5432 | Primary Persistence | Supabase (PostgreSQL) |

### Key Orchestration Rules
- **Direct HTTP POST**: No Redis/BullMQ. Inter-server communication uses `X-Agent-Secret` (Doppler) for authentication.
- **Doppler Only**: Secrets are never in `.env`. Proccesses run via `doppler run --`.
- **FluxShare / MinIO**: `/storage/` mount (Server 4) is the source of truth for all persistent files.

---

## 2. FILE SYSTEM INVENTORY & BRANCHES

### Primary Branches
- `main`: Core production-ready code.
- `branch-server1`: Node.js Gateway development.
- `branch-server2`: Intelligence Agent development.
- `branch-server3`: Automation & Scraper development.
- `branch-server4`: DB & Infrastructure configs.
- `frontend-clean`: Next.js 15 applications.

### Core File Structure (Consolidated)
```text
/
├── branch-server1/         # Gateway (Node.js)
│   ├── src/routes/         # API endpoints (Auth, Dashboard, Resume, etc.)
│   └── src/middleware/     # JWT, stripSensitive, Gatekeeping
├── branch-server2/         # Intelligence (Python)
│   ├── routers/            # Agent wrappers
│   ├── orchestrator/       # CrewAI flows & Gates
│   └── skills/             # shared logic (storage_client, sarvam)
├── branch-server3/         # Execution (Python)
│   ├── agents/             # Standalone agents (9-15)
│   ├── skills/             # Anti-ban, Selenium logic, Form Answerer
│   └── tests/              # Agent validation suite
├── branch-server4/         # Infrastructure
│   ├── database/           # 00_init.sql (DDL + Seed)
│   └── docker-compose.yml  # Local stack orchestration
└── TALVIX_PROJECT_STATE.md # This report
```

---

## 3. AGENT REGISTRY & STATUS (1-15)

Agents are distributed across Servers 2 and 3.

| ID | Name | Server | Status | Capabilities |
|---|---|---|---|---|
| 1 | Persona Selection | 1 | Complete | Onboarding Step 1. |
| 2 | Resume Upload | 1 | Complete | Direct storage + forwarding. |
| 3 | Resume Intel | 2 | Active | Deep extraction + JSON.gz compression. |
| 4 | Skill Gap | 2 | Active | JD-vs-Resume gap analysis (Sarvam-M). |
| 5 | Career Intel | 2 | Active | Salary benchmarking + 4D scoring. |
| 6 | Fit Scorer | 2 | Active | Delta-only vs Full Scan modes. |
| 7 | JD Cleaner | 2 | Active | Gemini Flash Lite sanitization. |
| 8 | Daily Coach | 2 | Active | WhatsApp career advice. |
| 9 | Job Scraper | 3 | Active | Multi-platform scraping via JobSpy. |
| 10 | Resume Tailor | 3 | Active | DOCX customization. |
| 11 | Cover Letter | 3 | Active | Context-aware CL generation (Gemini). |
| 12 | Auto-Applier | 3 | Active | Selenium-based Tier 1 (Indeed/LinkedIn). |
| 13 | Form Q&A / Anti-Ban | 3 | Active | Adaptive timing + Form answering. |
| 14 | Follow-Up | 3 | Complete | Multi-stage email + LinkedIn follow-up. |
| 15 | Calibrator | 3 | Complete | Self-learning loop (Layer 2/3). |

---

## 4. DATABASE STATE & RLS

**Total Tables**: 26 (Core, Job Pool, Scoring, Applications, Communications, Learning).

### Critical DDL logic
- **LinkedIn Global Kill Switch**: Managed in `system_daily_limits` table. Absolute cap accessed via `check_linkedin_limit` skill.
- **Soft Deletes**: `status = 'withdrawn'` for users; `is_active = FALSE` for jobs.
- **pg_cron**: 14 scheduled jobs (Nightly scraping, Staleness cleanup, Score resets).

### Security (RLS)
- **Select/Update policies** enforce `user_id = auth.uid()` on all user-facing tables.
- **service_role**: Only Servers 2 and 3 possess this key for cross-user agent operations.
- **Node.js Strip Layer**: `stripSensitive` middleware blocks `session_encrypted`, `oauth_*`, and `iv` columns from ever leaving S1.

---

## 5. API CONTRACTS & PROTOCOLS

### Server 1 (Public)
- `POST /api/auth/login`: Google OAuth exchange -> JWT + httpOnly Refresh Cookie.
- `GET /api/dashboard`: Aggregator (Promise.all) returning profile, top 25 scores, skill gaps, and applications.
- `POST /api/resume/upload`: Accepts file -> saves to MinIO -> triggers S2 `/api/agents/resume-intelligence`.

### Inter-Server (Internal)
- **Endpoint Pattern**: `/api/agents/{agent_name}`
- **Auth**: Header `X-Agent-Secret`.
- **Payload**: `{ "user_id": UUID, "payload": { ... } }`
- **Response**: `{ "status": "success|failed|skipped", "duration_ms": int, "records_processed": int, "error": str }`

---

## 6. STORAGE ARCHITECTURE (S4)

Dedicated MinIO bucket `talvix`.

| Content | Path Template | Compression/TTL |
|---|---|---|
| Resumes | `/storage/parsed-resumes/{u_id}.json.gz` | Permanant |
| JDs | `/storage/jds/{fingerprint}.txt` | 30 Days |
| Reports | `/storage/skill-gaps/{u_id}.json.gz` | Overwrite |
| Tailored | `/storage/tailored/{u_id}/{app_id}.pdf` | 7 Days |

---

## 7. SECURITY AUDIT SNAPSHOT

- **Session Data**: AES-256-CBC encrypted in DB (`user_connections`). Decrypted in-memory only on S3, deleted immediately after injection.
- **LinkedIn Safety**: DB-driven daily limits (Global + Per-user). No headless mode for LinkedIn. Random jitter (2s-6s) on all actions.
- **Secrets**: Doppler is strictly enforced. No `.env` files found in the repo.

---

## 8. OPEN ISSUES & TODOs

- **Scrapers**: Several platforms (Monster, Freshersworld) rely on `custom_scraper.py` stubs requiring implementation.
- **Frontend**: `next.config.ts` notes an Eslint/PostCSS upgrade needed (v9 transition).
- **Agent 15**: Layer 3 (Weekly) calibration relies on `gemini.complete` -> needs validation against actual LLM rate limits for large signal batches.

---

## 9. DEPENDENCY AUDIT (CORE)

- **S1**: Node.js 24, `@supabase/supabase-js` (2.43), `@whiskeysockets/baileys` (6.7.8).
- **S2**: Python 3.11, `fastapi`, `crewai` (0.28), `supabase` (2.4).
- **S3**: `selenium` (4.18), `jobspy` (0.1), `undetected-chromedriver` (3.5).

---

## 10. CURRENT BUILD PHASE
**Phase 5.2 COMPLETE** (Frontend architecture live + core agents verified).
**Phase 6 IN PROGRESS**: Agent 14/15 integration testing and deep self-learning loop activation.

---

## 11. BRIEFING FOR FRESH AI CONTEXT

> [!IMPORTANT]
> - **Sarvam-M is the primary reasoning brain (Cost: $0)**. Do not swap for GPT-4/Claude unless requested.
> - **Always use Storage Client**: Never read/write files directly. Use `skills.storage_client`.
> - **Gate Check**: Every LinkedIn action MUST call `check_linkedin_limit`.
> - **Strip Middleware**: If adding routes to S1, ensure they are wrapped in `stripSensitive` if returning user-data objects.
