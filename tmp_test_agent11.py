import asyncio
import os
import sys
from dotenv import load_dotenv
load_dotenv()

from agents.agent11_cover_letter import run_cover_letter

async def test_agent11():
    user_id = "11111111-1111-1111-1111-111111111111"
    job_id  = "7de9ad72-9365-45c7-8e33-57662ca44250"
    
    print("Running Agent 11 (Cover Letter)...")
    result = await run_cover_letter(user_id, job_id)
    print(f"Agent 11 Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_agent11())
