
import asyncio
import os
from dotenv import load_dotenv
from skills.storage_client import get_text, list_keys

load_dotenv()

async def check():
    print("Listing keys in jds/...")
    try:
        keys = await list_keys("jds/")
        print(f"Found {len(keys)} keys.")
        if keys:
            print(f"Attempting to get text for first key: {keys[0]}")
            text = await get_text(keys[0])
            print(f"Success! Length: {len(text)}")
        else:
            print("No keys found in jds/")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
