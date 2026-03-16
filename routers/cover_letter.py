"""
routers/cover_letter.py
POST /api/agents/cover-letter — triggers Agent 11 Cover Letter Generator.

Thin wrapper only: validate request, delegate to agent11, return result.
Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from middleware.auth import verify_agent_secret
from agents.agent11_cover_letter import run_cover_letter

router = APIRouter()


class CoverLetterRequest(BaseModel):
    user_id: str
    job_id:  str


@router.post(
    "/cover-letter",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 11: Cover Letter — generate tailored cover letter using Gemini Flash",
)
async def cover_letter_endpoint(body: CoverLetterRequest):
    return await run_cover_letter(user_id=body.user_id, job_id=body.job_id)
