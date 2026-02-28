# PHASE3_SUMMARY.md — Server 2 Intelligence Layer

## Status: ✅ LIVE (GitHub Codespace + Local Windows)

**Server 2** — Talvix Intelligence Layer  
**Port**: 8002  
**Stack**: Python 3.12 + FastAPI + CrewAI  
**Agents hosted**: 3 (Resume), 4 (Skill Gap), 5 (Career Intel), 6 (Fit Scorer), 7 (JD Clean), 8 (Coach)

### File Count
| Layer | Files |
|---|---|
| Foundation (db, log_utils, middleware, LLM, main) | 6 |
| Skills | 9 |
| Agents | 6 |
| Flow + Routers | 7 |
| Tests | 6 |
| Docs | 3 (requirements.txt, qa_report.md, PHASE3_SUMMARY.md) |
| **Total** | **37** |

### Key Architecture Decisions
- **No .env files** — all secrets from Doppler at runtime
- **`db/client.py` is the only Supabase init** — `SUPABASE_SERVICE_KEY` via Doppler, imported everywhere
- **Sarvam-M via cloud API** — `api.sarvam.ai`, one API key only, URL hardcoded. Unavailable → `skipped`, never Gemini fallback
- **`asyncio.gather(return_exceptions=True)`** — parallel Agents 4+5+6, partial failure doesn't block `dashboard_ready`
- **CareerPlannerFlow**: Agent 3 @start → @listen → gather(4,5,6) → dashboard_ready

### Post-Deploy Fixes Applied
| Issue | Fix |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` mismatch | Doppler key is `SUPABASE_SERVICE_KEY` — updated `db/client.py` |
| `logging/` shadowed Python stdlib | Renamed to `log_utils/` — all 9 agent files patched |
| `SARVAM_API_URL` not needed | Sarvam is a cloud API — URL hardcoded.`SARVAM_API_KEY` only |
| LLM clients crashed at import | Made lazy-init — env vars read at call time, not startup |
| `src.main:app` not found | No `src/` folder — correct command is `uvicorn main:app` |

### Deferred (Phase 4+)
- Agents 10, 11 (Resume Tailor, Cover Letter) — Server 3
- Agent 9 (Job Scraper) — Server 3
- Agent 12 (Auto-Apply, Selenium) — Server 3
- `prefilter_engine` parameterised SQL
- `pytz` for IST quiet hours

---

## Boot Command

```bash
# From the server2/ directory:
doppler run -- uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

> **Note**: Run from `server2/` directly — NOT `uvicorn src.main:app`. There is no `src/` folder.

## Required Doppler Keys (Server 2)

| Key | Status | Purpose |
|---|---|---|
| `SUPABASE_URL` | ✅ Already set | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ Already set | Bypasses RLS for agent writes |
| `AGENT_SECRET` | ✅ Already set | X-Agent-Secret header verification |
| `SARVAM_API_KEY` | ➕ Add | From [api.sarvam.ai](https://api.sarvam.ai) dashboard |
| `GEMINI_API_KEY` | ➕ Add | Google AI Studio free tier (Agent 7 only) |
| `SERVER1_URL` | ➕ Add | Server 1 URL for WhatsApp push stub |
| `SERVER2_URL` | ➕ Add | Server 2's own URL (Agent 7 self-trigger) |

## Health Check

```
GET http://<server2-url>:8002/health
→ {"status":"ok","server":"server2","port":8002}
```

## QA Verdict: ✅ APPROVED — Live on GitHub Codespace

