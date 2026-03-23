"""
main.py — Talvix Server 2 (Intelligence Layer)
FastAPI application. Internal container port: 8080 (via $PORT / fly.toml).

Hosts: Agents 3, 4, 5, 6, 7, 8, 15 (and cleanup utilities).
Auth: X-Agent-Secret header on all /api/agents/* routes.
No JWT on this server — JWT lives on Server 1 only.
No LLM calls here — all LLM logic in agents/ and skills/.

Run: doppler run -- uvicorn main:app --host 0.0.0.0 --port 8080
"""

import sys
import logging

# Configure startup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("server2_startup")

logger.info(f"Python version: {sys.version}")
logger.info("Starting Talvix Server 2...")

from dotenv import load_dotenv
import os

load_dotenv() # Load local .env before default sets

# ── Dummy fallbacks so the server CAN START without Doppler injecting secrets.
# In production Flux-Orbit/Doppler values override these before any agent runs.
# setdefault() only sets if the key is NOT already in the environment.
os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-key")
os.environ.setdefault("AGENT_SECRET", "placeholder-agent-secret-change-me")
os.environ.setdefault("SARVAM_API_KEY", "placeholder-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY", "placeholder-gemini-key")
os.environ.setdefault("SERVER1_URL", "https://placeholder-server1.example.com")
os.environ.setdefault("SERVER2_URL", "https://placeholder-server2.example.com")
os.environ.setdefault("SERVER3_URL", "https://placeholder-server3.example.com")
os.environ.setdefault("OPENAI_API_KEY", "placeholder-openai-key")

logger.info("Env defaults set.")

import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from routers import resume

    logger.info("resume router OK")
except Exception as e:
    logger.error(f"FATAL: resume — {e}")

try:
    from routers import skill_gap

    logger.info("skill_gap router OK")
except Exception as e:
    logger.error(f"FATAL: skill_gap — {e}")

try:
    from routers import career_intel

    logger.info("career_intel router OK")
except Exception as e:
    logger.error(f"FATAL: career_intel — {e}")

try:
    from routers import fit_score

    logger.info("fit_score router OK")
except Exception as e:
    logger.error(f"FATAL: fit_score — {e}")

try:
    from routers import jd_clean

    logger.info("jd_clean router OK")
except Exception as e:
    logger.error(f"FATAL: jd_clean — {e}")

try:
    from routers import coach

    logger.info("coach router OK")
except Exception as e:
    logger.error(f"FATAL: coach — {e}")

try:
    from routers import calibrate

    logger.info("calibrate router OK")
except Exception as e:
    logger.error(f"FATAL: calibrate — {e}")

try:
    from routers import cleanup

    logger.info("cleanup router OK")
except Exception as e:
    logger.error(f"FATAL: cleanup — {e}")

try:
    from orchestrator import router as orchestrator_router

    logger.info("orchestrator router OK")
except Exception as e:
    logger.error(f"FATAL: orchestrator — {e}")
    orchestrator_router = None  # type: ignore[assignment]

logger.info("All routers loaded. Starting uvicorn...")

app = FastAPI(
    title="Talvix Server 2 — Intelligence Layer",
    version="1.0.0",
    docs_url=None,  # disable Swagger in production
    redoc_url=None,
)

# Internal server — only Server 1 calls us via X-Agent-Secret.
# CORS: only allow from Server1 (not wildcard) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("SERVER1_URL", "*")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log and return 500. Never leak stack traces to caller."""
    tb = traceback.format_exc()[:1000]
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)[:200]}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "failed",
            "error": f"{type(exc).__name__}: {str(exc)[:200]}",
        },
    )


# ─── Routers ──────────────────────────────────────────────────────────────────
from routers import resume, skill_gap, career_intel, fit_score, jd_clean, coach, calibrate, cleanup
try:
    from orchestrator.router import router as _orch_router
except ImportError:
    _orch_router = None

app.include_router(resume.router, prefix="/api/agents")
app.include_router(skill_gap.router, prefix="/api/agents")
app.include_router(career_intel.router, prefix="/api/agents")
app.include_router(fit_score.router, prefix="/api/agents")
app.include_router(jd_clean.router, prefix="/api/agents")
app.include_router(coach.router, prefix="/api/agents")
app.include_router(calibrate.router, prefix="/api/agents")
app.include_router(cleanup.router, prefix="/api/agents/cleanup")
if _orch_router is not None:
    app.include_router(_orch_router)


# ─── Health (no auth) ────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    required = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "AGENT_SECRET",
        "GEMINI_API_KEY",
        "SARVAM_API_KEY",
        "S4_URL",
        "MINIO_ROOT_USER",
        "MINIO_ROOT_PASSWORD",
        "MINIO_BUCKET",
    ]
    env_status = {k: "SET" if os.environ.get(k) and "placeholder" not in os.environ.get(k, "") else "MISSING" for k in required}
    return {
        "status": "ok",
        "server": "server2",
        "port": 8080,
        "env": env_status,
    }


@app.get("/health/heartbeat")
async def heartbeat():
    """Minimal liveness probe used by TalvixGuard (Server 1 watchdog)."""
    return {"status": "ok"}


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
