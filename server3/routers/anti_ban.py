"""
routers/anti_ban.py
POST /api/agents/anti-ban — triggers Agent 13 Anti-Ban Guard.

Thin wrapper only: validate request, delegate to agent13, return result.
Auth: Depends(verify_agent_secret) — required on every route.

This endpoint is called by Agent 9 (scraper) and Agent 12 (applier)
before every LinkedIn action to get a proceed/block risk assessment.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal, Optional

from middleware.auth import verify_agent_secret
from agents.agent13_anti_ban import run_anti_ban

router = APIRouter()


class AntiBanRequest(BaseModel):
    user_id:     Optional[str] = None
    action_type: Literal["scrape", "apply"] = "apply"
    context:     dict = {}


@router.post(
    "/anti-ban",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 13: Anti-Ban Guard — evaluate LinkedIn action risk before proceeding",
)
async def anti_ban_endpoint(body: AntiBanRequest):
    return await run_anti_ban(
        user_id=body.user_id or "system",
        action_type=body.action_type,
        context=body.context,
    )
