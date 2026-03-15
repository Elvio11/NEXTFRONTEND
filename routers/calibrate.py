"""
routers/calibrate.py
POST /api/agents/calibrate/daily  — triggers Layer 2 Micro-Adjustment.
POST /api/agents/calibrate/weekly — triggers Layer 3 Deep Calibration.

Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from middleware.auth import verify_agent_secret
from agents.agent15_calibrator import run_daily_calibration, run_weekly_calibration

router = APIRouter()


class CalibrateRequest(BaseModel):
    force: bool = False


@router.post(
    "/calibrate/daily",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 15: Layer 2 Daily Calibration — micro-adjust model weights",
)
async def daily_calibrate_endpoint(body: CalibrateRequest):
    return await run_daily_calibration()


@router.post(
    "/calibrate/weekly",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 15: Layer 3 Weekly Calibration — deep Gemini-driven optimization",
)
async def weekly_calibrate_endpoint(body: CalibrateRequest):
    return await run_weekly_calibration()
