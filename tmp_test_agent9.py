
import asyncio
import os
from dotenv import load_dotenv
from agents.agent9_scraper import run_scraper

load_dotenv()

async def test_agent9():
    print("Running Agent 9 (Scraper)...")
    # Testing with Himalayas only for speed and reliability (no auth)
    # Also minimal results for JobSpy
    result = await run_scraper(
        free_api_sources=["himalayas"],
        search_term="python developer",
        location="India"
    )
    print(f"Agent 9 Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_agent9())
