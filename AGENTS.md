# Talvix — Live Project Context

## Architecture
- **Server 1 (Gateway)**: Node.js 20 + Express | URL: `http://localhost:8080` (Internal)
- **Server 2 (Intelligence)**: Python 3.11 + FastAPI + CrewAI | URL: `http://localhost:8001` (Internal)
- **Server 3 (Execution)**: Python 3.11 + FastAPI + Selenium | URL: `http://localhost:8003` (Internal)
- **Frontend**: Next.js 15.5.12 (React 18) | URL: `http://localhost:3000`

## Tech Stack
- **Backend**: FastAPI (Python 3.11), Node.js 20, Express, Supabase (PostgreSQL), Baileys (WA), Selenium (Automation).
- **Frontend**: Next.js 15, Zustand, Tailwind CSS, Framer Motion, Radix UI.
- **LLM**: Sarvam-M (Primary reasoning), Gemini Flash (Document specific).

## Agent Registry

| ID | Name | Public Name | File Path | Status | Capabilities |
|---|---|---|---|---|---|
| 1 | Persona Selection | | `server1/src/routes/auth.js` | Complete | Onboarding Step 1: Persona-based onboarding flow. |
| 2 | Resume Upload | | `server1/src/routes/resume.js` | Complete | Onboarding Step 2: Upload logic + Server 2 delegation. |
| 3 | Resume Intel | Parichay | `server2/routers/resume.py` | Complete | Deep parsing + Persona extraction + JSON.gz compression. |
| 4 | Skill Gap | Kaushal | `server2/routers/skill_gap.py` | Complete | JD-vs-Resume gap analysis using Sarvam-M. |
| 5 | Career Intel | Niti | `server2/routers/career_intel.py` | Complete | Scoring 4 dimensions + Salary benchmarking. |
| 6 | Fit Scorer | Yogya | `server2/routers/fit_score.py` | Complete | Nightly matching + Delta-only scoring. |
| 7 | JD Cleaner | Sarthis | `server2/routers/jd_clean.py` | Complete | Sanitization + Extraction via Gemini Flash Lite. |
| 8 | Daily Coach | Guru | `server2/routers/coach.py` | Complete | WhatsApp/Telegram career advice + Actionable insights. |
| 9 | Job Scraper | Sarthis | `server3/agents/agent9_scraper.py` | Complete | Multi-platform scraping via JobSpy + Browser pools. |
| 10 | Resume Tailor | Shilpakaar | `server3/agents/agent10_tailor.py` | Complete | DOCX customization + SARVAM-M precise mode. |
| 11 | Cover Letter | Prerna | `server3/agents/agent11_cover_letter.py` | Complete | Context-aware CL generation via Gemini Flash. |
| 12 | Auto-Applier | Setu | `server3/agents/agent12_applier.py` | Complete | Selenium-based Tier 1 automation (Indeed/LinkedIn). |
| 13 | Anti-Ban/Form Q&A| Sarthis | `server3/agents/agent13_anti_ban.py` | Complete | Risk assessment + Adaptive timing logic. |
| 14 | Follow-Up Sender | Anuvartan | `server3/agents/agent14_follow_up.py` | Complete | Context-aware email/LinkedIn follow-ups. |
| 15 | Feedback Calibrator| Sarthis | `server3/agents/agent15_calibrator.py` | Complete | Weekly Layer 3 calibration & weight tuning. |

## API Endpoints

### Server 1
- `POST /api/auth` (OAuth/JWT)
- `POST /api/resume/upload` (Delegates to Agent 3)
- `GET /api/dashboard` (Fit-scores / Stats)
- `GET /api/whatsapp/qr` (Baileys connection)
- `POST /internal/wa-send` (Agent notifications)

### Server 2  
- `POST /api/agents/resume`
- `POST /api/agents/skill-gap`
- `POST /api/agents/career-intel`
- `POST /api/agents/fit-score`
- `POST /api/orchestrator`

### Server 3
- `POST /api/agents/scraper`
- `POST /api/agents/tailor`
- `POST /api/agents/apply`
- `POST /api/agents/anti-ban`

## Environment Variables
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_SECRET`, `SARVAM_API_KEY`, `GEMINI_API_KEY`, `AES_SESSION_KEY`, `JWT_SECRET`, `SERVER1_URL`, `SERVER2_URL`, `SERVER3_URL`.
- `S4_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` (MinIO Storage).

## Branch Rules
- **Source of truth**: `server1`, `server2`, `server3`, `frontend`.
- **Primary developer flow**: Push to deployment branch, then sync main.
- Never push directly to main without merge-review.

## Current Phase
- **Phase 5.3 (Infrastructure Alignment)** — Aligning with March 16 Locked Decisions (MinIO, pgvector, new Tiers).
- **Up Next**: Phase 6 (Agent 9 build-out).

## Last Worked On
- Alignment with March 16 Locked Decisions briefing.
- Security upgrade: Next.js to 15.5.12 (CVE-2025-66478).

## Open TODOs
- Server 1: Implement outbound Baileys/Telegram send.
- Server 3: Standardize Selenium retry logic into a global skill.
- AGENTS.md names updated to Indian-context public names.

## Next Immediate Task
- Phase 6: Build out Agent 9 with new scrapers (Internshala, Unstop) and India remote filter.