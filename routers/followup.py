"""
routers/followup.py
POST /api/agents/followup — triggers Agent 14 Follow-Up & Interview Detection.

Thin wrapper only: validate request, delegate to Agent 14, return result.
Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from middleware.auth import verify_agent_secret
from agents.agent14_follow_up import run_follow_up

router = APIRouter()


class FollowUpRequest(BaseModel):
    # Sweep can be filtered by user_id if triggered manually for one user
    user_id: Optional[str] = None


@router.post(
    "/followup",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 14: Follow-Up Sender — handle email/LI follow-ups and interview detection",
)
async def followup_endpoint(body: FollowUpRequest):
    # Note: run_follow_up handles the full sweep if body.user_id is None
    return await run_follow_up()
