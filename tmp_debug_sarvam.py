import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from llm.sarvam import sarvam

async def main():
    print("Testing Sarvam-M...")
    try:
        resp = await sarvam.complete("Hello", "no_think")
        print(f"Response: {resp}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
