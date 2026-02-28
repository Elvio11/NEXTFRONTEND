---
trigger: always_on
---

# Agent: job_scraper

**Server**: Server 3 (Execution)
**Framework**: FastAPI endpoint + asyncio.gather()
**LLM**: None — pure scraping
**Trigger**: 8 PM IST daily via pg_cron HTTP POST to Server 3 /api/agents/scrape

## Purpose

Fill and maintain the global job pool of 150K–200K active jobs. Scrape all 10 platforms concurrently every night. The entire downstream pipeline (JD cleaning, fit scoring, auto-apply) depends on this pool's freshness and quality.

## Sources — 10 Platforms, All Scraped Simultaneously

**JobSpy library (5 platforms):**
- Indeed, LinkedIn, Glassdoor, Google Jobs, Naukri

**Custom scrapers (5 platforms — proprietary):**
- Internshala, Foundit, Shine, TimesJobs, Cutshort

```python
import asyncio

async def scrape_all():
    results = await asyncio.gather(
        scrape_jobspy(["indeed", "linkedin", "glassdoor", "google", "naukri"]),
        scrape_internshala(),
        scrape_foundit(),
        scrape_shine(),
        scrape_timesjobs(),
        scrape_cutshort(),
        return_exceptions=True   # one failure doesn't stop the others
    )
    return results
```

Expected runtime: 30–60 minutes. Expected yield: ~5,000–8,000 new jobs. ~26,000 refreshed.

## Proxy Rules — Critical

- Webshare residential proxy: **ONLY for LinkedIn scraping** within this agent.
- All other platforms: direct connection from Server 3's static IP.
- If proxy fails: log failure to `scrape_runs.source_failures[]`, skip LinkedIn for this run, continue with remaining 9.
- **Never route auto-apply traffic through proxy.** This is scraping only.

## Deduplication (before every DB write)

```python
fingerprint = sha256(
    title.lower().strip() +
    company.lower().strip() +
    city_canonical.lower().strip() +
    employment_type.lower().strip()
).hexdigest()
```

Fields EXCLUDED from fingerprint: salary, apply_url, posted_date.
Reason: same job on multiple platforms → 1 row in jobs table, multiple rows in job_sources.

## DB Upsert with xmax Detection

```sql
INSERT INTO jobs (fingerprint, title, company, city_canonical, ...)
VALUES (...)
ON CONFLICT (fingerprint) DO UPDATE SET
    last_seen_at = NOW(),
    apply_url = EXCLUDED.apply_url;

-- After upsert, check xmax:
-- xmax = 0  → brand new INSERT → is_new = TRUE (already set by DEFAULT TRUE)
-- xmax ≠ 0  → existing row updated → is_new stays FALSE
```

For new jobs only: write raw JD text to `/storage/jds/{fingerprint}.txt`

## Post-Scrape Actions

1. Write `scrape_runs` record:
   ```python
   {
     "total_scraped": int,
     "total_new": int,           # xmax = 0 count
     "total_refreshed": int,     # xmax ≠ 0 count
     "source_counts": {"indeed": 1200, "linkedin": 800, ...},
     "source_failures": ["timesjobs"],
     "has_new_jobs": True,
     "scoring_complete": False
   }
   ```
2. HTTP POST to Server 2 → Agent 7 (JD Cleaning): `{scrape_run_id}`

## Skills Used
- `job/scraper_engine`
- `job/deduplicator`
- `core/logging`
