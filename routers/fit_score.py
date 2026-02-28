"""
routers/fit_score.py
POST /api/agents/fit-score
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from middleware.auth import verify_agent_secret
import agents.agent6_fit as agent6

router = APIRouter()

class FitScoreRequest(BaseModel):
    agent:   str
    user_id: Optional[str] = None
    payload: dict = {}

@router.post("/fit-score", dependencies=[Depends(verify_agent_secret)])
async def fit_score(req: FitScoreRequest):
    mode    = req.payload.get("mode", "delta")
    scrape_run_id = req.payload.get("scrape_run_id")

    if mode not in ("full_scan", "delta"):
        return {"status": "failed", "duration_ms": 0,
                "records_processed": 0, "error": "Invalid mode — must be full_scan or delta"}

    return await agent6.run(req.user_id, mode=mode, scrape_run_id=scrape_run_id)
