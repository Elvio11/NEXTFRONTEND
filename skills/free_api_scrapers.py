"""
skills/free_api_scrapers.py
Free API Scrapers for Agent 9 — Job Scraper.
Implements three zero-Selenium HTTP integrations as per March 16 Locked Decisions.

Scrapers:
  1. Adzuna (India) — Pool Tier 1 — API key required
  2. Himalayas      — Pool Tier 2 — No auth
  3. Remotive       — Pool Tier 2 — No auth

All return dicts matching Talvix jobs table shape.
"""

import asyncio
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

import httpx

from log_utils.agent_logger import log_fail


# ─── Shared Headers ────────────────────────────────────────────────────────────

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "application/json",
}


# ─── Shared Field Shape ───────────────────────────────────────────────────────


def _job_stub(
    title: str,
    company: str,
    location: str,
    jd: str,
    url: str,
    source: str,
    salary_min: int | None = None,
    salary_max: int | None = None,
    pool_tier: int = 1,
    employment_type: str = "full_time",
    work_mode: str = "onsite",
) -> dict:
    return {
        "title": title,
        "company": company,
        "city_canonical": location,
        "employment_type": employment_type,
        "work_mode": work_mode,
        "apply_url": url,
        "posted_at": "",
        "raw_jd": jd,
        "source": source,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "exp_min_years": None,
        "seniority_level": None,
        "role_family": None,
        "is_new": True,
        "is_active": True,
        "jd_cleaned": False,
        "pool_tier": pool_tier,
    }


# ─── Adzuna India API ─────────────────────────────────────────────────────────


async def scrape_adzuna(
    run_id: str,
    search_term: str = "software engineer",
    location: str = "india",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Adzuna India API.
    Auth: Free API key from developer.adzuna.com (Doppler: ADZUNA_APP_ID, ADZUNA_APP_KEY)
    Pool: Tier 1 (India Domestic)
    Returns jobs with salary data.
    """
    app_id = os.environ.get("ADZUNA_APP_ID")
    app_key = os.environ.get("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        await log_fail(run_id, "Adzuna: missing ADZUNA_APP_ID or ADZUNA_APP_KEY", 0)
        return []

    jobs = []
    base_url = "https://api.adzuna.com/v1/api/jobs/in/search"

    # Adzuna uses 1-based page indexing
    page = 1
    max_pages = min(10, (max_jobs // 20) + 1)

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=30.0) as client:
            while len(jobs) < max_jobs and page <= max_pages:
                params = {
                    "app_id": app_id,
                    "app_key": app_key,
                    "what": search_term,
                    "where": location,
                    "page": page,
                    "results_per_page": 20,
                }

                resp = await client.get(base_url, params=params)
                if resp.status_code != 200:
                    break

                data = resp.json()
                results = data.get("results", [])
                if not results:
                    break

                for item in results:
                    try:
                        title = item.get("title", "")
                        company = item.get("company", {}).get("display_name", "")
                        location_raw = item.get("location", {})
                        loc_text = location_raw.get("display_name", location)

                        # Extract salary data
                        salary_raw = item.get("salary_min") or item.get("salary_max")
                        salary_min = item.get("salary_min")
                        salary_max = item.get("salary_max")

                        url = item.get("redirect_url", "")
                        description = item.get("description", "")

                        if title and company:
                            jobs.append(
                                _job_stub(
                                    title=title,
                                    company=company,
                                    location=loc_text,
                                    jd=description[:2000],  # Truncate long JDs
                                    url=url,
                                    source="adzuna",
                                    salary_min=salary_min,
                                    salary_max=salary_max,
                                    pool_tier=1,  # India Domestic
                                    work_mode="onsite",
                                )
                            )
                    except Exception:
                        continue

                page += 1
                await asyncio.sleep(0.5)  # Rate limiting

    except Exception as exc:
        await log_fail(run_id, f"Adzuna error: {exc}", 0)

    return jobs[:max_jobs]


# ─── Himalayas API ───────────────────────────────────────────────────────────


async def scrape_himalayas(
    run_id: str,
    search_term: str = "software engineer",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Himalayas.app API.
    Auth: None (free, no auth required)
    Pool: Tier 2 (Verified Global Remote)
    Has locationRestrictions field — used for pool assignment in remote_filter.
    """
    jobs = []
    page = 1
    base_url = "https://himalayas.app/jobs/api"

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=30.0) as client:
            while len(jobs) < max_jobs and page <= 20:
                params = {
                    "search": search_term,
                    "page": page,
                    "limit": 50,
                }

                resp = await client.get(base_url, params=params)
                if resp.status_code != 200:
                    break

                data = resp.json()
                results = data.get("jobs", [])
                if not results:
                    break

                for item in results:
                    try:
                        title = item.get("title", "")
                        company = (
                            item.get("company", {}).get("name", "")
                            if isinstance(item.get("company"), dict)
                            else str(item.get("company", ""))
                        )
                        location = item.get("location", "Remote")
                        url = item.get("url", "")
                        description = item.get("description", "") or item.get(
                            "content", ""
                        )

                        # Himalayas-specific field for location restrictions
                        location_restrictions = item.get("locationRestrictions", "")

                        # Determine work mode
                        if (
                            "remote" in str(description).lower()
                            or "remote" in location.lower()
                        ):
                            work_mode = "remote"
                        else:
                            work_mode = "onsite"

                        if title and company:
                            job = _job_stub(
                                title=title,
                                company=company,
                                location=location,
                                jd=description[:2000],
                                url=url,
                                source="himalayas",
                                pool_tier=2,  # Verified Global Remote
                                work_mode=work_mode,
                            )
                            # Add locationRestrictions for remote_filter scoring
                            job["locationRestrictions"] = location_restrictions
                            jobs.append(job)
                    except Exception:
                        continue

                page += 1
                await asyncio.sleep(0.5)

    except Exception as exc:
        await log_fail(run_id, f"Himalayas error: {exc}", 0)

    return jobs[:max_jobs]


# ─── Remotive API ────────────────────────────────────────────────────────────


async def scrape_remotive(
    run_id: str,
    search_term: str = "software engineer",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Remotive.com API.
    Auth: None (free, no auth required)
    Pool: Tier 2 (Verified Global Remote)
    Pre-curated remote jobs, clean JSON.
    """
    jobs = []
    page = 0
    base_url = "https://remotive.com/api/remote-jobs"

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=30.0) as client:
            while len(jobs) < max_jobs and page <= 10:
                params = {
                    "search": search_term,
                    "limit": 100,
                    "category": "software-dev",  # Focus on tech roles
                }

                resp = await client.get(base_url, params=params)
                if resp.status_code != 200:
                    break

                data = resp.json()
                results = data.get("jobs", [])
                if not results:
                    break

                for item in results:
                    try:
                        title = item.get("title", "")
                        company = item.get("company_name", "")
                        location = item.get("candidate_required_location", "Remote")
                        url = item.get("url", "")
                        description = item.get("description", "") or item.get(
                            "content", ""
                        )

                        # Extract salary if available
                        salary_min = None
                        salary_max = None
                        salary_raw = item.get("salary", "")
                        if salary_raw:
                            # Parse salary like "80k-120k" or "80000-120000"
                            import re

                            salary_match = re.findall(
                                r"(\d+)", salary_raw.replace(",", "")
                            )
                            if salary_match:
                                salary_min = (
                                    int(salary_match[0]) * 1000
                                    if "k" in salary_raw.lower()
                                    else int(salary_match[0])
                                )
                                if len(salary_match) > 1:
                                    salary_max = (
                                        int(salary_match[1]) * 1000
                                        if "k" in salary_raw.lower()
                                        else int(salary_match[1])
                                    )

                        # Remotive is pre-curated remote, so work_mode is always remote
                        if title and company:
                            jobs.append(
                                _job_stub(
                                    title=title,
                                    company=company,
                                    location=location,
                                    jd=description[:2000],
                                    url=url,
                                    source="remotive",
                                    salary_min=salary_min,
                                    salary_max=salary_max,
                                    pool_tier=2,  # Verified Global Remote
                                    work_mode="remote",
                                )
                            )
                    except Exception:
                        continue

                page += 1
                await asyncio.sleep(0.5)

    except Exception as exc:
        await log_fail(run_id, f"Remotive error: {exc}", 0)

    return jobs[:max_jobs]


# ─── Combined Runner ─────────────────────────────────────────────────────────


async def run_free_api_scrapers(
    run_id: str,
    sources: list[str],
    search_term: str = "software engineer",
    location: str = "india",
    max_per_source: int = 500,
) -> dict:
    """
    Run all requested free API scrapers concurrently.
    One failure doesn't stop others.
    """
    scraper_map = {
        "adzuna": scrape_adzuna,
        "himalayas": scrape_himalayas,
        "remotive": scrape_remotive,
    }

    tasks = []
    ordered = []
    for src in sources:
        fn = scraper_map.get(src.lower())
        if fn:
            # Pass location for adzuna, ignore for others
            if src.lower() == "adzuna":
                tasks.append(
                    fn(
                        run_id=run_id,
                        search_term=search_term,
                        location=location,
                        max_jobs=max_per_source,
                    )
                )
            else:
                tasks.append(
                    fn(run_id=run_id, search_term=search_term, max_jobs=max_per_source)
                )
            ordered.append(src)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    source_counts = {}
    failures = []

    for src, result in zip(ordered, results):
        if isinstance(result, Exception):
            failures.append(src)
            source_counts[src] = 0
            await log_fail(run_id, f"{src} FAILED: {result}", 0)
        else:
            all_jobs.extend(result)
            source_counts[src] = len(result)

    return {
        "jobs": all_jobs,
        "source_counts": source_counts,
        "failures": failures,
    }
