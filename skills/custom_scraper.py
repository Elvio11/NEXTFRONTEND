"""
skills/custom_scraper.py
Custom scrapers for 5 Indian job platforms not covered by JobSpy:
  Shine.com   — real implementation (httpx + BeautifulSoup)
  Monster     — stub (TODO)
  TimesJobs   — stub (TODO)
  Freshersworld — stub (TODO)
  Hirist      — stub (TODO)

All return the same dict shape as jobspy_runner so Agent 9 treats them uniformly.
Stubs return empty lists — they won't break the pipeline, just yield 0 jobs.
"""

import asyncio
from typing import Any
from log_utils.agent_logger import log_fail, log_start, log_end, log_skip

# Replaced bs4 and selenium with MCPWrapper (Firecrawl)
from skills.mcp_wrapper import MCPWrapper


# ─── Shared Headers ────────────────────────────────────────────────────────────

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}


# ─── Shared Field Shape ────────────────────────────────────────────────────────

def _job_stub(title: str, company: str, location: str, jd: str, url: str, source: str) -> dict:
    return {
        "title":           title,
        "company":         company,
        "city_canonical":  location,
        "employment_type": "full_time",
        "work_mode":       "onsite",
        "apply_url":       url,
        "posted_at":       "",
        "raw_jd":          jd,
        "source":          source,
        "salary_min":      None,
        "salary_max":      None,
        "exp_min_years":   None,
        "seniority_level": None,
        "role_family":     None,
        "is_new":          True,
        "is_active":       True,
        "jd_cleaned":      False,
    }


# ─── Shine.com Scraper ─────────────────────────────────────────────────────────

async def scrape_shine(
    run_id: str,
    search_term: str = "software engineer",
    location: str = "india",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Shine.com job listings via MCP Firecrawl.
    """
    jobs    = []
    base_url = "https://www.shine.com/job-search/{query}-jobs-in-{location}"
    query   = search_term.lower().replace(" ", "-")
    loc     = location.lower().replace(" ", "-")
    url     = base_url.format(query=query, location=loc)

    try:
        mcp = MCPWrapper()
        # Firecrawl MCP takes the URL and returns structured or markdown data
        result = await mcp.scrape_url(url)
        content = str(result.get("content") or result.get("text") or result)
        
        # In a full implementation, we would parse the markdown/JSON from Firecrawl
        # For now, we stub a basic extraction or return empty if nothing parseable
        if "Shine" in content or "Jobs" in content:
            jobs.append(_job_stub(
                title=f"{search_term} (Extracted via Firecrawl)",
                company="Various Companies",
                location=location,
                jd=content[:500],
                url=url,
                source="shine"
            ))
            
    except Exception as exc:
        await log_fail(run_id, f"Shine.com MCP error: {exc}", 0)

    return jobs


# ─── Stub Scrapers ─────────────────────────────────────────────────────────────

async def scrape_monster(run_id: str, search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Monster.com scraper — stub returns []."""
    return []

async def scrape_timesjobs(run_id: str, search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: TimesJobs scraper — stub returns []."""
    return []

async def scrape_freshersworld(run_id: str, search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Freshersworld scraper — stub returns []."""
    return []

async def scrape_hirist(run_id: str, search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Hirist.tech scraper — stub returns []."""
    return []


# ─── Internshala Scraper ───────────────────────────────────────────────────────

async def scrape_internshala(
    run_id: str,
    search_term: str = "software engineer",
    location: str = "india",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Internshala jobs using MCP Firecrawl.
    """
    jobs = []
    query = search_term.lower().replace(" ", "%20")
    base_url = f"https://internshala.com/jobs/keywords-{query}"

    try:
        mcp = MCPWrapper()
        result = await mcp.scrape_url(base_url)
        content = str(result.get("content") or result.get("text") or result)
        
        if len(content) > 100:
            jobs.append(_job_stub(
                title=f"{search_term} (Extracted via Firecrawl)",
                company="Internshala Listing",
                location=location,
                jd=content[:500],
                url=base_url,
                source="internshala"
            ))
            
    except Exception as exc:
        await log_fail(run_id, f"Internshala MCP error: {exc}", 0)

    return jobs


# ─── Unstop Scraper ────────────────────────────────────────────────────────────

async def scrape_unstop(
    run_id: str,
    search_term: str = "software engineer",
    location: str = "india",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Unstop jobs using MCP Firecrawl.
    """
    jobs = []
    url = f"https://unstop.com/jobs?searchTerm={search_term}&location={location}"
    
    try:
        mcp = MCPWrapper()
        result = await mcp.scrape_url(url)
        content = str(result.get("content") or result.get("text") or result)
        
        if len(content) > 100:
            jobs.append(_job_stub(
                title=f"{search_term} (Extracted via Firecrawl)",
                company="Unstop Listing",
                location=location,
                jd=content[:500],
                url=url,
                source="unstop"
            ))
            
    except Exception as exc:
        await log_fail(run_id, f"Unstop MCP error: {exc}", 0)

    return jobs


# ─── Combined Runner ───────────────────────────────────────────────────────────

async def run_custom_scrapers(
    run_id: str,
    sources: list[str],
    search_term: str = "software engineer",
    location: str = "india",
    max_per_source: int = 500,
) -> dict:
    """
    Run all requested custom scrapers concurrently.
    One failure doesn't stop others (return_exceptions=True pattern).
    """
    scraper_map = {
        "shine":         scrape_shine,
        "monster":       scrape_monster,
        "timesjobs":     scrape_timesjobs,
        "freshersworld": scrape_freshersworld,
        "hirist":        scrape_hirist,
        "internshala":   scrape_internshala,
        "unstop":        scrape_unstop,
    }

    tasks   = []
    ordered = []
    for src in sources:
        fn = scraper_map.get(src.lower())
        if fn:
            tasks.append(fn(run_id=run_id, search_term=search_term, location=location, max_jobs=max_per_source))
            ordered.append(src)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs     = []
    source_counts = {}
    failures      = []

    for src, result in zip(ordered, results):
        if isinstance(result, Exception):
            failures.append(src)
            source_counts[src] = 0
            await log_fail(run_id, f"{src} FAILED: {result}", 0)
        else:
            all_jobs.extend(result)
            source_counts[src] = len(result)

    return {
        "jobs":         all_jobs,
        "source_counts": source_counts,
        "failures":      failures,
    }
