---
name: scraper_engine
description: Job scraping orchestration for all 10 platforms. Use this skill when building Agent 9. Covers JobSpy integration for 5 native platforms and custom scraper patterns for the 5 custom platforms. Always run deduplicator skill after scraping.
---

# Skill: scraper_engine

## Purpose
Orchestrate concurrent scraping of all 10 job platforms and normalise results into the jobs table schema.

## Platform Split

### JobSpy Library (5 platforms)
```python
from jobspy import scrape_jobs

jobs = scrape_jobs(
    site_name=["indeed", "linkedin", "glassdoor", "google", "naukri"],
    search_term=role_family_search_term,
    location="India",
    results_wanted=500,
    proxies=WEBSHARE_PROXY if platform == "linkedin" else None
)
```

### Custom Scrapers (5 platforms)
Built per platform — each handles pagination, rate limiting, and HTML parsing independently:
- `internshala_scraper.py`
- `foundit_scraper.py`
- `shine_scraper.py`
- `timesjobs_scraper.py`
- `cutshort_scraper.py`

## Concurrent Execution
```python
import asyncio

async def scrape_all():
    tasks = [
        scrape_jobspy(["indeed", "linkedin", "glassdoor", "google", "naukri"]),
        scrape_internshala(),
        scrape_foundit(),
        scrape_shine(),
        scrape_timesjobs(),
        scrape_cutshort()
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

Handle exceptions per task — if one platform fails, log it to `scrape_runs.source_failures[]` and continue with the rest.

## Output Schema (normalise all platforms to this)
```python
{
    "title": str,
    "company": str,
    "company_canonical": normalise(company),
    "location": str,
    "city_canonical": normalise_city(location),
    "apply_url": str,
    "easy_apply": bool,  # True for Indeed Easy Apply and LinkedIn Easy Apply only
    "platform_primary": str,
    "salary_min_lpa": float | None,
    "salary_max_lpa": float | None,
    "exp_min_years": int | None,
    "exp_max_years": int | None,
    "work_mode": "remote|hybrid|onsite|not_specified",
    "employment_type": "full_time|part_time|contract|internship|not_specified",
    "seniority_level": "intern|junior|mid|senior|lead|manager|director|not_specified",
    "jd_text": str,  # raw JD — written to /storage/jds/{fingerprint}.txt
}
```

## After Each Job
1. Compute fingerprint (deduplicator skill)
2. Write JD to FluxShare: `/storage/jds/{fingerprint}.txt`
3. DB upsert with xmax detection
4. Append to `job_sources` table with platform-specific apply_url
