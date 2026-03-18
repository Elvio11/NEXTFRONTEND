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
    """
    Delete screenshots from MinIO for agent runs older than 7 days.
    Screenshots are stored as screenshots/{run_id}/ in the MinIO bucket.
    We query agent_logs for old completed/failed runs and delete their screenshot folders.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    # Fetch old run_ids from agent_logs
    result = get_supabase().table("agent_logs") \
        .select("id") \
        .lt("completed_at", cutoff.isoformat()) \
        .in_("status", ["completed", "failed"]) \
        .execute()

    run_ids = [row["id"] for row in (result.data or []) if row.get("id")]

    deleted_count = 0
    for run_id in run_ids:
        prefix = f"screenshots/{run_id}"
        keys = await list_keys(prefix)
        if keys:
            await asyncio.gather(*[delete(key) for key in keys], return_exceptions=True)
            deleted_count += len(keys)

    return {"deleted": deleted_count, "runs_checked": len(run_ids)}

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
