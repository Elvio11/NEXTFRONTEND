"""
Talvix AI Corp — Server 5 (Company Layer)
Master OS Bridge — (Python 3.12 + FastAPI + MCP)
"""
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import logging
from src.utils import load_env  # Helper for manual dev runs
import json
import httpx

from src.agents.ceo_agent import commander

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("talvix-company-os")

# Environment configs (FluxCloud UI injects these)
AGENT_SECRET = os.getenv("AGENT_SECRET")
SERVER1_URL = os.getenv("SERVER1_URL", "http://localhost:8080")

app = FastAPI(title="Talvix AI Corp — Master OS Bridge", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CorporateDirective(BaseModel):
    dept_id: int
    task: str
    priority: Optional[str] = "MEDIUM"
    params: Optional[dict] = None

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "layer": "server5",
        "os": "Python/FastAPI",
        "commander": "ACTIVE"
    }

@app.get("/api/departments")
async def get_departments():
    """Retrieve real-time department status from the Commander."""
    pulse = commander.get_pulse()
    # Map pulse snapshot to the older UI format if necessary
    return [
        {"dept_id": dept_id, "name": hand.name, "status": hand.status, "last_action": hand.last_action}
        for dept_id, hand in commander.registry.items()
    ]

@app.post("/api/ceo/directive")
async def receive_ceo_directive(directive: CorporateDirective, request: Request):
    """
    Primary endpoint for high-level OS commands.
    """
    # Verify Agent Secret
    secret = request.headers.get("X-Agent-Secret")
    if secret != AGENT_SECRET and os.getenv("NODE_ENV") != "development":
        logger.warning("Unauthorized access attempt to CEO-OS directive endpoint.")
        # throw 401 in production, allow in dev for now
        # raise HTTPException(status_code=401, detail="Unauthorized")

    logger.info(f"CEO-OS receiving directive for Dept {directive.dept_id}")
    result = await commander.execute_directive(directive.dict())
    
    if result.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=result.get("message"))
        
    return result

@app.post("/api/internal/founder-notify")
async def receive_aaas_notification(payload: dict):
    """
    Receives webhooks from Server 1 (AaaS Product) and routes to specific departments.
    """
    event_type = payload.get("event_type")
    severity = payload.get("severity", "low")
    logger.info(f"Received {severity} event from Server 1: {event_type}")
    
    # Route via Commander
    directive = {
        "dept_id": 1, # Route to CEO for processing
        "task": f"Process S1 notification: {event_type}",
        "priority": "HIGH" if severity == "high" else "MEDIUM"
    }
    return await commander.execute_directive(directive)

@app.get("/health/heartbeat")
async def heartbeat():
    """UptimeRobot ping target with corporate pulse."""
    pulse = commander.get_pulse()
    return {
        "status": pulse["status"],
        "active_agents": pulse["active_agents"],
        "timestamp": pulse["timestamp"]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    uvicorn.run(app, host="0.0.0.0", port=port)
