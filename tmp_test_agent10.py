
import asyncio
import os
from dotenv import load_dotenv
from agents.agent10_tailor import run_tailor

load_dotenv()

async def test_agent10():
    print("Running Agent 10 (Resume Tailor)...")
    user_id = '11111111-1111-1111-1111-111111111111'
    job_id = '7de9ad72-9365-45c7-8e33-57662ca44250'
    
    # We might need to fix the tool names in resume_tailor.py if it fails with "tool not found"
    result = await run_tailor(user_id, job_id)
    print(f"Agent 10 Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_agent10())
