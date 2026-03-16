"""
routers/coach.py
POST /api/agents/coach
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from middleware.auth import verify_agent_secret
import agents.agent8_coach as agent8

router = APIRouter()

class CoachRequest(BaseModel):
    agent:   str
    user_id: Optional[str] = None
    payload: dict = {}

@router.post("/coach", dependencies=[Depends(verify_agent_secret)])
async def coach(req: CoachRequest):
    # user_id = None — Agent 8 finds eligible users internally
    return await agent8.run()
