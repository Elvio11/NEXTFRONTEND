"""
agents/agent4_skill_gap.py
Agent 4 — Skill Gap Analysis

Identifies top skill gaps, writes top 3 to DB + full report to FluxShare.
Runs in parallel with Agents 5 and 6 via CareerPlannerFlow asyncio.gather().

Input: user_id (parsed resume already on FluxShare from Agent 3)
Output: top_gaps[] in skill_gap_results table
"""

import gzip
import json
import time
from datetime import datetime, timezone, timedelta

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.skill_gap_analyzer import analyze_skill_gaps
from llm.sarvam import SarvamUnavailableError


async def run(user_id: str) -> dict:
    """Full Agent 4 execution."""
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent4_skill_gap", user_id, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # Load parsed resume from FluxShare
        resume_path = f"/storage/parsed-resumes/{user_id}.json.gz"
        try:
            with gzip.open(resume_path, "rt", encoding="utf-8") as f:
                parsed = json.load(f)
        except Exception as exc:
            await log_fail(run_id, f"resume_not_found: {exc}", _ms())
            return {"status": "failed", "duration_ms": _ms(), "records_processed": 0,
                    "error": "Parsed resume not found — run Agent 3 first"}

        try:
            result = await analyze_skill_gaps(user_id, parsed)
        except SarvamUnavailableError as exc:
            await log_skip(run_id, f"sarvam_unavailable: {exc}")
            return {"status": "skipped", "duration_ms": _ms(), "records_processed": 0,
                    "error": "Sarvam-M unavailable"}

        top_gaps = result["top_gaps"]
        next_refresh = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

        # Upsert skill_gap_results (one row per user)
        supabase.table("skill_gap_results").upsert({
            "user_id":        user_id,
            "top_gaps":       top_gaps,
            "next_refresh_at": next_refresh,
            "updated_at":     datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()

        # Clear stale flag
        supabase.table("users").update({
            "skill_gap_stale": False,
            "updated_at":      datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        await log_end(run_id, len(top_gaps), _ms())
        return {"status": "success", "duration_ms": _ms(),
                "records_processed": len(top_gaps), "error": None}

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {"status": "failed", "duration_ms": _ms(),
                "records_processed": 0, "error": str(exc)[:500]}
