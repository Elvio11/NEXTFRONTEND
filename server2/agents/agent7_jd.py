"""
agents/agent7_jd.py
Agent 7 — JD Cleaning (Sub-task 1 of document_tailor)

Processes all jobs WHERE jd_cleaned = FALSE AND is_active = TRUE.
Uses Gemini Flash Lite — extraction task, not reasoning.

For each job:
  1. Load raw JD from /storage/jds/{fingerprint}.txt
  2. Gemini Flash Lite: extract required_skills, role_family, jd_summary
  3. INSERT job_skills rows
  4. UPDATE jobs: jd_cleaned=TRUE, role_family, jd_summary

After ALL jobs cleaned:
  HTTP POST to Server 2 /api/agents/fit-score (delta mode, with scrape_run_id)
"""

import os
import time
from datetime import datetime, timezone

import httpx

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, new_run_id
from skills.jd_cleaner import clean_jd


async def run(scrape_run_id: str) -> dict:
    """Full Agent 7 execution for a given scrape run."""
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent7_jd", None, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # Fetch all uncleaned active jobs with their fingerprints
        result = (
            supabase.table("jobs")
            .select("id, fingerprint, title, company")
            .eq("jd_cleaned", False)
            .eq("is_active", True)
            .execute()
        )
        jobs = result.data or []

        cleaned_count = 0
        for job in jobs:
            job_id      = job["id"]
            fingerprint = job["fingerprint"]
            jd_path     = f"/storage/jds/{fingerprint}.txt"

            # Load raw JD text
            try:
                with open(jd_path, "r", encoding="utf-8", errors="ignore") as f:
                    raw_jd = f.read()
            except FileNotFoundError:
                # JD file missing — mark as cleaned with empty data to avoid repeat
                supabase.table("jobs").update({
                    "jd_cleaned": True,
                    "jd_summary": "",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", job_id).execute()
                continue

            # Call Gemini Flash Lite
            cleaned = await clean_jd(raw_jd)
            if not cleaned:
                continue  # skip on parse failure — will retry next run

            # Insert job_skills rows
            required_skills    = cleaned.get("required_skills", [])
            nice_to_have_skills = cleaned.get("nice_to_have_skills", [])

            skills_rows = [
                {"job_id": job_id, "skill_name": s, "skill_type": "required"}
                for s in required_skills
            ] + [
                {"job_id": job_id, "skill_name": s, "skill_type": "nice_to_have"}
                for s in nice_to_have_skills
            ]

            if skills_rows:
                supabase.table("job_skills").upsert(
                    skills_rows, on_conflict="job_id,skill_name"
                ).execute()

            # Update jobs table
            supabase.table("jobs").update({
                "jd_cleaned":  True,
                "role_family": cleaned.get("role_family"),
                "jd_summary":  cleaned.get("jd_summary", "")[:500],
                "updated_at":  datetime.now(timezone.utc).isoformat(),
            }).eq("id", job_id).execute()

            cleaned_count += 1

        # Trigger Agent 6 delta mode on this server
        agent_secret = os.environ["AGENT_SECRET"]
        server2_url  = os.environ.get("SERVER2_URL", "http://localhost:8002")

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{server2_url}/api/agents/fit-score",
                    json={
                        "agent":   "fit_score",
                        "user_id": None,
                        "payload": {"mode": "delta", "scrape_run_id": scrape_run_id},
                    },
                    headers={"X-Agent-Secret": agent_secret},
                )
        except Exception:
            pass  # Non-fatal — fit scoring will run on next trigger

        await log_end(run_id, cleaned_count, _ms())
        return {"status": "success", "duration_ms": _ms(),
                "records_processed": cleaned_count, "error": None}

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {"status": "failed", "duration_ms": _ms(),
                "records_processed": 0, "error": str(exc)[:500]}
