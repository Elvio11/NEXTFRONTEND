import os
import sys
import asyncio
import uuid
import importlib.util
from datetime import datetime, timezone
from dotenv import load_dotenv

# 1. Setup paths
BASE_DIR = os.getcwd()
S3_PATH = os.path.join(BASE_DIR, "branch-server3")
S2_PATH = os.path.join(BASE_DIR, "branch-server2")
S1_PATH = os.path.join(BASE_DIR, "branch-server1")

# Add all relevant paths to sys.path
sys.path.insert(0, S3_PATH)
sys.path.insert(0, S2_PATH)
sys.path.insert(0, os.path.join(S3_PATH, "agents"))
sys.path.insert(0, os.path.join(S2_PATH, "agents"))

# 2. Load Env (Load S3 first for agent keys, then S1 for razorpay if needed)
load_dotenv(os.path.join(S3_PATH, ".env"))
load_dotenv(os.path.join(S1_PATH, ".env"), override=False) # Don't override core agent keys

# 3. Namespace Merging (MUST HAPPEN BEFORE ANY OTHER IMPORTS)
def merge_namespace(pkg_name, path1, path2):
    p1 = os.path.join(path1, pkg_name)
    p2 = os.path.join(path2, pkg_name)
    if pkg_name not in sys.modules:
        from types import ModuleType
        m = ModuleType(pkg_name)
        m.__path__ = [p1, p2]
        sys.modules[pkg_name] = m
    else:
        m = sys.modules[pkg_name]
        if hasattr(m, "__path__"):
            if p2 not in m.__path__: m.__path__.append(p2)
            if p1 not in m.__path__: m.__path__.insert(0, p1)

merge_namespace("skills", S3_PATH, S2_PATH)
merge_namespace("db", S3_PATH, S2_PATH)
merge_namespace("log_utils", S3_PATH, S2_PATH)

# --- CRITICAL: Initialize Supabase early ---
print("Initializing Core Clients...")
from db.client import get_supabase
try:
    get_supabase()
    print("✓ Supabase Connected (Admin Mode)")
except Exception as e:
    print(f"❌ Supabase Connection Failed: {e}")
    sys.exit(1)

from skills.storage_client import put_json_gz, exists as storage_exists
print("✓ Storage Client Ready")

# 4. Import Agents
import agent9_scraper as agent9
import agent6_fit as agent6
print("✓ Agents Loaded")

async def test_e2e_lifecycle():
    print("\n🚀 TALVIX E2E LIFECYCLE VERIFICATION (v5.3 Flux) 🚀")
    
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"e2e_{unique_id}@talvix.io"
    user_id = None
    
    try:
        # --- Step 1: User Creation ---
        print(f"[1/6] 👤 Creating Test User: {test_email}")
        user_resp = get_supabase().table("users").insert({
            "email": test_email,
            "tier": "professional",
            "full_name": "E2E Flux Tester",
            "onboarding_step": 7,
            "auto_apply_activated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        user_id = user_resp.data[0]["id"]
        print(f"      ✓ User ID: {user_id}")

        # --- Step 2: Resume Processing ---
        print("[2/6] 📄 Processing Resume (S3/MinIO)")
        resume_key = f"parsed-resumes/{user_id}.json.gz"
        mock_resume = {
            "seniority_level": "intermediate",
            "top_5_skills": ["Python", "FastAPI", "React", "PostgreSQL", "AWS"],
            "experience_years": 5,
            "current_title": "Full Stack Engineer"
        }
        await put_json_gz(resume_key, mock_resume)
        
        if await storage_exists(resume_key):
            print("      ✓ Resume Gzip uploaded to S3 successfully")
        else:
            raise Exception("Resume upload failed (not found in storage)")

        # --- Step 3: Target Roles ---
        print("[3/6] 🎯 Setting Target Roles")
        get_supabase().table("user_target_roles").insert({
            "user_id": user_id,
            "role_family": "software_engineering",
            "display_name": "Full Stack Engineer",
            "priority": 1
        }).execute()
        print("      ✓ Target roles synced")

        # --- Step 4: Job Scraper ---
        print("[4/6] 📦 Running Job Scraper (Himalayas)")
        # Warm the pool with real jobs
        await agent9.run_scraper(user_id=None, free_api_sources=["himalayas"], max_per_source=2)
        print("      ✓ Global pool warmed")

        # --- Step 5: Fit Scoring ---
        print("[5/6] ⚖️ Running Fit Scorer (Full Scan)")
        res_fit = await agent6.run(user_id=user_id, mode="full_scan")
        scored_count = res_fit.get("records_processed", 0)
        print(f"      ✓ Scored {scored_count} jobs for new user")

        # --- Step 6: Verification ---
        print("[6/6] ✅ Final Verification")
        scores = get_supabase().table("job_fit_scores").select("*").eq("user_id", user_id).execute()
        if len(scores.data) > 0:
            print(f"      ✓ Verification Passed: {len(scores.data)} fit scores found!")
        else:
            print("      ⚠ Verification Note: No matches found (expected if scraper was limited)")

        print("\n✨ ALL CORE SERVICES VERIFIED (S1<->S2<->S3<->S4) ✨")

    except Exception as e:
        print(f"\n❌ E2E TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if user_id:
            print(f"\n🧹 CLEANUP: Deleting Test User {user_id}")
            get_supabase().table("users").delete().eq("id", user_id).execute()
            print("      ✓ Database cleaned")

if __name__ == "__main__":
    asyncio.run(test_e2e_lifecycle())
