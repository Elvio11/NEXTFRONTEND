import asyncio
import os
import json
from dotenv import load_dotenv
from agents.agent9_scraper import run_scraper

async def main():
    print("--- STARTING FULL AGENT 9 SCRAPER E2E TEST ---")
    load_dotenv()
    
    # We'll run a small scrape to avoid hitting too many rate limits or taking too long
    # We'll target "Product Manager" in "India" to get diverse results
    try:
        results = await run_scraper(
            free_api_sources=["adzuna"], # only one free api for speed
            search_term="Product Manager",
            location="India",
            max_per_source=10
        )
        
        print("\n--- SCRAPE COMPLETED ---")
        print(f"Status: {results.get('status')}")
        print(f"Jobs Inserted: {results.get('jobs_inserted')}")
        print(f"Jobs Updated (Deduped): {results.get('jobs_updated')}")
        print(f"Source Counts: {json.dumps(results.get('source_counts'), indent=2)}")
        print(f"Failures: {results.get('source_failures')}")
        print(f"Run ID: {results.get('run_id')}")
        print(f"Duration: {results.get('duration_ms')}ms")
        
        if results.get("jobs_inserted", 0) > 0 or results.get("jobs_updated", 0) > 0:
            print("\n✅ Success! The pipeline is flowing to the database.")
        else:
            print("\n⚠️ No jobs were found or upserted. Check logs for failures.")
            
    except Exception as e:
        print(f"\n❌ E2E Test Failed with Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
