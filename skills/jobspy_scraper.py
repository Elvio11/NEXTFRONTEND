"""
skills/jobspy_scraper.py
Integrated python-jobspy for LinkedIn and Indeed scraping.
Supports proxies via WEBSHARE_PROXY_URL.
"""

import os
import asyncio
from typing import List, Dict, Optional
from jobspy import scrape_jobs
import pandas as pd

async def run_jobspy_scraper(
    search_term: str = "software engineer",
    location: str = "india",
    platforms: List[str] = ["linkedin", "indeed"],
    results_wanted: int = 20,
    hours_old: int = 72
) -> Dict:
    """
    Run python-jobspy for targeted platforms.
    Returns: { "jobs": [...], "failures": [...] }
    """
    proxy = os.environ.get("WEBSHARE_PROXY_URL")
    
    jobs_list = []
    failures = []
    
    # helper to run jobspy in a thread since it's blocking
    def _scrape():
        try:
            return scrape_jobs(
                site_name=platforms,
                search_term=search_term,
                location=location,
                results_wanted=results_wanted,
                hours_old=hours_old,
                country_indeed='india',
                proxies=[proxy] if proxy else None
            )
        except Exception as e:
            print(f"JobSpy scrape error: {e}")
            return None

    try:
        # Run in thread pool to avoid blocking asyncio loop
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(None, _scrape)
        
        if df is not None and not df.empty:
            for _, row in df.iterrows():
                # Map jobspy fields to Talvix schema
                job = {
                    "title": row.get("title", ""),
                    "company": row.get("company", ""),
                    "city_canonical": row.get("location", location),
                    "apply_url": row.get("job_url", ""),
                    "raw_jd": row.get("description", ""),
                    "source": f"jobspy_{row.get('site', 'unknown')}",
                    "salary_min": row.get("min_amount") if pd.notnull(row.get("min_amount")) else None,
                    "salary_max": row.get("max_amount") if pd.notnull(row.get("max_amount")) else None,
                    "posted_at": row.get("date_posted").isoformat() if pd.notnull(row.get("date_posted")) else "",
                    "employment_type": row.get("job_type", "full_time"), # default
                    # Pool Tier 1 for India, 2 for Remote as per architecture
                    "pool_tier": 1 if "india" in location.lower() else 2
                }
                jobs_list.append(job)
        else:
            if df is None:
                failures.extend(platforms)
    except Exception as e:
        print(f"JobSpy runner error: {e}")
        failures.extend(platforms)
        
    return {
        "jobs": jobs_list,
        "failures": failures
    }
