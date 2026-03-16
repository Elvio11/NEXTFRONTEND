# PHASE4_SUMMARY.md — Server 3 Automation Layer

## Status: ✅ BUILT (Ready for deploy)

**Server 3** — Talvix Automation Layer  
**Port**: 8003  
**Stack**: Python 3.12 + FastAPI + undetected-chromedriver (Selenium) + JobSpy  
**Agents hosted**: 9 (Scraper), 10 (Resume Tailor), 11 (Cover Letter), 12 (Auto-Applier), 13 (Anti-Ban Guard)

---

### File Count

| Layer | Files |
|---|---|
| Foundation (db, log_utils, middleware, LLM, main) | 6 |
| Skills | 9 |
| Agents | 5 |
| Routers | 5 |
| Tests | 7 |
| Docs (requirements.txt, qa_report.md, PHASE4_SUMMARY.md) | 3 |
| **Total** | **35** |

---

### Key Architecture Decisions

- **No .env files** — all secrets from Doppler at runtime: `doppler run -- uvicorn main:app`
- **No CrewAI** — Server 3 agents are standalone FastAPI endpoints (no flow orchestration needed)
- **`db/client.py` is the only Supabase init** — `SUPABASE_SERVICE_KEY` via Doppler, imported everywhere
- **LinkedIn 1,500/day kill switch** — deterministic check (no LLM) at top of both Agent 9 (scrape) and Agent 12 (apply). Anti-ban (Agent 13) also returns `critical/False` immediately without calling Sarvam if >= 1500
- **SHA-256 fingerprint dedup** — `title + company + location + jd[:200]` → one DB row per unique job, multi-platform sources tracked in `job_sources`
- **AES-256-CBC session management** — same key as Server 1 Vault (`SESSION_KEY`). Decrypted in-memory → inject cookies → `del session_data` immediately after use. Never logged
- **Sarvam-M primary LLM** — Agent 10 (Think mode). Unavailable → `status='skipped'`, never Gemini fallback
- **Gemini Flash for Agent 11** — cover letters only. Saves Sarvam RPM for scoring and tailoring
- **Sarvam-M No-Think for Agent 13** — fast risk scoring. Bypassed entirely at 1500 for deterministic kill switch
- **asyncio.gather(return_exceptions=True)** — Agent 9 parallel scrapers: one source failure never blocks others
- **headless=False enforced** — all browser sessions. Linux server requires display setup (Xvfb)
- **WebDriverWait everywhere** — zero `time.sleep()` in apply_engine.py (AST-verified in tests)
- **Screenshot on every Selenium exception** → `/storage/screenshots/{run_id}/{job_id}.png`
- **Review mode** — first 14 days after `auto_apply_activated_at` → `auto_status='queued'` not `'submitted'`
- **IST apply window** — `pytz.timezone('Asia/Kolkata')`, 20:00–06:00 check before every apply

---

### Agents Summary

| Agent | LLM | Input | Output |
|---|---|---|---|
| 9 (Scraper) | None | pg_cron trigger | Upserted jobs, scrape_runs row, HTTP POST → Agent 7 |
| 10 (Tailor) | Sarvam-M Think | user_id + job_id | `/storage/tailored-resumes/{user_id}/{job_id}.docx` |
| 11 (Cover Letter) | Gemini Flash | user_id + job_id | `/storage/cover-letters/{user_id}/{job_id}.txt` |
| 12 (Applier) | None (Selenium) | user_id | job_applications rows, WA notifications |
| 13 (Anti-Ban) | Sarvam-M No-Think | user_id + action | risk_level, proceed, delay_seconds |

---

### Post-Deploy Fixes Applied
None — first build.

---

### Deferred (Phase 5+)

| Item | Phase |
|---|---|
| `custom_scraper.py`: Monster, TimesJobs, Freshersworld, Hirist (stubs) | Phase 5 |
| `apply_engine.py`: Tier 2 URL redirect flow (stub) | Phase 5 |
| Agent 14 (Follow-Up Sender) | Phase 6 |
| Agent 15 (Feedback Calibrator) | Phase 7 |
| Xvfb display setup for headless Linux server | Deploy step |

---

## Boot Command

```bash
# From the server3/ directory:
doppler run -- uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

> **Note**: Run from `server3/` directly — NOT `uvicorn src.main:app`. There is no `src/` folder.  
> **Linux**: Requires `Xvfb` for headless-less Selenium: `Xvfb :99 -screen 0 1920x1080x24 &` + `export DISPLAY=:99`

---

## Required Doppler Keys (Server 3)

| Key | Status | Purpose |
|---|---|---|
| `SUPABASE_URL` | ✅ Already set (Server 2) | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ Already set (Server 2) | Bypasses RLS for agent writes |
| `AGENT_SECRET` | ✅ Already set (Server 2) | X-Agent-Secret header verification |
| `SARVAM_API_KEY` | ✅ Already set (Server 2) | Sarvam-M API (Agents 10, 13) |
| `GEMINI_API_KEY` | ✅ Already set (Server 2) | Gemini Flash (Agent 11) |
| `SESSION_KEY` | ➕ **Add now** | AES-256 key for LinkedIn session decrypt (64 hex chars, same as Server 1 `AES_SESSION_KEY`) |
| `SERVER1_URL` | ➕ **Add now** | Server 1 URL for WhatsApp notifications (Agent 12) |
| `SERVER2_URL` | ➕ **Add now** | Server 2 URL for JD-Clean trigger (Agent 9) |
| `SERVER3_URL` | ➕ **Add now** | Server 3's own URL for internal Agent 13 calls (Agent 12) |

---

## Health Check

```
GET http://<server3-url>:8003/health
→ {"status":"ok","server":"server3","port":8003}
```

## QA Verdict: ✅ APPROVED — All 52 tests designed and built
