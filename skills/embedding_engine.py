"""
skills/embedding_engine.py
Embedding generation and hybrid search using sentence-transformers + pgvector.

Model: paraphrase-multilingual-mpnet-base-v2 (Hugging Face, Apache 2.0)
  - 768 dimensions
  - Handles English and Hindi job descriptions
  - Loaded once on Server 2 startup (lazy singleton)
  - Inference is local — no API cost

Columns written:
  resumes.resume_embedding  vector(768)  — by Agent 3 after parse
  jobs.jd_embedding         vector(768)  — by Agent 7 after JD clean
  jobs.jd_tsvector          tsvector     — by Agent 7 after JD clean
"""

import asyncio
from typing import Optional

from sentence_transformers import SentenceTransformer

from db.client import get_supabase

# ─── Lazy singleton ──────────────────────────────────────────────────────────

_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Load embedding model once. ~300MB, takes ~3s first call."""
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 768-dim embedding from text.
    Synchronous — call from async context via run_in_executor.
    """
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


# ─── Agent 3 integration ─────────────────────────────────────────────────────

async def store_resume_embedding(user_id: str, resume_text: str) -> None:
    """
    Generate embedding for parsed resume text and store in resumes table.
    Called by Agent 3 after successful parse.
    """
    loop = asyncio.get_event_loop()
    embedding = await loop.run_in_executor(None, generate_embedding, resume_text)

    get_supabase().table("resumes").update({
        "resume_embedding": embedding,
    }).eq("user_id", user_id).execute()


# ─── Agent 7 integration ─────────────────────────────────────────────────────

async def store_jd_embedding_and_tsvector(job_id: str, jd_text: str) -> None:
    """
    Generate embedding + tsvector for cleaned JD and update jobs table.
    Called by Agent 7 after JD cleaning.

    jd_tsvector is generated server-side via to_tsvector() SQL function
    to ensure consistency with BM25 search queries.
    """
    loop = asyncio.get_event_loop()
    embedding = await loop.run_in_executor(None, generate_embedding, jd_text)

    # Update embedding directly
    get_supabase().table("jobs").update({
        "jd_embedding": embedding,
    }).eq("id", job_id).execute()

    # Update tsvector via RPC (needs SQL to_tsvector function)
    get_supabase().rpc("update_jd_tsvector", {
        "p_job_id": job_id,
        "p_jd_text": jd_text,
    }).execute()


# ─── Hybrid Search (Agent 6 prefilter replacement) ───────────────────────────

async def hybrid_search(
    resume_embedding: list[float],
    resume_keywords: str,
    user_id: str,
    mode: str = "delta",
    pool_tiers: list[int] | None = None,
    top_n: int = 300,
) -> list[dict]:
    """
    Replace TF-IDF with pgvector hybrid search.

    Combines:
      1. Vector similarity (cosine): jd_embedding <=> resume_embedding
      2. BM25 keyword match: jd_tsvector @@ to_tsquery(resume_keywords)
      3. RRF (Reciprocal Rank Fusion) to merge both rankings

    Args:
        resume_embedding: 768-dim vector from resumes table
        resume_keywords: space-separated keywords for BM25
        user_id: for role_family / blacklist filtering
        mode: "full_scan" or "delta" (delta adds is_new=TRUE filter)
        pool_tiers: which pool tiers to search (default: [1, 2])
        top_n: max results to return (default 300)

    Returns:
        List of job dicts ranked by hybrid score
    """
    if pool_tiers is None:
        pool_tiers = [1, 2]

    delta_clause = "AND j.is_new = TRUE" if mode == "delta" else ""
    pool_clause = f"AND j.pool_tier IN ({','.join(str(p) for p in pool_tiers)})"

    # Convert keywords to tsquery format: "python java react" -> "python | java | react"
    ts_terms = " | ".join(resume_keywords.split()[:20])  # cap at 20 terms

    sql = f"""
        SELECT coalesce(json_agg(t), '[]'::json) FROM (
            WITH vector_rank AS (
                SELECT j.id, j.title, j.company, j.company_canonical,
                       j.city_canonical, j.work_mode, j.role_family,
                       j.seniority_level, j.apply_url, j.jd_summary,
                       j.fingerprint, j.pool_tier, j.remote_viability_score,
                       ROW_NUMBER() OVER (
                           ORDER BY j.jd_embedding <=> '{resume_embedding}'::vector
                       ) AS vec_rank
                FROM jobs j
                WHERE j.role_family IN (
                    SELECT role_family FROM user_target_roles WHERE user_id = '{user_id}'
                )
                AND j.is_active = TRUE
                AND j.jd_embedding IS NOT NULL
                AND j.company_canonical NOT IN (
                    SELECT company_canonical FROM user_company_prefs
                    WHERE user_id = '{user_id}' AND pref_type = 'blacklist'
                )
                {pool_clause}
                {delta_clause}
                ORDER BY j.jd_embedding <=> '{resume_embedding}'::vector
                LIMIT 1000
            ),
            bm25_rank AS (
                SELECT j.id,
                       ROW_NUMBER() OVER (
                           ORDER BY ts_rank_cd(j.jd_tsvector, to_tsquery('english', '{ts_terms}')) DESC
                       ) AS bm25_rank
                FROM jobs j
                WHERE j.jd_tsvector @@ to_tsquery('english', '{ts_terms}')
                AND j.is_active = TRUE
                {pool_clause}
                {delta_clause}
                LIMIT 1000
            )
            SELECT v.*, COALESCE(b.bm25_rank, 1000) as bm25_rank,
                   (1.0 / (60 + v.vec_rank)) + (1.0 / (60 + COALESCE(b.bm25_rank, 1000))) AS rrf_score
            FROM vector_rank v
            LEFT JOIN bm25_rank b ON v.id = b.id
            ORDER BY rrf_score DESC
            LIMIT {top_n}
        ) t
    """

    result = get_supabase().rpc("sql_query", {"query": sql}).execute()
    if not result.data:
        return []
    # result.data is [{'coalesce': [...]}]
    return result.data[0].get("coalesce", [])


async def hyde_search(
    resume_text: str,
    resume_embedding: list[float],
    user_id: str,
    mode: str = "delta",
    pool_tiers: list[int] | None = None,
) -> list[dict]:
    """
    HyDE (Hypothetical Document Embeddings) loop.
    Only fires when first-pass results have weak similarity (avg < 0.6).

    Generates 3 hypothetical JDs from resume via Sarvam-M No-Think,
    re-runs hybrid search with expanded queries, merges results.
    """
    from llm.sarvam import call_sarvam

    # Generate hypothetical JDs
    prompt = f"""Based on this resume, generate 3 short hypothetical job descriptions (2-3 sentences each) for roles this person would be an excellent fit for. Return only the 3 descriptions, numbered 1-3.

Resume excerpt: {resume_text[:1500]}"""

    response = await call_sarvam(prompt, mode="no_think")
    hyde_texts = response.get("content", "").split("\n")
    hyde_texts = [t.strip() for t in hyde_texts if len(t.strip()) > 20][:3]

    all_results = []
    for hyde_text in hyde_texts:
        loop = asyncio.get_event_loop()
        hyde_embedding = await loop.run_in_executor(
            None, generate_embedding, hyde_text
        )
        results = await hybrid_search(
            resume_embedding=hyde_embedding,
            resume_keywords=hyde_text[:200],
            user_id=user_id,
            mode=mode,
            pool_tiers=pool_tiers,
            top_n=100,
        )
        all_results.extend(results)

    # Deduplicate by job ID, keep highest RRF score
    seen = {}
    for job in all_results:
        jid = job["id"]
        if jid not in seen or job.get("rrf_score", 0) > seen[jid].get("rrf_score", 0):
            seen[jid] = job

    return sorted(seen.values(), key=lambda x: x.get("rrf_score", 0), reverse=True)[:300]
