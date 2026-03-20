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
    Scrape targeted job boards using Firecrawl MCP.
    Returns: List of job dicts in standard format.
    """
    if platforms is None:
        platforms = list(PLATFORM_URLS.keys())
        
    wrapper = MCPWrapper()
    all_jobs = []
    
    query = search_term.lower().replace(" ", "%20")
    loc   = location.lower().replace(" ", "%20")
    
    for platform in platforms:
        url_template = PLATFORM_URLS.get(platform.lower())
        if not url_template:
            continue
            
        url = url_template.format(query=query, location=loc)
        
        try:
            # Call firecrawl to scrape and convert to markdown
            res = await wrapper.run_tool("firecrawl", {"url": url})
            
            # Firecrawl result usually has 'content' or 'markdown'
            markdown = res.get("content") or res.get("data", {}).get("markdown", "")
            if not markdown:
                continue
                
            # Extract jobs via Sarvam-M for structured parsing
            extracted = await _extract_jobs_from_markdown(markdown, url)
            all_jobs.extend(extracted)
            
        except Exception as exc:
            print(f"Firecrawl scrape failed for {platform} ({url}): {exc}")
            
    return all_jobs


async def _extract_jobs_from_markdown(markdown: str, source_url: str) -> list[dict]:
    """Use Sarvam-M to extract structured job listings from raw markdown."""
    from llm.sarvam import sarvam
    
    prompt = f"""
    Extract all job listings from the following markdown content obtained from {source_url}.
    For each job, extract: title, company, location, city_canonical, apply_url, and a brief raw_jd.
    
    MARKDOWN:
    {markdown[:5000]}
    
    Return ONLY a JSON list of objects.
    """
    try:
        raw = await sarvam.complete(prompt, mode="precise")
        if "[" in raw:
            jobs = json.loads(raw[raw.find("["):raw.rfind("]")+1])
            # Add site info
            for j in jobs:
                j["source"] = source_url
            return jobs
        return []
    except Exception:
        return []
