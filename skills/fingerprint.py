"""
skills/fingerprint.py
Job deduplication via SHA-256 fingerprint.

Fingerprint = SHA256(title.lower() + company.lower() + location.lower() + jd[:200])
This ensures the same job posted on multiple platforms maps to one DB row.
Fields excluded: salary, apply_url, posted_date (these vary cross-platform).
"""

import hashlib
from typing import Optional

from db.client import supabase


def compute_fingerprint(
    title: str,
    company: str,
    location: str,
    jd_text: str,
) -> str:
    """
    Compute a deterministic SHA-256 fingerprint for a job posting.
    Always lowercase + strip before hashing.
    jd_text is capped at 200 chars to exclude boilerplate that varies by platform.
    """
    raw = (
        title.lower().strip()
        + company.lower().strip()
        + location.lower().strip()
        + jd_text[:200].lower().strip()
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def check_duplicate(fingerprint: str) -> Optional[dict]:
    """
    Check if a job with this fingerprint already exists.
    Returns the existing row dict if found, else None.
    """
    result = (
        supabase.table("jobs")
        .select("id, fingerprint, last_seen_at, is_active")
        .eq("fingerprint", fingerprint)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None
