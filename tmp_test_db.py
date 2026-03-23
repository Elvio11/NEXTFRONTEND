
import sys
import os
import asyncio
from datetime import datetime, timezone

# Add parent dir to path to import from branch-server3
sys.path.append(os.getcwd())

from db.client import get_supabase

async def test_insert():
    print("Testing Supabase insertion...")
    try:
        data = {
            "fingerprint": f"test-fingerprint-{int(datetime.now().timestamp())}",
            "title": "Test Job",
            "company": "Test Company",
            "city_canonical": "Test City",
            "is_new": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = get_supabase().table("jobs").insert(data).execute()
        print(f"Insert result: {result}")
        
        # Cleanup
        get_supabase().table("jobs").delete().eq("fingerprint", data["fingerprint"]).execute()
        print("Cleanup done.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_insert())
