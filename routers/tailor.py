"""
routers/tailor.py
POST /api/agents/resume-tailor — triggers Agent 10 Resume Tailor.

Thin wrapper only: validate request, delegate to agent10, return result.
Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from middleware.auth import verify_agent_secret
from agents.agent10_tailor import run_tailor

router = APIRouter()


class TailorRequest(BaseModel):
    user_id: str
    job_id:  str


@router.post(
    "/resume-tailor",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 10: Resume Tailor — tailor parsed resume to a specific job using Sarvam-M",
)
async def tailor_endpoint(body: TailorRequest):
    return await run_tailor(user_id=body.user_id, job_id=body.job_id)
