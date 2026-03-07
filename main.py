"""
main.py — Talvix Server 3 (Automation Layer)
FastAPI application. Port $PORT (Flux-Orbit).

Hosts: Agents 9 (Scraper), 10 (Resume Tailor), 11 (Cover Letter),
       12 (Auto-Applier), 13 (Anti-Ban Guard).
Auth: X-Agent-Secret header on all /api/agents/* routes.
No JWT on this server — JWT lives on Server 1 only.
No CrewAI on Server 3 — agents are standalone FastAPI endpoints.

Run: doppler run -- uvicorn main:app --host 0.0.0.0 --port 8003
"""

import sys
print(f"[BOOT] Python {sys.version}", flush=True)
print(f"[BOOT] Starting Talvix Server 3...", flush=True)

import os

# ── Dummy fallbacks so the server CAN START without Doppler injecting secrets.
# setdefault() only sets if the key is NOT already in the environment.
os.environ.setdefault("SUPABASE_URL",         "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY",  "placeholder-service-key")
os.environ.setdefault("AGENT_SECRET",          "placeholder-agent-secret-change-me")
os.environ.setdefault("SARVAM_API_KEY",        "placeholder-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",        "placeholder-gemini-key")
os.environ.setdefault("SERVER1_URL",           "https://placeholder-server1.example.com")
os.environ.setdefault("SERVER2_URL",           "https://placeholder-server2.example.com")
os.environ.setdefault("SERVER3_URL",           "https://placeholder-server3.example.com")
os.environ.setdefault("SESSION_KEY",           "placeholder-session-key-64-chars-hex")

print("[BOOT] Env defaults set.", flush=True)

import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from routers import scraper
    print("[BOOT] scraper router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FAILED: scraper — {e}", flush=True)
    raise

try:
    from routers import tailor
    print("[BOOT] tailor router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FAILED: tailor — {e}", flush=True)
    raise

try:
    from routers import cover_letter
    print("[BOOT] cover_letter router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FAILED: cover_letter — {e}", flush=True)
    raise

try:
    from routers import apply
    print("[BOOT] apply router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FAILED: apply — {e}", flush=True)
    raise

try:
    from routers import anti_ban
    print("[BOOT] anti_ban router OK", flush=True)
except Exception as e:
    print(f"[BOOT] FAILED: anti_ban — {e}", flush=True)
    raise

print("[BOOT] All routers loaded. Starting uvicorn...", flush=True)

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
    required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "AGENT_SECRET", "SESSION_KEY"]
    env_status = {k: "SET" if os.environ.get(k) and "placeholder" not in os.environ.get(k, "") else "MISSING" for k in required}
    return {"status": "ok", "server": "server3", "port": os.environ.get("PORT", "8003"), "env": env_status}


# ─── Entry (for local dev without doppler wrapper) ────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8003"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )

