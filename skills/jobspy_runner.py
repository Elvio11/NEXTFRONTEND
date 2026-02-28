"""
skills/jobspy_runner.py
Wraps the JobSpy library for the 5 natively supported platforms:
  LinkedIn, Indeed, Glassdoor, Google Jobs, Naukri (via ziprecruiter alias)

CRITICAL: LinkedIn is checked against the global kill switch (1,500/day)
BEFORE being passed to JobSpy. If the cap is hit, LinkedIn is skipped
for this run — other platforms continue unaffected.

One platform failure does NOT abort the others. Exceptions are caught
per-source and logged. The runner returns whatever it successfully gathered.

Output: list of dicts matching Talvix `jobs` table column shape.
"""

import asyncio
from datetime import date
from typing import Any

from db.client import supabase


# ─── LinkedIn Kill Switch ──────────────────────────────────────────────────────

def _check_linkedin_kill_switch() -> bool:
    """
    Returns True if LinkedIn is BLOCKED (total_linkedin_actions >= 1500 today).
    Called synchronously since JobSpy itself is sync.
    """
    result = (
        supabase.table("system_daily_limits")
        .select("total_linkedin_actions")
        .eq("date", date.today().isoformat())
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0].get("total_linkedin_actions", 0) >= 1500
    return False  # no row yet today → actions = 0, not blocked


# ─── Field Mapping ─────────────────────────────────────────────────────────────

def _map_jobspy_row(row: Any, source: str) -> dict:
    """
    Map a JobSpy DataFrame row (or dict) to the Talvix jobs table shape.
    Returns None for rows that can't be mapped (missing critical fields).
    """
    try:
        title   = str(getattr(row, "title",   "") or "").strip()
        company = str(getattr(row, "company", "") or "").strip()
        location = str(getattr(row, "location", "") or "").strip()
        jd_text  = str(getattr(row, "description", "") or "").strip()

        if not title or not company:
            return None  # cannot fingerprint without these

        return {
            "title":           title,
            "company":         company,
            "city_canonical":  location,
            "employment_type": str(getattr(row, "job_type", "full_time") or "full_time"),
            "work_mode":       _infer_work_mode(location, jd_text),
            "apply_url":       str(getattr(row, "job_url", "") or ""),
            "posted_at":       str(getattr(row, "date_posted", "") or ""),
            "raw_jd":          jd_text,
            "source":          source,
            "salary_min":      _safe_float(getattr(row, "min_amount", None)),
            "salary_max":      _safe_float(getattr(row, "max_amount", None)),
            "exp_min_years":   None,   # extracted by Agent 7 JD cleaning
            "seniority_level": None,   # extracted by Agent 7
            "role_family":     None,   # set by Agent 7
            "is_new":          True,
            "is_active":       True,
            "jd_cleaned":      False,
        }
    except Exception:
        return None


def _infer_work_mode(location: str, jd: str) -> str:
    loc_lower = location.lower()
    jd_lower  = jd.lower()
    if "remote" in loc_lower or "remote" in jd_lower[:500]:
        return "remote"
    if "hybrid" in loc_lower or "hybrid" in jd_lower[:500]:
        return "hybrid"
    return "onsite"


def _safe_float(val) -> float | None:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None


# ─── Main Runner ───────────────────────────────────────────────────────────────

async def run_jobspy(
    sources: list[str],
    max_per_source: int = 5000,
    search_term: str = "software engineer",
    location: str = "India",
) -> dict:
    """
    Run JobSpy for the requested sources.
    LinkedIn is gated by the kill switch — if blocked, it's skipped.
    Returns {"jobs": [...], "linkedin_skipped": bool, "source_counts": {...}, "failures": [...]}.
    """
    try:
        from jobspy import scrape_jobs  # imported here — lazy, Selenium-heavy dep
    except ImportError:
        return {"jobs": [], "linkedin_skipped": False, "source_counts": {}, "failures": ["jobspy_not_installed"]}

    linkedin_skipped = False
    actual_sources   = list(sources)

    if "linkedin" in [s.lower() for s in actual_sources]:
        if _check_linkedin_kill_switch():
            linkedin_skipped = True
            actual_sources   = [s for s in actual_sources if s.lower() != "linkedin"]
            print("[jobspy_runner] LinkedIn SKIPPED — kill switch at 1500")

    jobs      = []
    counts    = {}
    failures  = []

    # JobSpy is synchronous — run in executor to avoid blocking the event loop
    loop = asyncio.get_event_loop()

    for source in actual_sources:
        try:
            df = await loop.run_in_executor(
                None,
                lambda s=source: scrape_jobs(
                    site_name=[s],
                    search_term=search_term,
                    location=location,
                    results_wanted=max_per_source,
                    country_indeed="India",
                ),
            )
            source_jobs = []
            for _, row in df.iterrows():
                mapped = _map_jobspy_row(row, source)
                if mapped:
                    source_jobs.append(mapped)
            jobs.extend(source_jobs)
            counts[source] = len(source_jobs)
            print(f"[jobspy_runner] {source}: {len(source_jobs)} jobs scraped")
        except Exception as exc:
            failures.append(source)
            counts[source] = 0
            print(f"[jobspy_runner] {source} FAILED: {exc}")

    return {
        "jobs":             jobs,
        "linkedin_skipped": linkedin_skipped,
        "source_counts":    counts,
        "failures":         failures,
    }
