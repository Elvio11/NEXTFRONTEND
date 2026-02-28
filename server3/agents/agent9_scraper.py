"""
agents/agent9_scraper.py
Agent 9 — Job Scraper.

Orchestrates jobspy_runner (5 platforms) + custom_scraper (5 Indian sites).
All 10 sources run concurrently. One failure never blocks others.

For each job returned:
  - Compute SHA-256 fingerprint
  - If duplicate: UPDATE last_seen_at only
  - If new: INSERT with is_new=TRUE, is_active=TRUE, jd_cleaned=FALSE
  - Write raw JD to /storage/jds/{fingerprint}.txt

After completion: HTTP POST to Server 2 /api/agents/jd-clean to trigger Agent 7.

LinkedIn: kill switch checked BEFORE passing LinkedIn to jobspy_runner.
"""

import asyncio
import gzip
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.fingerprint import compute_fingerprint, check_duplicate
from skills.jobspy_runner import run_jobspy
from skills.custom_scraper import run_custom_scrapers


# ─── JD Storage ───────────────────────────────────────────────────────────────

def _write_jd_to_storage(fingerprint: str, jd_text: str) -> None:
    """Write raw JD to /storage/jds/{fingerprint}.txt for new jobs only."""
    path = f"/storage/jds/{fingerprint}.txt"
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(jd_text)


# ─── DB Upsert ────────────────────────────────────────────────────────────────

def _upsert_job(job: dict) -> str:
    """
    Upsert a job into the DB.
    Returns "inserted" or "updated".
    """
    fingerprint = compute_fingerprint(
        job["title"],
        job["company"],
        job.get("city_canonical", ""),
        job.get("raw_jd", ""),
    )
    job["fingerprint"] = fingerprint

    existing = check_duplicate(fingerprint)

    now_iso = datetime.now(timezone.utc).isoformat()

    if existing:
        # Duplicate: update last_seen_at and apply_url only
        supabase.table("jobs").update({
            "last_seen_at": now_iso,
            "apply_url":    job.get("apply_url", existing.get("apply_url", "")),
        }).eq("fingerprint", fingerprint).execute()
        return "updated"
    else:
        # New job: full insert
        raw_jd = job.pop("raw_jd", "")
        remote_source = job.pop("source", "unknown")

        insert_data = {
            **job,
            "fingerprint":  fingerprint,
            "is_new":       True,
            "is_active":    True,
            "jd_cleaned":   False,
            "created_at":   now_iso,
            "last_seen_at": now_iso,
        }
        # Remove raw_jd from DB row — stored on FluxShare only
        insert_data.pop("raw_jd", None)

        supabase.table("jobs").insert(insert_data).execute()

        # Write JD to FluxShare storage
        if raw_jd:
            _write_jd_to_storage(fingerprint, raw_jd)

        # Also record in job_sources
        supabase.table("job_sources").insert({
            "fingerprint": fingerprint,
            "source":      remote_source,
            "scraped_at":  now_iso,
        }).execute()

        return "inserted"


# ─── Post-Scrape Trigger ───────────────────────────────────────────────────────

async def _trigger_jd_clean(scrape_run_id: str) -> None:
    """HTTP POST to Server 2 Agent 7 (JD Clean) after scrape completes."""
    server2_url = os.environ.get("SERVER2_URL", "")
    agent_secret = os.environ["AGENT_SECRET"]

    if not server2_url:
        print("[agent9] SERVER2_URL not set — skipping JD clean trigger")
        return

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{server2_url}/api/agents/jd-clean",
                json={"agent": "jd_clean", "user_id": None, "payload": {"scrape_run_id": scrape_run_id}},
                headers={"x-agent-secret": agent_secret},
            )
            print(f"[agent9] JD clean triggered → {resp.status_code}")
    except Exception as exc:
        print(f"[agent9] JD clean trigger failed (non-critical): {exc}")


# ─── Main Agent ───────────────────────────────────────────────────────────────

async def run_scraper(
    sources: list[str],
    custom_sources: list[str],
    max_per_source: int = 5000,
    search_term: str = "software engineer",
    location: str = "India",
) -> dict:
    """
    Main entry point for Agent 9 Job Scraper.

    Runs all sources concurrently. Deduplicates via fingerprint.
    Inserts new jobs, updates existing. Writes scrape_runs record.
    Triggers Agent 7 (JD Clean) after completion.
    """
    run_id = new_run_id()
    start  = time.time()

    await log_start("agent9_scraper", None, run_id)

    jobs_inserted = 0
    jobs_updated  = 0
    all_failures  = []
    source_counts = {}
    linkedin_skipped = False

    try:
        # ── Run all sources concurrently ────────────────────────────────────
        jobspy_task  = run_jobspy(sources, max_per_source, search_term, location)
        custom_task  = run_custom_scrapers(custom_sources, search_term, location.lower(), max_per_source // 10)

        jobspy_result, custom_result = await asyncio.gather(
            jobspy_task, custom_task, return_exceptions=True
        )

        # Process JobSpy results
        if isinstance(jobspy_result, Exception):
            all_failures.append(f"jobspy: {str(jobspy_result)[:100]}")
            all_jobs_from_jobspy = []
        else:
            linkedin_skipped = jobspy_result.get("linkedin_skipped", False)
            all_jobs_from_jobspy = jobspy_result.get("jobs", [])
            source_counts.update(jobspy_result.get("source_counts", {}))
            all_failures.extend(jobspy_result.get("failures", []))

        # Process custom results
        if isinstance(custom_result, Exception):
            all_failures.append(f"custom: {str(custom_result)[:100]}")
            all_jobs_from_custom = []
        else:
            all_jobs_from_custom = custom_result.get("jobs", [])
            source_counts.update(custom_result.get("source_counts", {}))
            all_failures.extend(custom_result.get("failures", []))

        all_jobs = all_jobs_from_jobspy + all_jobs_from_custom

        # ── Upsert all jobs ─────────────────────────────────────────────────
        for job in all_jobs:
            try:
                result = _upsert_job(job)
                if result == "inserted":
                    jobs_inserted += 1
                else:
                    jobs_updated += 1
            except Exception as exc:
                print(f"[agent9] upsert failed for {job.get('title', '?')}: {exc}")

        # ── Write scrape_runs record ─────────────────────────────────────────
        scrape_run_data = {
            "id":               run_id,
            "started_at":       datetime.now(timezone.utc).isoformat(),
            "total_scraped":    len(all_jobs),
            "total_new":        jobs_inserted,
            "total_refreshed":  jobs_updated,
            "source_counts":    source_counts,
            "source_failures":  all_failures,
            "has_new_jobs":     jobs_inserted > 0,
            "scoring_complete": False,
        }
        supabase.table("scrape_runs").insert(scrape_run_data).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, jobs_inserted + jobs_updated, duration_ms)

        # ── Trigger Agent 7 JD Clean on Server 2 ────────────────────────────
        if jobs_inserted > 0:
            await _trigger_jd_clean(run_id)

        return {
            "status":            "completed" if not all_failures else "partial",
            "jobs_inserted":     jobs_inserted,
            "jobs_updated":      jobs_updated,
            "deduped":           jobs_updated,
            "linkedin_skipped":  linkedin_skipped,
            "source_failures":   all_failures,
            "run_id":            run_id,
            "duration_ms":       duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
