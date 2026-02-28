"""
routers/apply.py
POST /api/agents/auto-apply — triggers Agent 12 Auto-Applier.

Thin wrapper only: validate request, delegate to agent12, return result.
Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal

from middleware.auth import verify_agent_secret
from agents.agent12_applier import run_applier

router = APIRouter()


class ApplyRequest(BaseModel):
    user_id:     str
    apply_tier:  Literal[1, 2] = 1
    max_applies: int = 10


@router.post(
    "/auto-apply",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 12: Auto-Applier — apply to Tier 1 jobs (Indeed Easy Apply + LinkedIn Easy Apply)",
)
async def apply_endpoint(body: ApplyRequest):
    return await run_applier(
        user_id=body.user_id,
        apply_tier=body.apply_tier,
        max_applies=body.max_applies,
    )
