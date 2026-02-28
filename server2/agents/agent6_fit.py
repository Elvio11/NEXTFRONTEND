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
"""

import gzip
import json
import time
from datetime import datetime, timezone

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.prefilter_engine import prefilter
from skills.fit_calculator import score_jobs
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
        resume_path = f"/storage/parsed-resumes/{user_id}.json.gz"
        with gzip.open(resume_path, "rt", encoding="utf-8") as f:
            parsed = json.load(f)
    except Exception:
        return 0

    top_skills = parsed.get("top_5_skills", [])

    # Step 1: Prefilter
    jobs = await prefilter(user_id, top_skills, mode=mode)
    if not jobs:
        return 0

    # Step 2: Check tier
    user_result = (
        supabase.table("users")
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

    # Step 4: Update cursor
    if scrape_run_id:
        supabase.table("user_fit_score_cursors").upsert({
            "user_id":          user_id,
            "last_scrape_run":  scrape_run_id,
            "updated_at":       datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()

    return scored_count


async def run(
    user_id: str | None,
    mode: str,          # "full_scan" | "delta"
    scrape_run_id: str | None = None,
) -> dict:
    """
    Full Agent 6 execution.
    - full_scan: user_id must be set. Scores all active jobs for this user.
    - delta:     user_id=None. Loops all active paid users, scores is_new=TRUE jobs.
    """
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent6_fit", user_id, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    sarvam_mode = "think" if mode == "full_scan" else "no_think"

    try:
        if mode == "full_scan":
            # Single user full scan
            if not user_id:
                await log_fail(run_id, "full_scan requires user_id", _ms())
                return {"status": "failed", "duration_ms": _ms(),
                        "records_processed": 0, "error": "user_id required for full_scan"}
            try:
                count = await _score_single_user(user_id, "full_scan", scrape_run_id, sarvam_mode)
            except SarvamUnavailableError as exc:
                await log_skip(run_id, f"sarvam_unavailable: {exc}")
                return {"status": "skipped", "duration_ms": _ms(),
                        "records_processed": 0, "error": "Sarvam-M unavailable"}

            # Clear stale flag
            supabase.table("users").update({
                "fit_scores_stale": False,
                "updated_at":       datetime.now(timezone.utc).isoformat(),
            }).eq("id", user_id).execute()

            await log_end(run_id, count, _ms())
            return {"status": "success", "duration_ms": _ms(),
                    "records_processed": count, "error": None}

        else:
            # Delta mode: loop all active paid users
            users_result = (
                supabase.table("users")
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
                    count = await _score_single_user(uid, "delta", scrape_run_id, sarvam_mode)
                    total_scored += count
                except SarvamUnavailableError:
                    # Sarvam down: skip remaining users, log and return skipped
                    await log_skip(run_id, "sarvam_unavailable during delta loop")
                    return {"status": "skipped", "duration_ms": _ms(),
                            "records_processed": total_scored, "error": "Sarvam-M unavailable"}
                except Exception as exc:
                    failed_users.append(uid)
                    continue  # don't stop the whole loop for one user

            # Mark is_new = FALSE for all scored jobs
            supabase.table("jobs").update({
                "is_new":     False,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("is_new", True).execute()

            # Mark scrape run complete
            if scrape_run_id:
                supabase.table("scrape_runs").update({
                    "scoring_complete": True,
                    "updated_at":       datetime.now(timezone.utc).isoformat(),
                }).eq("id", scrape_run_id).execute()

            await log_end(run_id, total_scored, _ms())
            return {
                "status": "success" if not failed_users else "partial",
                "duration_ms":       _ms(),
                "records_processed": total_scored,
                "error":             f"{len(failed_users)} users failed" if failed_users else None,
            }

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {"status": "failed", "duration_ms": _ms(),
                "records_processed": 0, "error": str(exc)[:500]}
