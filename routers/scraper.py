"""
routers/scraper.py
POST /api/agents/scraper — triggers Agent 9 Job Scraper.

Thin wrapper only: validate request, delegate to agent9, return result.
Auth: Depends(verify_agent_secret) — required on every route.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from middleware.auth import verify_agent_secret
from agents.agent9_scraper import run_scraper

router = APIRouter()


class ScraperRequest(BaseModel):
    sources:        list[str] = ["indeed", "linkedin", "glassdoor", "naukri"]
    custom_sources: list[str] = ["shine", "monster", "timesjobs", "freshersworld", "hirist"]
    max_per_source: int = 5000
    search_term:    str = "software engineer"
    location:       str = "India"


@router.post(
    "/scraper",
    dependencies=[Depends(verify_agent_secret)],
    summary="Agent 9: Job Scraper — scrape all platforms and upsert into jobs table",
)
async def scraper_endpoint(body: ScraperRequest):
    return await run_scraper(
        sources=body.sources,
        custom_sources=body.custom_sources,
        max_per_source=body.max_per_source,
        search_term=body.search_term,
        location=body.location,
    )
