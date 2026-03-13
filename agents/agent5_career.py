"""
agents/agent5_career.py
Agent 5 — Career Intelligence

4-dimension career score + salary positioning.
Writes to career_intelligence table + /storage/career-intel/{user_id}.json.gz

"""

import time
from datetime import datetime, timezone, timedelta
from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, new_run_id
from skills.career_scorer import compute_career_score
from skills.storage_client import get_json_gz, put_json_gz


async def run(user_id: str) -> dict:
    """Full Agent 5 execution."""
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent5_career", user_id, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # Load parsed resume from FluxShare
        try:
            parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
        except Exception as exc:
            await log_fail(run_id, f"resume_not_found: {exc}", _ms())
            return {"status": "failed", "duration_ms": _ms(), "records_processed": 0,
                    "error": "Parsed resume not found"}

        # Load user profile for salary and city
        user_result = (
            get_supabase().table("users")
            .select("city_canonical, current_salary_lpa, experience_years")
            .eq("id", user_id)
            .single()
            .execute()
        )
        user_profile = user_result.data or {}

        result = await compute_career_score(user_id, parsed, user_profile)
        benchmarks = result["benchmarks"]
        next_refresh = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

        # Upsert career_intelligence (one row per user)
        get_supabase().table("career_intelligence").upsert({
            "user_id":             user_id,
            "career_score":        result["career_score"],
            "score_components":    result["score_components"],
            "market_demand_score": result["market_demand_score"],
            "salary_p25_lpa":      benchmarks.get("p25_lpa", 0),
            "salary_p50_lpa":      benchmarks.get("p50_lpa", 0),
            "salary_p75_lpa":      benchmarks.get("p75_lpa", 0),
            "salary_p90_lpa":      benchmarks.get("p90_lpa", 0),
            "salary_role_category": result["salary_role_category"],
            "next_refresh_at":     next_refresh,
            "updated_at":          datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()

        # Write full analysis to FluxShare
        await put_json_gz(f"career-intel/{user_id}.json.gz", {"user_id": user_id, **result})

        # Clear stale flag
        get_supabase().table("users").update({
            "career_intel_stale": False,
            "updated_at":         datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        await log_end(run_id, 1, _ms())
        return {"status": "success", "duration_ms": _ms(),
                "records_processed": 1, "error": None}

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {"status": "failed", "duration_ms": _ms(),
                "records_processed": 0, "error": str(exc)[:500]}
