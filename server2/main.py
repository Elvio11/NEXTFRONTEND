"""
main.py — Talvix Server 2 (Intelligence Layer)
FastAPI application. Port 8002.

Hosts: Agents 3, 4, 5, 6, 7, 8 (and stubs for 10, 11).
Auth: X-Agent-Secret header on all /api/agents/* routes.
No JWT on this server — JWT lives on Server 1 only.
No LLM calls here — all LLM logic in agents/ and skills/.

Run: doppler run -- uvicorn main:app --host 0.0.0.0 --port 8002
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import resume, skill_gap, career_intel, fit_score, jd_clean, coach

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

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(resume.router,       prefix="/api/agents")
app.include_router(skill_gap.router,    prefix="/api/agents")
app.include_router(career_intel.router, prefix="/api/agents")
app.include_router(fit_score.router,    prefix="/api/agents")
app.include_router(jd_clean.router,     prefix="/api/agents")
app.include_router(coach.router,        prefix="/api/agents")

# ─── Health (no auth) ────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "server": "server2", "port": 8002}


# ─── Entry (for local dev without doppler wrapper) ───────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=False,
    )
