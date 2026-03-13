from datetime import datetime, timezone, timedelta
import asyncio
from fastapi import APIRouter, Depends
from skills.storage_client import delete, list_keys
from db.client import get_supabase
from middleware.auth import verify_agent_secret

router = APIRouter()

@router.post("/tailored-resumes")
async def cleanup_tailored_resumes(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    result = get_supabase().table("job_applications") \
        .select("id, user_id, tailored_resume_path") \
        .lt("applied_at", cutoff.isoformat()) \
        .not_.is_("tailored_resume_path", "null") \
        .execute()
    
    keys_to_delete = [row["tailored_resume_path"] for row in result.data if row["tailored_resume_path"]]
    
    if keys_to_delete:
        await asyncio.gather(*[delete(key) for key in keys_to_delete])
        
        for row in result.data:
            get_supabase().table("job_applications") \
                .update({"tailored_resume_path": None}) \
                .eq("id", row["id"]) \
                .execute()
    
    return {"deleted": len(keys_to_delete)}

@router.post("/cover-letters")
async def cleanup_cover_letters(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    result = get_supabase().table("job_applications") \
        .select("id, user_id, cover_letter_path") \
        .lt("applied_at", cutoff.isoformat()) \
        .not_.is_("cover_letter_path", "null") \
        .execute()
    
    keys_to_delete = [row["cover_letter_path"] for row in result.data if row["cover_letter_path"]]
    
    if keys_to_delete:
        await asyncio.gather(*[delete(key) for key in keys_to_delete])
        
        for row in result.data:
            get_supabase().table("job_applications") \
                .update({"cover_letter_path": None}) \
                .eq("id", row["id"]) \
                .execute()
    
    return {"deleted": len(keys_to_delete)}

@router.post("/screenshots")
async def cleanup_screenshots(auth=Depends(verify_agent_secret)):
    # To properly clean screenshots, we ideally need to check create dates or metadata.
    # Or fetch all run_ids from db that are older than 7 days, and delete `screenshots/{run_id}`.
    # Returning 0 for now as placeholder unless a specific deletion criteria matches a DB query.
    return {"deleted": 0, "status": "skipped - pending metadata integration"}

@router.post("/jds")
async def cleanup_jds(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    
    # We find jobs that are inactive and last_seen > 30 days ago.
    # Note: If pg_cron deletes them first, we can't find their fingerprints!
    # So this endpoint should ideally be called BEFORE pg_cron deletes the row,
    # or pg_cron should pass the fingerprints in the payload.
    # If pg_cron hasn't deleted them yet:
    result = get_supabase().table("jobs") \
        .select("id, fingerprint") \
        .eq("is_active", False) \
        .lt("last_seen_at", cutoff.isoformat()) \
        .execute()

    keys_to_delete = [f"jds/{row['fingerprint']}.txt" for row in result.data if row.get("fingerprint")]

    if keys_to_delete:
        await asyncio.gather(*[delete(key) for key in keys_to_delete], return_exceptions=True)
    
    return {"deleted": len(keys_to_delete)}
