
import asyncio
import os
from dotenv import load_dotenv
from llm.gemini import gemini

load_dotenv()

async def check():
    print("Testing Gemini Flash Lite...")
    try:
        resp = await gemini.complete("Hello, return ONLY the word 'OK'", mode="flash_lite")
        print(f"Response: {resp}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
