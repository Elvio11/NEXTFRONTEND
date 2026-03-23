
import asyncio
import os
from dotenv import load_dotenv
from skills.storage_client import exists

load_dotenv()

async def check():
    user_id = '11111111-1111-1111-1111-111111111111'
    key = f"parsed-resumes/{user_id}.json.gz"
    print(f"Checking for {key}...")
    res = await exists(key)
    print(f"Exists: {res}")

if __name__ == "__main__":
    asyncio.run(check())
