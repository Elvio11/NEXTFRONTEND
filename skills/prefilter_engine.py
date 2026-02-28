"""
skills/prefilter_engine.py
Step 1 of fit scoring: reduce 200K jobs to ~100-300 per user.
Zero LLM tokens here — SQL hard filter + TF-IDF cosine similarity only.

Must complete in <5 seconds for delta mode.
Returns a list of job dicts ready for LLM scoring.
"""

from typing import Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from db.client import supabase


def _build_skill_query_sql(user_id: str, mode: str) -> str:
    """
    Build the SQL prefilter query.
    Delta mode adds AND j.is_new = TRUE.
    """
    delta_clause = "AND j.is_new = TRUE" if mode == "delta" else ""
    return f"""
        SELECT j.id, j.title, j.company, j.company_canonical,
               j.city_canonical, j.work_mode, j.role_family,
               j.seniority_level, j.apply_url, j.jd_summary,
               j.fingerprint
        FROM jobs j
        WHERE j.role_family IN (
            SELECT role_family FROM user_target_roles WHERE user_id = '{user_id}'
        )
        AND j.seniority_level IN (
            SELECT seniority_level FROM users WHERE id = '{user_id}'
            UNION SELECT 'not_specified'
        )
        AND (
            j.city_canonical IN (SELECT city_canonical FROM users WHERE id = '{user_id}')
            OR j.work_mode = 'remote'
        )
        AND j.is_active = TRUE
        AND j.role_family IS NOT NULL
        AND j.company_canonical NOT IN (
            SELECT company_canonical FROM user_company_prefs
            WHERE user_id = '{user_id}' AND pref_type = 'blacklist'
        )
        {delta_clause}
        LIMIT 2000
    """


def _tfidf_filter(
    jobs: list[dict],
    top_skills: list[str],
    top_n: int,
) -> list[dict]:
    """
    Rank jobs by TF-IDF cosine similarity against the user's top skills.
    Returns top_n most relevant jobs.
    """
    if not jobs:
        return []

    user_doc = " ".join(top_skills)
    job_docs = [
        f"{j.get('title', '')} {j.get('jd_summary', '')} {j.get('role_family', '')}"
        for j in jobs
    ]

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    try:
        all_docs = [user_doc] + job_docs
        tfidf_matrix = vectorizer.fit_transform(all_docs)
        user_vec  = tfidf_matrix[0]
        job_vecs  = tfidf_matrix[1:]
        scores = cosine_similarity(user_vec, job_vecs)[0]
        top_indices = np.argsort(scores)[::-1][:top_n]
        return [jobs[i] for i in top_indices]
    except Exception:
        # TF-IDF failed (e.g. all empty docs) — return first top_n raw
        return jobs[:top_n]


async def prefilter(
    user_id: str,
    top_skills: list[str],
    mode: str = "delta",          # "full_scan" | "delta"
) -> list[dict]:
    """
    Run SQL filter then TF-IDF ranking.
    Returns at most 300 jobs (full_scan) or 100 jobs (delta).
    """
    top_n = 300 if mode == "full_scan" else 100
    sql   = _build_skill_query_sql(user_id, mode)

    result = supabase.rpc("sql_query", {"query": sql}).execute()
    jobs = result.data or []

    return _tfidf_filter(jobs, top_skills, top_n)
