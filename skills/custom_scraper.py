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
import httpx
from typing import Any

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False


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
    search_term: str = "software engineer",
    location: str = "india",
    max_jobs: int = 500,
) -> list[dict]:
    """
    Scrape Shine.com job listings via their public search URL.
    Returns list of dicts matching Talvix jobs table shape.
    """
    if not BS4_AVAILABLE:
        print("[custom_scraper] Shine: beautifulsoup4 not installed — skipping")
        return []

    jobs    = []
    page    = 1
    base_url = "https://www.shine.com/job-search/{query}-jobs-in-{location}"
    query   = search_term.lower().replace(" ", "-")
    loc     = location.lower().replace(" ", "-")
    url     = base_url.format(query=query, location=loc)

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=30.0, follow_redirects=True) as client:
            while len(jobs) < max_jobs and page <= 10:
                paginated = f"{url}?page={page}"
                resp = await client.get(paginated)
                if resp.status_code != 200:
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.find_all("div", class_="jobCard")

                if not cards:
                    # Try alternate card class
                    cards = soup.find_all("div", attrs={"data-jobid": True})

                if not cards:
                    break

                for card in cards:
                    try:
                        title_el   = card.find(["h3", "h2", "a"], class_=lambda c: c and "title" in c.lower())
                        company_el = card.find(["span", "div"], class_=lambda c: c and "company" in c.lower())
                        loc_el     = card.find(["span", "div"], class_=lambda c: c and ("loc" in c.lower() or "city" in c.lower()))
                        link_el    = card.find("a", href=True)

                        title_text   = title_el.get_text(strip=True)   if title_el   else ""
                        company_text = company_el.get_text(strip=True)  if company_el else ""
                        loc_text     = loc_el.get_text(strip=True)      if loc_el     else location
                        href         = link_el["href"]                   if link_el    else ""
                        full_url     = f"https://www.shine.com{href}" if href.startswith("/") else href

                        if title_text and company_text:
                            jobs.append(_job_stub(
                                title_text, company_text, loc_text,
                                "", full_url, "shine"
                            ))
                    except Exception:
                        continue

                page += 1
                # Polite throttle between pages
                await asyncio.sleep(1.5)

    except Exception as exc:
        print(f"[custom_scraper] Shine.com error: {exc}")

    print(f"[custom_scraper] Shine: {len(jobs)} jobs scraped")
    return jobs[:max_jobs]


# ─── Stub Scrapers ─────────────────────────────────────────────────────────────

async def scrape_monster(search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Monster.com scraper — stub returns []."""
    print("[custom_scraper] Monster: stub — not yet implemented")
    return []


async def scrape_timesjobs(search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: TimesJobs scraper — stub returns []."""
    print("[custom_scraper] TimesJobs: stub — not yet implemented")
    return []


async def scrape_freshersworld(search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Freshersworld scraper — stub returns []."""
    print("[custom_scraper] Freshersworld: stub — not yet implemented")
    return []


async def scrape_hirist(search_term: str = "", location: str = "india", max_jobs: int = 500) -> list[dict]:
    """TODO: Hirist.tech scraper — stub returns []."""
    print("[custom_scraper] Hirist: stub — not yet implemented")
    return []


# ─── Combined Runner ───────────────────────────────────────────────────────────

async def run_custom_scrapers(
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
    }

    tasks   = []
    ordered = []
    for src in sources:
        fn = scraper_map.get(src.lower())
        if fn:
            tasks.append(fn(search_term=search_term, location=location, max_jobs=max_per_source))
            ordered.append(src)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs     = []
    source_counts = {}
    failures      = []

    for src, result in zip(ordered, results):
        if isinstance(result, Exception):
            failures.append(src)
            source_counts[src] = 0
            print(f"[custom_scraper] {src} FAILED: {result}")
        else:
            all_jobs.extend(result)
            source_counts[src] = len(result)

    return {
        "jobs":         all_jobs,
        "source_counts": source_counts,
        "failures":      failures,
    }
