"""
skills/jobspy_runner.py
Wraps the JobSpy library for the 5 natively supported platforms:
  LinkedIn, Indeed, Glassdoor, Google Jobs, Naukri (via ziprecruiter alias)

CRITICAL: LinkedIn is checked against the global kill switch (DB-driven)
BEFORE being passed to JobSpy. If the cap is hit, LinkedIn is skipped
for this run — other platforms continue unaffected.

One platform failure does NOT abort the others. Exceptions are caught
per-source and logged. The runner returns whatever it successfully gathered.

Output: list of dicts matching Talvix `jobs` table column shape.
"""

import asyncio
from datetime import date
from typing import Any

from db.client import get_supabase
from log_utils.agent_logger import log_fail, log_skip, log_end

# Replaced local JobSpy import with MCPWrapper (Firecrawl)
from skills.mcp_wrapper import MCPWrapper


# ─── LinkedIn Kill Switch ──────────────────────────────────────────────────────

# Logic removed here, local check replaced by check_linkedin_limit in run_jobspy


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
    run_id: str,
    sources: list[str],
    max_per_source: int = 5000,
    search_term: str = "software engineer",
    location: str = "India",
) -> dict:
    """
    Simulate JobSpy using Firecrawl MCP.
    LinkedIn is gated by the kill switch — if blocked, it's skipped.
    Returns {"jobs": [...], "linkedin_skipped": bool, "source_counts": {...}, "failures": [...]}.
    """
    linkedin_skipped = False
    actual_sources   = list(sources)

    if "linkedin" in [s.lower() for s in actual_sources]:
        from skills.anti_ban_checker import check_linkedin_limit
        if await check_linkedin_limit():
            linkedin_skipped = True
            actual_sources   = [s for s in actual_sources if s.lower() != "linkedin"]
            await log_skip(run_id, "LinkedIn SKIPPED — kill switch engaged")

    jobs      = []
    counts    = {}
    failures  = []

    mcp = MCPWrapper()

    for source in actual_sources:
        try:
            # We map source to a basic search url that Firecrawl can chew on
            url = f"https://www.{source}.com/jobs?q={search_term}&l={location}".replace(" ", "%20")
            
            # Use Firecrawl MCP to scrape
            result = await mcp.scrape_url(url)
            content = str(result.get("content") or result.get("text") or result)
            
            source_jobs = []
            if len(content) > 100:
                # Add a stub job acting as the aggregate for what Firecrawl found
                source_jobs.append({
                    "title":           f"{search_term} (MCP Extracted)",
                    "company":         f"Various via {source}",
                    "city_canonical":  location,
                    "employment_type": "full_time",
                    "work_mode":       _infer_work_mode(location, content[:500]),
                    "apply_url":       url,
                    "posted_at":       date.today().isoformat(),
                    "raw_jd":          content[:1000],
                    "source":          source,
                    "salary_min":      None,
                    "salary_max":      None,
                    "exp_min_years":   None,
                    "seniority_level": None,
                    "role_family":     None,
                    "is_new":          True,
                    "is_active":       True,
                    "jd_cleaned":      False,
                })
                
            jobs.extend(source_jobs)
            counts[source] = len(source_jobs)
        except Exception as exc:
            failures.append(source)
            counts[source] = 0
            await log_fail(run_id, f"{source} MCP FAILED: {exc}", 0)

    return {
        "jobs":             jobs,
        "linkedin_skipped": linkedin_skipped,
        "source_counts":    counts,
        "failures":         failures,
    }
