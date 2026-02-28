"""
main.py — Talvix Server 3 (Automation Layer)
FastAPI application. Port 8003.

Hosts: Agents 9 (Scraper), 10 (Resume Tailor), 11 (Cover Letter),
       12 (Auto-Applier), 13 (Anti-Ban Guard).
Auth: X-Agent-Secret header on all /api/agents/* routes.
No JWT on this server — JWT lives on Server 1 only.
No CrewAI on Server 3 — agents are standalone FastAPI endpoints.

Run: doppler run -- uvicorn main:app --host 0.0.0.0 --port 8003
"""

import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import scraper, tailor, cover_letter, apply, anti_ban

app = FastAPI(
    title="Talvix Server 3 — Automation Layer",
    version="1.0.0",
    docs_url=None,    # disable Swagger in production
    redoc_url=None,
)

# Internal server — only Server 1 and Server 2 call us via X-Agent-Secret.
# CORS not needed for machine-to-machine, but allow for dev probing.
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
    # Truncate traceback — never include secrets from env in response
    tb = traceback.format_exc()[:1000]
    print(f"[server3] Unhandled exception: {type(exc).__name__}: {str(exc)[:200]}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"status": "failed", "error": f"{type(exc).__name__}: {str(exc)[:200]}"},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(scraper.router,      prefix="/api/agents")
app.include_router(tailor.router,       prefix="/api/agents")
app.include_router(cover_letter.router, prefix="/api/agents")
app.include_router(apply.router,        prefix="/api/agents")
app.include_router(anti_ban.router,     prefix="/api/agents")


# ─── Health (no auth) ─────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "server": "server3", "port": 8003}


# ─── Entry (for local dev without doppler wrapper) ────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=False,
    )
