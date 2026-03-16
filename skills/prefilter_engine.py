"""
skills/prefilter_engine.py
Step 1 of fit scoring: reduce 200K jobs to ~300 per user.

March 16 Locked Decision: TF-IDF replaced by pgvector hybrid search.
Uses embedding_engine.hybrid_search (vector cosine + BM25 tsvector + RRF fusion).
Optional HyDE loop for weak profiles (avg similarity < 0.6).

Must complete in <5 seconds for delta mode.
Returns a list of job dicts ready for LLM scoring.
"""

from typing import Optional

from db.client import get_supabase
from skills.embedding_engine import hybrid_search, hyde_search
from skills.storage_client import get_json_gz


async def prefilter(
    user_id: str,
    top_skills: list[str],
    mode: str = "delta",          # "full_scan" | "delta"
) -> list[dict]:
    """
    Run pgvector hybrid search (replaces TF-IDF).
    Returns at most 300 jobs (full_scan) or 100 jobs (delta).
    """
    top_n = 300 if mode == "full_scan" else 100

    # Get user's resume embedding from DB
    resume_result = (
        get_supabase()
        .table("resumes")
        .select("resume_embedding")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    resume_embedding = (resume_result.data or {}).get("resume_embedding")

    if not resume_embedding:
        # No embedding yet — fall back to empty result (Agent 3 hasn't run embeddings)
        return []

    # Determine pool tiers based on user plan
    user_result = (
        get_supabase()
        .table("users")
        .select("tier")
        .eq("id", user_id)
        .single()
        .execute()
    )
    user_tier = (user_result.data or {}).get("tier", "free")

    # Student: Pool 1 only. Professional: All pools. Free: Pool 1 only.
    if user_tier == "professional":
        pool_tiers = [1, 2, 3]
    else:
        pool_tiers = [1]

    # Build keyword string from top skills
    resume_keywords = " ".join(top_skills[:15])

    # Run hybrid search
    results = await hybrid_search(
        resume_embedding=resume_embedding,
        resume_keywords=resume_keywords,
        user_id=user_id,
        mode=mode,
        pool_tiers=pool_tiers,
        top_n=top_n,
    )

    # If results are weak and mode is full_scan, try HyDE
    if mode == "full_scan" and len(results) < 10:
        try:
            parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
            resume_text = parsed.get("raw_text", "")
            hyde_results = await hyde_search(
                resume_text=resume_text,
                resume_embedding=resume_embedding,
                user_id=user_id,
                mode=mode,
                pool_tiers=pool_tiers,
            )
            # Merge — dedupe by ID, keep HyDE results as supplement
            existing_ids = {r["id"] for r in results}
            for hr in hyde_results:
                if hr["id"] not in existing_ids:
                    results.append(hr)
                    existing_ids.add(hr["id"])
                    if len(results) >= top_n:
                        break
        except Exception:
            pass  # HyDE is optional — non-fatal

    return results[:top_n]
