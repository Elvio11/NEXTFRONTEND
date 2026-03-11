"""
main.py — Talvix Server 2 (Intelligence Layer)
FastAPI application. Port 8080 (Flux-Orbit).

Hosts: Agents 3, 4, 5, 6, 7, 8 (and stubs for 10, 11).
Auth: X-Agent-Secret header on all /api/agents/* routes.
No JWT on this server — JWT lives on Server 1 only.
No LLM calls here — all LLM logic in agents/ and skills/.

Run: doppler run -- uvicorn main:app --host 0.0.0.0 --port 8080
"""

import sys
print(f"[BOOT] Python version: {sys.version}", flush=True)
print(f"[BOOT] Starting Talvix Server 2...", flush=True)

import os

# ── Dummy fallbacks so the server CAN START without Doppler injecting secrets.
# In production Flux-Orbit/Doppler values override these before any agent runs.
# setdefault() only sets if the key is NOT already in the environment.
os.environ.setdefault("SUPABASE_URL",         "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY",  "placeholder-service-key")
os.environ.setdefault("AGENT_SECRET",          "placeholder-agent-secret-change-me")
os.environ.setdefault("SARVAM_API_KEY",        "placeholder-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",        "placeholder-gemini-key")
os.environ.setdefault("SERVER1_URL",           "https://placeholder-server1.example.com")
os.environ.setdefault("SERVER2_URL",           "https://placeholder-server2.example.com")
os.environ.setdefault("SERVER3_URL",           "https://placeholder-server3.example.com")
os.environ.setdefault("OPENAI_API_KEY",        "placeholder-openai-key")

print("[BOOT] Env defaults set.", flush=True)

import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from routers import resume
    print("[BOOT] resume router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: resume — {e}", flush=True)

try:
    from routers import skill_gap
    print("[BOOT] skill_gap router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: skill_gap — {e}", flush=True)

try:
    from routers import career_intel
    print("[BOOT] career_intel router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: career_intel — {e}", flush=True)

try:
    from routers import fit_score
    print("[BOOT] fit_score router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: fit_score — {e}", flush=True)

try:
    from routers import jd_clean
    print("[BOOT] jd_clean router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: jd_clean — {e}", flush=True)

try:
    from routers import coach
    print("[BOOT] coach router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: coach — {e}", flush=True)

try:
    from orchestrator import router as orchestrator_router
    print("[BOOT] orchestrator router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FATAL: orchestrator — {e}", flush=True)
    orchestrator_router = None  # type: ignore[assignment]

print("[BOOT] All routers loaded. Starting uvicorn...", flush=True)

app = FastAPI(
    title="Talvix Server 2 — Intelligence Layer",
    version="1.0.0",
    docs_url=None,   # disable Swagger in production
    redoc_url=None,
)

# Internal server — only Server 1 calls us via X-Agent-Secret.
# CORS is not needed for machine-to-machine, but allow origin for dev probing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log and return 500. Never leak stack traces to caller."""
    tb = traceback.format_exc()[:1000]
    print(f"[server2] Unhandled exception: {type(exc).__name__}: {str(exc)[:200]}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"status": "failed", "error": f"{type(exc).__name__}: {str(exc)[:200]}"},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(resume.router,       prefix="/api/agents")
app.include_router(skill_gap.router,    prefix="/api/agents")
app.include_router(career_intel.router, prefix="/api/agents")
app.include_router(fit_score.router,    prefix="/api/agents")
app.include_router(jd_clean.router,     prefix="/api/agents")
app.include_router(coach.router,        prefix="/api/agents")
if orchestrator_router is not None:
    app.include_router(orchestrator_router.router)


# ─── Health (no auth) ────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AGENT_SECRET", "GEMINI_API_KEY", "SARVAM_API_KEY"]
    env_status = {k: "SET" if os.environ.get(k) else "MISSING" for k in required}
    return {
        "status": "ok",
        "server": "server2",
        "port": 8080,
        "env": env_status,
    }


# ─── Entry (for local dev without doppler wrapper) ───────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("APP_PORT", "8080"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
