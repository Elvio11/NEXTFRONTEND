import os
from dotenv import load_dotenv
from supabase import create_client

# Load Env
dotenv_path = r"c:\Users\DELL\Antigravity\Talvix\branch-server1\.env"
load_dotenv(dotenv_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Key exists: {bool(key)}")

try:
    print("Initializing Supabase...")
    supabase = create_client(url, key)
    print("Success!")
    # Simple query
    res = supabase.table("users").select("count", count="exact").limit(1).execute()
    print(f"Query successful: {res.count}")
except Exception as e:
    print(f"Failed: {e}")
    import traceback
    traceback.print_exc()
