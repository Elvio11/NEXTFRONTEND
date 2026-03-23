import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from skills.storage_client import get_json_gz

async def main():
    user_id = "11111111-1111-1111-1111-111111111111"
    print(f"Checking resume for {user_id}...")
    try:
        resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
        import json
        print(json.dumps(resume, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
