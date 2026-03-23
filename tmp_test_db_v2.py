
import sys
import os
from dotenv import load_dotenv

print(f"Current Working Directory: {os.getcwd()}")
print(f"Does .env exist? {os.path.exists('.env')}")

load_dotenv()

print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL')}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {'[SET]' if os.environ.get('SUPABASE_SERVICE_ROLE_KEY') else '[MISSING]'}")
print(f"AGENT_SECRET: {'[SET]' if os.environ.get('AGENT_SECRET') else '[MISSING]'}")

import asyncio
from db.client import get_supabase

async def test_insert():
    try:
        supabase = get_supabase()
        print("Supabase client initialized.")
        data = {"fingerprint": "test", "title": "Test"}
        # Just test a query
        result = supabase.table("jobs").select("count").limit(1).execute()
        print(f"Query result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_insert())
