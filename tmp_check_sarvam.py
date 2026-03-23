
import asyncio
import os
from dotenv import load_dotenv
from llm.sarvam import sarvam

load_dotenv()

async def check():
    print("Testing Sarvam-M No-Think...")
    try:
        resp = await sarvam.complete("Hello, return ONLY the word 'OK'", mode="no_think")
        print(f"Response: {resp}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
