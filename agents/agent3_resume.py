"""
agents/agent3_resume.py
Agent 3 — Resume Intelligence

Parses user resume, generates AI personas, writes to DB and FluxShare.
Called by CareerPlannerFlow @start and by /api/agents/resume-intelligence router.

Steps:
  1. Parse file (PyPDF2 / python-docx via resume_parser skill)
  2. Generate 3 AI persona variants (Sarvam-M Think via persona_generator skill)
  3. Write gzip'd parsed JSON to /storage/parsed-resumes/{user_id}.json.gz
  4. Upsert resumes table (slim summary JSONB)
  5. Set users.fit_scores_stale = TRUE
  6. Set users.onboarding_completed = TRUE (first parse)
  7. Return persona_options + extracted_summary to caller
"""

import time
import uuid
from datetime import datetime, timezone

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.resume_parser import parse_resume, ParseError
from skills.persona_generator import generate_personas
from llm.sarvam import SarvamUnavailableError


async def run(user_id: str, file_path: str) -> dict:
    """
    Full Agent 3 execution.
    Returns standard response envelope + persona_options + extracted_summary.
    """
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent3_resume", user_id, run_id)

    def _elapsed_ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # ── Step 1: Parse resume ──────────────────────────────────────────
        try:
            parsed = parse_resume(file_path, user_id)
        except ParseError as pe:
            reason = str(pe)
            # Write failure to resumes table so frontend can surface error
            supabase.table("resumes").upsert({
                "user_id":      user_id,
                "parse_status": "failed",
                "parse_error":  reason,
                "updated_at":   datetime.now(timezone.utc).isoformat(),
            }, on_conflict="user_id").execute()
            await log_fail(run_id, reason, _elapsed_ms())
            return {
                "status":    "failed",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error":     reason,
            }

        # ── Step 2: Generate personas ─────────────────────────────────────
        try:
            personas = await generate_personas(parsed)
        except SarvamUnavailableError as exc:
            await log_skip(run_id, f"sarvam_unavailable: {exc}")
            return {
                "status":    "skipped",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error":     "Sarvam-M unavailable — retry later",
            }

        # ── Step 3: Upsert resumes table ──────────────────────────────────
        summary_jsonb = {
            "seniority":   parsed["seniority_level"],
            "top_5_skills": parsed["top_5_skills"],
            "exp_years":   parsed["experience_years"],
            "persona":     None,  # set after user selects in Step 4
        }

        supabase.table("resumes").upsert({
            "user_id":      user_id,
            "parse_status": "done",
            "summary":      summary_jsonb,
            "updated_at":   datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()

        # ── Step 4: Set flags on users table ──────────────────────────────
        supabase.table("users").update({
            "fit_scores_stale":      True,
            "onboarding_completed":  True,
            "updated_at":            datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        await log_end(run_id, 1, _elapsed_ms())

        return {
            "status":            "success",
            "duration_ms":       _elapsed_ms(),
            "records_processed": 1,
            "error":             None,
            "persona_options":   personas,
            "extracted_summary": {
                "seniority":    parsed["seniority_level"],
                "top_5_skills": parsed["top_5_skills"],
                "exp_years":    parsed["experience_years"],
                "current_title": parsed["current_title"],
            },
            "storage_path": f"/storage/parsed-resumes/{user_id}.json.gz",
        }

    except Exception as exc:
        await log_fail(run_id, str(exc), _elapsed_ms())
        return {
            "status":    "failed",
            "duration_ms": _elapsed_ms(),
            "records_processed": 0,
            "error":     str(exc)[:500],
        }
