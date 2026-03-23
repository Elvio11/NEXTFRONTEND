"""
agents/agent9_scraper.py
Agent 9 — Job Scraper (V4 + MCP).

Orchestrates a consolidated scraping layer:
  - Firecrawl MCP (Job Boards): Indeed, LinkedIn, Glassdoor, Naukri, Freshersworld, Hirist, etc.
  - Free API Scrapers: Adzuna (India), Himalayas (Remote), Remotive (Remote)

All sources run concurrently via official MCP and direct APIs.
Deduplication and India remote filtering handled via skills/fingerprint and skills/remote_filter.
"""
"""
For each job returned:
  - Compute SHA-256 fingerprint
  - If duplicate: UPDATE last_seen_at only
  - If new: INSERT with is_new=TRUE, is_active=TRUE, jd_cleaned=FALSE
  - Write raw JD to /storage/jds/{fingerprint}.txt

After completion: HTTP POST to Server 2 /api/agents/jd-clean to trigger Agent 7.

LinkedIn: kill switch checked BEFORE passing LinkedIn to jobspy_runner.

Pool Tier Assignment:
  - Adzuna -> Pool Tier 1 (India Domestic)
  - Himalayas -> Pool Tier 2 (Verified Global Remote) - via locationRestrictions
  - Remotive -> Pool Tier 2 (Verified Global Remote)
"""

import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Tuple, Optional

import httpx

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.fingerprint import compute_fingerprint, check_duplicate
from skills.free_api_scrapers import run_free_api_scrapers
from skills.firecrawl_scraper import run_firecrawl_scrapers
from skills.jobspy_scraper import run_jobspy_scraper
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

        # Allowed columns for the 'jobs' table as per definitive schema (00_init.sql + v6 patch)
        ALLOWED_COLUMNS = {
            "fingerprint", "title", "company", "company_canonical", 
            "city_canonical", "state", "country", "work_mode", 
            "employment_type", "seniority_level", "role_family", 
            "jd_summary", "apply_url", "salary_min_lpa", "salary_max_lpa", 
            "posted_at", "pool_tier", "remote_viability_score", 
            "is_new", "is_active", "jd_cleaned", "created_at", "last_seen_at"
        }

        # Ensure required fields and canonical forms
        if "company_canonical" not in job and "company" in job:
            job["company_canonical"] = str(job["company"]).lower()
        if "country" not in job:
            job["country"] = "india"

        # Normalize employment_type and work_mode to match DB CHECK constraints
        ET_MAP = {"fulltime": "full_time", "full-time": "full_time", "parttime": "part_time", "part-time": "part_time", "intern": "internship"}
        WM_MAP = {"on-site": "onsite", "in-office": "onsite", "remote": "remote", "hybrid": "hybrid"}

        et = str(job.get("employment_type", "")).lower().replace(" ", "_")
        job["employment_type"] = ET_MAP.get(et, et) if et else None
        if job["employment_type"] not in ["full_time", "part_time", "contract", "internship"]:
            job["employment_type"] = None # Avoid constraint violation

        wm = str(job.get("work_mode", "")).lower().replace(" ", "_").replace("-", "")
        job["work_mode"] = WM_MAP.get(wm, wm) if wm else None
        if job["work_mode"] not in ["remote", "hybrid", "onsite"]:
            job["work_mode"] = None # Avoid constraint violation

        insert_data = {
            "fingerprint": fingerprint,
            "is_new": True,
            "is_active": True,
            "jd_cleaned": False,
            "created_at": now_iso,
            "last_seen_at": now_iso,
        }
        
        # Add fields from job if they are in ALLOWED_COLUMNS
        for k, v in job.items():
            if k in ALLOWED_COLUMNS:
                insert_data[k] = v

        # ── Step 1: Upsert jobs table ──────────────────────────────────
        job_resp = get_supabase().table("jobs").upsert(
            insert_data, 
            on_conflict="fingerprint"
        ).execute()
        
        # Capture job_id for sources/skills linking
        job_id = None
        if job_resp.data:
            job_id = job_resp.data[0]["id"]

        # ── Step 2: Upsert job_sources ─────────────────────────────
        if job_id:
            source_data = {
                "job_id": job_id,
                "platform": remote_source, # Use the 'source' popped earlier
                "apply_url": job.get("apply_url") or "https://talvix.in/jobs/unknown",
                "scraped_at": now_iso
            }
            
            # Check for existing source to avoid duplicates
            try:
                get_supabase().table("job_sources").upsert(
                    source_data,
                    on_conflict="job_id,platform" # Requires unique constraint on these two
                ).execute()
            except Exception as e:
                print(f"DEBUG: job_sources upsert failed for {fingerprint}: {e}")

        # Write JD to MinIO storage
        if raw_jd:
            await _write_jd_to_storage(fingerprint, raw_jd)

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
            await client.post(
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
    user_id: Optional[str] = None,
    free_api_sources: list[str] = ["adzuna", "himalayas", "remotive"],
    max_per_source: int = 5000,
    search_term: Optional[str] = None,
    location: str = "India",
) -> dict:
    """
    Main entry point for Agent 9 Job Scraper.

    Tiered Logic:
    1. If user_id is provided: Scrape roles from user_target_roles.
    2. If user_id is None: Scrape roles from baseline_scrape_targets (Day 0 pool).
    """
    run_id = new_run_id()
    start = time.time()
    await log_start("agent9_scraper", user_id, run_id)

    targets = []
    if user_id:
        # Fetch user's target roles
        resp = get_supabase().table("user_target_roles").select("role_family, display_name").eq("user_id", user_id).execute()
        for r in resp.data:
            targets.append({"term": r["display_name"], "loc": location})
    elif search_term:
        # One-off search
        targets = [{"term": search_term, "loc": location}]
    else:
        # Baseline run: fetch up to 10 active targets from baseline_scrape_targets
        resp = get_supabase().table("baseline_scrape_targets").select("role_name, location").eq("is_active", True).order("priority", desc=True).limit(10).execute()
        for r in resp.data:
            targets.append({"term": r["role_name"], "loc": r["location"]})

    if not targets:
        await log_skip(run_id, "No scrape targets found.")
        return {"status": "skipped", "reason": "no_targets"}

    total_inserted = 0
    total_updated = 0
    all_failures = []
    source_counts = {}

    try:
        # setup remote filter patterns once
        patterns_dict = await load_remote_filter_patterns()
        compiled_patterns = {
            key: compile_patterns(patterns) for key, patterns in patterns_dict.items()
        }

        # Iterate through targets
        for target in targets:
            term = target["term"]
            loc = target["loc"]

            # 1. Start Scrapers
            free_api_task = run_free_api_scrapers(
                run_id,
                free_api_sources,
                term,
                loc.lower(),
                max_per_source // 10 if not user_id else 50,
            )

            firecrawl_task = run_firecrawl_scrapers(
                search_term=term,
                location=loc
            )

            jobspy_task = run_jobspy_scraper(
                search_term=term,
                location=loc,
                platforms=["indeed"] if skip_linkedin else ["linkedin", "indeed"],
                results_wanted=20 if not user_id else 10
            )

            # 2. Gather Results
            results = await asyncio.gather(
                free_api_task, 
                firecrawl_task, 
                jobspy_task, 
                return_exceptions=True
            )
            
            free_api_res, firecrawl_res, jobspy_res = results

            # 3. Process results for this target
            target_jobs = []

            # Free APIs
            if isinstance(free_api_res, dict):
                target_jobs.extend(free_api_res.get("jobs", []))
                for s, c in free_api_res.get("source_counts", {}).items():
                    source_counts[s] = source_counts.get(s, 0) + c
                all_failures.extend(free_api_res.get("failures", []))
            
            # Firecrawl
            if isinstance(firecrawl_res, list):
                target_jobs.extend(firecrawl_res)
                source_counts["firecrawl"] = source_counts.get("firecrawl", 0) + len(firecrawl_res)
            elif isinstance(firecrawl_res, Exception):
                all_failures.append(f"firecrawl:{term}")

            # JobSpy
            if isinstance(jobspy_res, dict):
                js_jobs = jobspy_res.get("jobs", [])
                target_jobs.extend(js_jobs)
                source_counts["jobspy"] = source_counts.get("jobspy", 0) + len(js_jobs)
                all_failures.extend(jobspy_res.get("failures", []))
            elif isinstance(jobspy_res, Exception):
                all_failures.append(f"jobspy:{term}")

            # 4. Filter and Upsert
            for job in target_jobs:
                # Apply scoring
                remote_score, pool_tier = compute_remote_scores(job, compiled_patterns)
                job["remote_viability_score"] = int(remote_score)
                job["pool_tier"] = int(pool_tier)

                # Legacy Remote — India mapping
                lr = str(job.get("city_canonical", "")).lower()
                if "india" in lr and ("remote" in str(job.get("title", "")).lower() or "remote" in str(job.get("raw_jd", "")).lower()):
                    job["city_canonical"] = "Remote — India"
                    job["work_mode"] = "remote"

                try:
                    res = await _upsert_job(job)
                    if res == "inserted":
                        total_inserted += 1
                    else:
                        total_updated += 1
                except Exception:
                    pass

        # ── Finalize Scrape Run ──────────────────────────────────────────────
        scrape_run_data = {
            "id": run_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "total_scraped": total_inserted + total_updated,
            "total_new": total_inserted,
            "total_refreshed": total_updated,
            "source_counts": source_counts,
            "source_failures": list(set(all_failures)),
            "has_new_jobs": total_inserted > 0,
            "scoring_complete": False,
        }
        get_supabase().table("scrape_runs").insert(scrape_run_data).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, total_inserted + total_updated, duration_ms)

        # Mark baseline targets as scraped
        if not user_id and not search_term:
            get_supabase().table("baseline_scrape_targets").update({
                "last_scraped_at": datetime.now(timezone.utc).isoformat()
            }).in_("role_name", [t["term"] for t in targets]).execute()

        # Trigger Agent 7
        if total_inserted > 0:
            await _trigger_jd_clean(run_id)

        return {
            "status": "completed" if not all_failures else "partial",
            "jobs_inserted": total_inserted,
            "jobs_updated": total_updated,
            "run_id": run_id,
            "duration_ms": duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
