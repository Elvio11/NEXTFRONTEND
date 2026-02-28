"""
routers/career_intel.py
POST /api/agents/career-intelligence
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from middleware.auth import verify_agent_secret
import agents.agent5_career as agent5

router = APIRouter()

class AgentRequest(BaseModel):
    agent:   str
    user_id: str
    payload: dict = {}

@router.post("/career-intelligence", dependencies=[Depends(verify_agent_secret)])
async def career_intelligence(req: AgentRequest):
    return await agent5.run(req.user_id)
