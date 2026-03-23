
import asyncio
import os
import uuid
from dotenv import load_dotenv
from db.client import get_supabase
from skills.storage_client import put
from agents.agent7_jd import run as run_agent7

load_dotenv()

async def test_agent7():
    print("Setting up test job for Agent 7...")
    
    # 1. Create a unique fingerprint
    fingerprint = str(uuid.uuid4()).replace("-", "")
    
    # 2. Upload a dummy raw JD to MinIO
    raw_jd = """
    Software Engineer - Backend
    
    We are looking for a Senior Backend Engineer to join our team.
    Stack: Python, FastAPI, PostgreSQL, AWS.
    Experience: 5+ years.
    
    Responsibilities:
    - Build scalable APIs
    - Optimize database queries
    - Mentor junior engineers
    """
    s3_key = f"jds/{fingerprint}.txt"
    await put(s3_key, raw_jd.encode('utf-8'))
    print(f"Uploaded raw JD to {s3_key}")
    
    # 3. Insert job into DB with jd_cleaned = False
    job_res = get_supabase().table("jobs").insert({
        "fingerprint": fingerprint,
        "title": "Senior Backend Engineer (Test)",
        "company": "Talvix Corp",
        "company_canonical": "talvix",
        "jd_cleaned": False,
        "is_active": True,
        "pool_tier": 1
    }).execute()
    
    job_id = job_res.data[0]["id"]
    print(f"Created job {job_id} in DB")
    
    # 4. Run Agent 7
    print("Running Agent 7...")
    scrape_run_id = str(uuid.uuid4())
    result = await run_agent7(scrape_run_id)
    
    print(f"Agent 7 Result: {result}")
    
    # 5. Verify results
    if result["status"] == "success":
        job_data = get_supabase().table("jobs").select("*").eq("id", job_id).single().execute()
        print(f"Cleaned Job Data: {job_data.data}")
        
        skills = get_supabase().table("job_skills").select("*").eq("job_id", job_id).execute()
        print(f"Extracted Skills: {skills.data}")
    else:
        print(f"Agent 7 FAILED: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_agent7())
