"""
agents/agent9_scraper.py
Agent 9 — Job Scraper.

Orchestrates:
  - jobspy_runner (5 platforms): Indeed, LinkedIn, Glassdoor, Naukri, etc.
  - custom_scraper (7 Indian sites): Shine, Monster, TimesJobs, Freshersworld, Hirist, Internshala, Unstop
  - free_api_scrapers (3 APIs): Adzuna (India), Himalayas (Remote), Remotive (Remote)

All sources run concurrently. One failure never blocks others.

For each job returned:
  - Compute SHA-256 fingerprint
  - If duplicate: UPDATE last_seen_at only
  - If new: INSERT with is_new=TRUE, is_active=TRUE, jd_cleaned=FALSE
  - Write raw JD to /storage/jds/{fingerprint}.txt

After completion: HTTP POST to Server 2 /api/agents/jd-clean to trigger Agent 7.

LinkedIn: kill switch checked BEFORE passing LinkedIn to jobspy_runner.

Pool Tier Assignment:
  - Adzuna → Pool Tier 1 (India Domestic)
  - Himalayas → Pool Tier 2 (Verified Global Remote) - via locationRestrictions
  - Remotive → Pool Tier 2 (Verified Global Remote)
"""

import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

import httpx

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.fingerprint import compute_fingerprint, check_duplicate
from skills.jobspy_runner import run_jobspy
from skills.custom_scraper import run_custom_scrapers
from skills.free_api_scrapers import run_free_api_scrapers
from skills.storage_client import put_text
from skills.remote_filter import (
    load_remote_filter_patterns,
    compute_remote_scores,
    compile_patterns,
)


# ─── JD Storage ───────────────────────────────────────────────────────────────


async def _write_jd_to_storage(fingerprint: str, jd_text: str) -> None:
    """Write raw JD to jds/{fingerprint}.txt for new jobs only."""
    await put_text(f"jds/{fingerprint}.txt", jd_text)


# ─── DB Upsert ────────────────────────────────────────────────────────────────


async def _upsert_job(job: dict) -> str:
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
        get_supabase().table("jobs").update(
            {
                "last_seen_at": now_iso,
                "apply_url": job.get("apply_url", existing.get("apply_url", "")),
            }
        ).eq("fingerprint", fingerprint).execute()
        return "updated"
    else:
        # New job: full insert
        raw_jd = job.pop("raw_jd", "")
        remote_source = job.pop("source", "unknown")

        insert_data = {
            **job,
            "fingerprint": fingerprint,
            "is_new": True,
            "is_active": True,
            "jd_cleaned": False,
            "created_at": now_iso,
            "last_seen_at": now_iso,
        }
        # Remove raw_jd from DB row — stored on FluxShare only
        insert_data.pop("raw_jd", None)

        get_supabase().table("jobs").insert(insert_data).execute()

        # Write JD to MinIO storage
        if raw_jd:
            await _write_jd_to_storage(fingerprint, raw_jd)

        # Also record in job_sources
        get_supabase().table("job_sources").insert(
            {
                "fingerprint": fingerprint,
                "source": remote_source,
                "scraped_at": now_iso,
            }
        ).execute()

        return "inserted"


# ─── Post-Scrape Trigger ───────────────────────────────────────────────────────


async def _trigger_jd_clean(scrape_run_id: str) -> None:
    """HTTP POST to Server 2 Agent 7 (JD Clean) after scrape completes."""
    server2_url = os.environ.get("SERVER2_URL", "")
    agent_secret = os.environ["AGENT_SECRET"]

    if not server2_url:
        # Not using structured logger here as it's a utility function outside agent flow
        return

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{server2_url}/api/agents/jd-clean",
                json={
                    "agent": "jd_clean",
                    "user_id": None,
                    "payload": {"scrape_run_id": scrape_run_id},
                },
                headers={"x-agent-secret": agent_secret},
            )
    except Exception:
        pass  # Non-critical failure


# ─── Main Agent ───────────────────────────────────────────────────────────────


async def run_scraper(
    sources: list[str],
    custom_sources: list[str],
    free_api_sources: list[str] | None = None,
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
    # Default free API sources to empty list if not provided
    if free_api_sources is None:
        free_api_sources = []

    run_id = new_run_id()
    start = time.time()

    await log_start("agent9_scraper", None, run_id)

    jobs_inserted = 0
    jobs_updated = 0
    all_failures = []
    source_counts = {}
    linkedin_skipped = False

    try:
        # ── Run all sources concurrently ────────────────────────────────────
        jobspy_task = run_jobspy(run_id, sources, max_per_source, search_term, location)
        custom_task = run_custom_scrapers(
            run_id, custom_sources, search_term, location.lower(), max_per_source // 10
        )

        # Run free API scrapers (Adzuna, Himalayas, Remotive) if configured
        free_api_task = None
        if free_api_sources:
            free_api_task = run_free_api_scrapers(
                run_id,
                free_api_sources,
                search_term,
                location.lower(),
                max_per_source // 10,
            )

        # Gather all tasks
        if free_api_task:
            jobspy_result, custom_result, free_api_result = await asyncio.gather(
                jobspy_task, custom_task, free_api_task, return_exceptions=True
            )
        else:
            jobspy_result, custom_result = await asyncio.gather(
                jobspy_task, custom_task, return_exceptions=True
            )
            free_api_result = None

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

        # Process free API results
        all_jobs_from_free_api = []
        if free_api_result is not None:
            if isinstance(free_api_result, Exception):
                all_failures.append(f"free_api: {str(free_api_result)[:100]}")
            else:
                all_jobs_from_free_api = free_api_result.get("jobs", [])
                source_counts.update(free_api_result.get("source_counts", {}))
                all_failures.extend(free_api_result.get("failures", []))

        all_jobs = all_jobs_from_jobspy + all_jobs_from_custom + all_jobs_from_free_api

        # ── Apply India Remote Filter ─────────────────────────────────────────
        # Load patterns from database
        patterns_dict = await load_remote_filter_patterns()
        compiled_patterns = {
            key: compile_patterns(patterns) for key, patterns in patterns_dict.items()
        }

        for job in all_jobs:
            # Compute remote viability score and pool tier
            remote_score, pool_tier = compute_remote_scores(job, compiled_patterns)
            job["remote_viability_score"] = remote_score
            job["pool_tier"] = pool_tier

            # Legacy behavior: if location contains "India" and title/jd contains "Remote",
            # set source location to "Remote — India" and work_mode to "remote"
            # (keeping for backward compatibility with existing expectations)
            location_raw = str(job.get("city_canonical", "")).lower()
            title_raw = str(job.get("title", "")).lower()
            jd_raw = str(job.get("raw_jd", "")).lower()

            if "india" in location_raw and (
                "remote" in title_raw or "remote" in jd_raw
            ):
                job["city_canonical"] = "Remote — India"
                job["work_mode"] = "remote"

        # ── Upsert all jobs ─────────────────────────────────────────────────
        for job in all_jobs:
            try:
                result = await _upsert_job(job)
                if result == "inserted":
                    jobs_inserted += 1
                else:
                    jobs_updated += 1
            except Exception:
                pass

        # ── Write scrape_runs record ─────────────────────────────────────────
        scrape_run_data = {
            "id": run_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "total_scraped": len(all_jobs),
            "total_new": jobs_inserted,
            "total_refreshed": jobs_updated,
            "source_counts": source_counts,
            "source_failures": all_failures,
            "has_new_jobs": jobs_inserted > 0,
            "scoring_complete": False,
        }
        get_supabase().table("scrape_runs").insert(scrape_run_data).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, jobs_inserted + jobs_updated, duration_ms)

        # ── Trigger Agent 7 JD Clean on Server 2 ────────────────────────────
        if jobs_inserted > 0:
            await _trigger_jd_clean(run_id)

        return {
            "status": "completed" if not all_failures else "partial",
            "jobs_inserted": jobs_inserted,
            "jobs_updated": jobs_updated,
            "deduped": jobs_updated,
            "linkedin_skipped": linkedin_skipped,
            "source_failures": all_failures,
            "run_id": run_id,
            "duration_ms": duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
