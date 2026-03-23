
import asyncio
import os
from dotenv import load_dotenv
from agents.agent8_coach import run as run_agent8

load_dotenv()

async def test_agent8():
    print("Running Agent 8 (Coach)...")
    # Note: This will loop all eligible users. 
    # For testing, we expect at least user '11111111-1111-1111-1111-111111111111' to be eligible if it's professional/student tier.
    result = await run_agent8()
    print(f"Agent 8 Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_agent8())
