"""
agents/agent11_cover_letter.py
Agent 11 — Cover Letter Generator.

Reads user's parsed resume from /storage/parsed-resumes/{user_id}.json.gz.
Calls Gemini Flash to generate a 250-350 word tailored cover letter.
Writes plain text to /storage/cover-letters/{user_id}/{job_id}.txt.
Updates job_applications.cover_letter_path if an application row exists.

Eligibility: paid tier only.
LLM: Gemini Flash (NOT Sarvam-M — saves Sarvam RPM for scoring and tailoring).
"""

import time
from datetime import datetime, timezone

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.cover_letter_writer import write_cover_letter


async def run_cover_letter(user_id: str, job_id: str) -> dict:
    """
    Generate a cover letter for the user for the specified job.

    Returns:
        {"status": "completed"|"skipped"|"failed", "storage_path": str|None}
    """
    run_id = new_run_id()
    start  = time.time()

    await log_start("agent11_cover_letter", user_id, run_id)

    try:
        # ── Eligibility: paid tier only ──────────────────────────────────────
        user_result = (
            supabase.table("users")
            .select("id, subscription_tier, ai_generated_persona")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not user_result.data or user_result.data.get("subscription_tier") != "paid":
            await log_skip(run_id, "free_tier_user")
            return {"status": "skipped", "storage_path": None, "reason": "free_tier_user"}

        user_data = user_result.data
        persona   = user_data.get("ai_generated_persona") or "professional"

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
            return {"status": "skipped", "storage_path": None, "reason": "job_not_found"}

        # Fetch required skills + missing skills from fit scores
        skills_result = (
            supabase.table("job_skills")
            .select("skill_name, skill_type")
            .eq("job_id", job_id)
            .limit(20)
            .execute()
        )
        required_skills = [
            row["skill_name"] for row in (skills_result.data or [])
            if row.get("skill_type") == "required"
        ]

        # Get missing skills from fit score if available
        fit_result = (
            supabase.table("job_fit_scores")
            .select("missing_skills")
            .eq("user_id", user_id)
            .eq("job_id", job_id)
            .limit(1)
            .execute()
        )
        missing_skills = []
        if fit_result.data and fit_result.data[0].get("missing_skills"):
            missing_skills = fit_result.data[0]["missing_skills"][:3]

        job = {
            **job_result.data,
            "required_skills": required_skills,
            "missing_skills":  missing_skills,
        }

        # ── Generate cover letter ────────────────────────────────────────────
        storage_path = await write_cover_letter(user_id, job, persona)

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
                "cover_letter_path": storage_path,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", app_result.data[0]["id"]).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, 1, duration_ms)

        return {
            "status":       "completed",
            "storage_path": storage_path,
            "duration_ms":  duration_ms,
        }

    except RuntimeError as exc:
        # Gemini failure
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, f"gemini_failed: {str(exc)}", duration_ms)
        return {"status": "skipped", "storage_path": None, "reason": "gemini_unavailable"}

    except FileNotFoundError as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        return {"status": "failed", "storage_path": None, "error": str(exc)}

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
