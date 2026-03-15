"""
agents/agent6_fit.py
Agent 6 — Fit Scorer

Two modes:
  full_scan  → single user, triggered after resume upload (fit_scores_stale=TRUE)
  delta      → all active paid users, nightly run against is_new=TRUE jobs only

Uses Sarvam-M Think (full_scan) / No-Think (delta).
Never falls back to Gemini.

After all users scored for a scrape:
  - scrape_runs.scoring_complete = TRUE
  - jobs.is_new = FALSE for all scored jobs
  - user_fit_score_cursors.last_scrape_run updated

If score >= 75, user is paid, and job is Tier 1:
  - Triggers Agent 10 (Resume Tailor) and Agent 11 (Cover Letter) on Server 3
"""

import os
import time
import httpx
import asyncio
from datetime import datetime, timezone
from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.prefilter_engine import prefilter
from skills.fit_calculator import score_jobs
from skills.storage_client import get_json_gz
from llm.sarvam import SarvamUnavailableError


async def _score_single_user(
    user_id: str,
    mode: str,
    scrape_run_id: str | None,
    sarvam_mode: str,
) -> int:
    """Score one user. Returns count of scores written."""
    # Load parsed resume
    try:
        parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
    except Exception:
        return 0

    top_skills = parsed.get("top_5_skills", [])

    # Step 1: Prefilter
    jobs = await prefilter(user_id, top_skills, mode=mode)
    if not jobs:
        return 0

    # Step 2: Check tier
    user_result = (
        get_supabase()
        .table("users")
        .select("tier")
        .eq("id", user_id)
        .single()
        .execute()
    )
    is_paid = (user_result.data or {}).get("tier") == "paid"

    # Step 3: Batch LLM scoring
    scored_count = await score_jobs(
        user_id=user_id,
        jobs=jobs,
        parsed_resume=parsed,
        is_paid=is_paid,
        mode=sarvam_mode,
    )

    # Step 5: Trigger Agent 10 + 11 for high-fit scores (paid users, Tier 1 jobs)
    if is_paid and mode == "full_scan":
        for job in jobs:
            score_result = (
                get_supabase()
                .table("job_fit_scores")
                .select("fit_score, apply_tier")
                .eq("user_id", user_id)
                .eq("job_id", job["id"])
                .single()
                .execute()
            )
            if score_result.data:
                score = score_result.data.get("fit_score", 0)
                apply_tier = job.get("apply_tier", 2)
                if score >= 75 and apply_tier == 1:
                    app_result = (
                        get_supabase()
                        .table("job_applications")
                        .select("id")
                        .eq("user_id", user_id)
                        .eq("job_id", job["id"])
                        .single()
                        .execute()
                    )
                    if app_result.data:
                        asyncio.create_task(
                            _trigger_tailoring(
                                user_id, job["id"], app_result.data["id"]
                            )
                        )

    # Step 4: Update cursor
    if scrape_run_id:
        get_supabase().table("user_fit_score_cursors").upsert(
            {
                "user_id": user_id,
                "last_scrape_run": scrape_run_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="user_id",
        ).execute()

    return scored_count


async def run(
    user_id: str | None,
    mode: str,  # "full_scan" | "delta"
    scrape_run_id: str | None = None,
) -> dict:
    """
    Full Agent 6 execution.
    - full_scan: user_id must be set. Scores all active jobs for this user.
    - delta:     user_id=None. Loops all active paid users, scores is_new=TRUE jobs.
    """
    run_id = new_run_id()
    start = time.time()
    await log_start("agent6_fit", user_id, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    sarvam_mode = "think" if mode == "full_scan" else "no_think"

    try:
        if mode == "full_scan":
            # Single user full scan
            if not user_id:
                await log_fail(run_id, "full_scan requires user_id", _ms())
                return {
                    "status": "failed",
                    "duration_ms": _ms(),
                    "records_processed": 0,
                    "error": "user_id required for full_scan",
                }
            try:
                count = await _score_single_user(
                    user_id, "full_scan", scrape_run_id, sarvam_mode
                )
            except SarvamUnavailableError as exc:
                await log_skip(run_id, f"sarvam_unavailable: {exc}")
                return {
                    "status": "skipped",
                    "duration_ms": _ms(),
                    "records_processed": 0,
                    "error": "Sarvam-M unavailable",
                }

            # Clear stale flag
            get_supabase().table("users").update(
                {
                    "fit_scores_stale": False,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", user_id).execute()

            await log_end(run_id, count, _ms())
            return {
                "status": "success",
                "duration_ms": _ms(),
                "records_processed": count,
                "error": None,
            }

        else:
            # Delta mode: loop all active paid users
            users_result = (
                get_supabase()
                .table("users")
                .select("id, tier")
                .eq("tier", "paid")
                .eq("auto_apply_paused", False)
                .execute()
            )
            eligible_users = [u["id"] for u in (users_result.data or [])]

            total_scored = 0
            failed_users = []

            for uid in eligible_users:
                try:
                    count = await _score_single_user(
                        uid, "delta", scrape_run_id, sarvam_mode
                    )
                    total_scored += count
                except SarvamUnavailableError:
                    # Sarvam down: skip remaining users, log and return skipped
                    await log_skip(run_id, "sarvam_unavailable during delta loop")
                    return {
                        "status": "skipped",
                        "duration_ms": _ms(),
                        "records_processed": total_scored,
                        "error": "Sarvam-M unavailable",
                    }
                except Exception as exc:
                    failed_users.append(uid)
                    continue  # don't stop the whole loop for one user

            # Mark is_new = FALSE for all scored jobs
            get_supabase().table("jobs").update(
                {
                    "is_new": False,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("is_new", True).execute()

            # Mark scrape run complete
            if scrape_run_id:
                get_supabase().table("scrape_runs").update(
                    {
                        "scoring_complete": True,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("id", scrape_run_id).execute()

            await log_end(run_id, total_scored, _ms())
            return {
                "status": "success" if not failed_users else "partial",
                "duration_ms": _ms(),
                "records_processed": total_scored,
                "error": f"{len(failed_users)} users failed" if failed_users else None,
            }

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {
            "status": "failed",
            "duration_ms": _ms(),
            "records_processed": 0,
            "error": str(exc)[:500],
        }


async def _trigger_tailoring(user_id: str, job_id: str, app_id: str) -> None:
    """Fire-and-forget: trigger Agent 10 + 11 on Server 3."""
    server3_url = os.environ.get("SERVER3_URL")
    agent_secret = os.environ.get("AGENT_SECRET")
    if not server3_url or not agent_secret:
        return

    payload = {"user_id": user_id, "job_id": job_id, "app_id": app_id}
    headers = {
        "X-Agent-Secret": agent_secret,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            await client.post(
                f"{server3_url}/api/agents/tailor-resume",
                json=payload,
                headers=headers,
            )
            await client.post(
                f"{server3_url}/api/agents/cover-letter",
                json=payload,
                headers=headers,
            )
        except Exception:
            pass
