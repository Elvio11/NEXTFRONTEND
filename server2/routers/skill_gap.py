"""
routers/skill_gap.py
POST /api/agents/skill-gap
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from middleware.auth import verify_agent_secret
import agents.agent4_skill_gap as agent4

router = APIRouter()

class AgentRequest(BaseModel):
    agent:   str
    user_id: str
    payload: dict = {}

@router.post("/skill-gap", dependencies=[Depends(verify_agent_secret)])
async def skill_gap(req: AgentRequest):
    return await agent4.run(req.user_id)
