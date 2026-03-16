"""
routers/resume.py
POST /api/agents/resume-intelligence

Thin wrapper: validates request, fires CareerPlannerFlow, returns Agent 3 result.
verify_agent_secret Depends() required — rejects with 403 if header missing/wrong.
"""

import time
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from middleware.auth import verify_agent_secret
from flow.career_planner import run_onboarding_flow

router = APIRouter()


class ResumeRequest(BaseModel):
    agent:   str
    user_id: str
    payload: dict  # must contain storage_key


@router.post("/resume-intelligence", dependencies=[Depends(verify_agent_secret)])
async def resume_intelligence(req: ResumeRequest):
    storage_key = req.payload.get("storage_key", "")
    if not storage_key:
        return {"status": "failed", "duration_ms": 0,
                "records_processed": 0, "error": "payload.storage_key is required"}

    # CareerPlannerFlow runs agent3 then fires agents 4+5+6 in background
    result = await run_onboarding_flow(req.user_id, storage_key)
    return result
