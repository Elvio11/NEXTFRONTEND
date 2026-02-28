"""
agents/agent10_tailor.py
Agent 10 — Resume Tailor.

Reads user's parsed resume from /storage/parsed-resumes/{user_id}.json.gz.
Calls Sarvam-M Think to tailor it to the specific job's JD keywords.
Writes tailored .docx to /storage/tailored-resumes/{user_id}/{job_id}.docx.
Updates job_applications.tailored_resume_path if an application row exists.

Eligibility: paid tier only.
"""

import time
from datetime import datetime, timezone

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.resume_tailor import tailor_resume
from llm.sarvam import SarvamUnavailableError


async def run_tailor(user_id: str, job_id: str) -> dict:
    """
    Tailor the user's resume to the specified job.

    Returns:
        {"status": "completed"|"skipped"|"failed", "storage_path": str|None, "sarvam_tokens_used": int}
    """
    run_id = new_run_id()
    start  = time.time()

    await log_start("agent10_tailor", user_id, run_id)

    try:
        # ── Eligibility: paid tier only ──────────────────────────────────────
        user_result = (
            supabase.table("users")
            .select("id, subscription_tier")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not user_result.data or user_result.data.get("subscription_tier") != "paid":
            await log_skip(run_id, "free_tier_user")
            return {"status": "skipped", "storage_path": None, "sarvam_tokens_used": 0, "reason": "free_tier_user"}

        # ── Fetch job details ────────────────────────────────────────────────
        job_result = (
            supabase.table("jobs")
            .select("id, title, company, jd_summary, raw_jd")
            .eq("id", job_id)
            .single()
            .execute()
        )
        if not job_result.data:
            await log_skip(run_id, "job_not_found")
            return {"status": "skipped", "storage_path": None, "sarvam_tokens_used": 0, "reason": "job_not_found"}

        # Fetch required skills from job_skills table
        skills_result = (
            supabase.table("job_skills")
            .select("skill_name, skill_type")
            .eq("job_id", job_id)
            .eq("skill_type", "required")
            .limit(30)
            .execute()
        )
        required_skills = [row["skill_name"] for row in (skills_result.data or [])]

        job = {
            **job_result.data,
            "required_skills": required_skills,
        }

        # ── Tailor resume ────────────────────────────────────────────────────
        storage_path = await tailor_resume(user_id, job)

        # ── Update job_applications if row exists ────────────────────────────
        app_result = (
            supabase.table("job_applications")
            .select("id")
            .eq("user_id", user_id)
            .eq("job_id", job_id)
            .limit(1)
            .execute()
        )
        if app_result.data:
            supabase.table("job_applications").update({
                "tailored_resume_path": storage_path,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", app_result.data[0]["id"]).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, 1, duration_ms)

        return {
            "status":             "completed",
            "storage_path":       storage_path,
            "sarvam_tokens_used": 0,  # Sarvam doesn't expose token counts in current API
            "duration_ms":        duration_ms,
        }

    except SarvamUnavailableError as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, f"sarvam_unavailable: {str(exc)}", duration_ms)
        return {"status": "skipped", "storage_path": None, "sarvam_tokens_used": 0, "reason": "sarvam_unavailable"}

    except FileNotFoundError as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, f"resume_not_found: {str(exc)}", duration_ms)
        return {"status": "failed", "storage_path": None, "sarvam_tokens_used": 0, "error": str(exc)}

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
