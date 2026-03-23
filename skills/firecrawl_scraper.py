"""
skills/firecrawl_scraper.py (V4 Consolidated Scraper).

Leverages Firecrawl MCP to scrape job listing pages and extract structured JD data.
Maintains a target list of "hard-to-scrape" sites that free APIs don't cover.
Utilizes the official Firecrawl MCP SDK via MCPWrapper for high-fidelity extraction.
"""

import json
from typing import Optional, List
from skills.mcp_wrapper import MCPWrapper

PLATFORM_URLS = {
    "indeed": "https://www.indeed.com/jobs?q={query}&l={location}",
    "linkedin": "https://www.linkedin.com/jobs/search?keywords={query}&location={location}",
    "glassdoor": "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}&locT=C&locId={location}",
    "naukri": "https://www.naukri.com/{query}-jobs-in-{location}",
    "unstop": "https://unstop.com/jobs?searchTerm={query}&location={location}",
    "freshersworld": "https://www.freshersworld.com/jobs/keywords-{query}",
    "hirist": "https://www.hirist.tech/search?keyword={query}&location={location}"
}

async def run_firecrawl_scrapers(
    search_term: str = "software engineer",
    location: str = "india",
    platforms: Optional[list[str]] = None
) -> list[dict]:
    """
    Scrape targeted job boards using Firecrawl MCP with structured extraction.
    Returns: List of job dicts in standard format.
    """
    if platforms is None:
        # Exclude linkedin from firecrawl due to service blocks, will use jobspy
        platforms = [p for p in PLATFORM_URLS.keys() if p != "linkedin"]
        
    wrapper = MCPWrapper()
    all_jobs = []
    
    query = search_term.lower().replace(" ", "%20")
    loc   = location.lower().replace(" ", "%20")
    
    job_schema = {
        "type": "object",
        "properties": {
            "jobs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "company": {"type": "string"},
                        "location": {"type": "string"},
                        "city_canonical": {"type": "string"},
                        "apply_url": {"type": "string"},
                        "raw_jd": {"type": "string"}
                    },
                    "required": ["title", "company", "location"]
                }
            }
        }
    }
    
    for platform in platforms:
        url_template = PLATFORM_URLS.get(platform.lower())
        if not url_template:
            continue
            
        url = url_template.format(query=query, location=loc)
        
        try:
            # Call firecrawl to scrape and extract as JSON
            res = await wrapper.run_tool("firecrawl", {
                "url": url,
                "formats": ["extract"],
                "schema": job_schema
            })
            
            # Firecrawl extract endpoint returns the raw JSON under data.extract
            extracted_data = res.get("data", {}).get("extract", {})
            jobs = extracted_data.get("jobs", [])
            
            # Add source tracking
            for j in jobs:
                j["source"] = "firecrawl_" + platform
                
            all_jobs.extend(jobs)
            
        except Exception as exc:
            print(f"Firecrawl scrape failed for {platform} ({url}): {exc}")
            
    return all_jobs

