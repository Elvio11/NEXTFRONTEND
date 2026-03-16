"""
routers/jd_clean.py
POST /api/agents/jd-clean
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from middleware.auth import verify_agent_secret
import agents.agent7_jd as agent7

router = APIRouter()

class JDCleanRequest(BaseModel):
    agent:   str
    user_id: Optional[str] = None
    payload: dict = {}

@router.post("/jd-clean", dependencies=[Depends(verify_agent_secret)])
async def jd_clean(req: JDCleanRequest):
    scrape_run_id = req.payload.get("scrape_run_id")
    if not scrape_run_id:
        return {"status": "failed", "duration_ms": 0,
                "records_processed": 0, "error": "payload.scrape_run_id is required"}
    return await agent7.run(scrape_run_id)
