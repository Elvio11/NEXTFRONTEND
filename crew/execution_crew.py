"""
crew/execution_crew.py
S3 Execution Crew — HTTP proxy / contract reference for Server 3 agents.

IMPORTANT SERVER BOUNDARY:
  Server 2 CANNOT initiate calls to Server 3 directly.
  Only Server 1 calls Servers 2 and 3 (UFW firewall enforced).

This file serves two purposes:
  1. Documents the S3 agent trigger contracts (what payload each expects).
  2. Provides HTTP wrappers for the case where Server 2 needs to fan-out
     through Server 1 → Server 3 (i.e., via /internal/trigger-s3).

In production, pg_cron and Server 1 are the primary S3 triggers.
S2 never calls S3 directly.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

# ─── S3 AGENT CONTRACTS (payload reference) ───────────────────────────────────
#
# These are the exact payload shapes each S3 endpoint expects.
# Documented here as the authoritative contract reference.
#
# POST /api/agents/scrape          → {agent: "job_scraper", user_id: null, payload: {}}
# POST /api/agents/auto-apply      → {agent: "auto_apply", user_id: uuid, payload: {}}
# POST /api/agents/tailor-resume   → {agent: "tailor", user_id: uuid,
#                                      payload: {job_id: uuid, app_id: uuid, fit_score: int}}
# POST /api/agents/cover-letter    → {agent: "cover_letter", user_id: uuid,
#                                      payload: {job_id: uuid, app_id: uuid}}
# POST /api/agents/anti-ban        → {agent: "anti_ban", user_id: uuid,
#                                      payload: {platform: str, action_type: str}}


def _call_s1_internal(endpoint: str, body: dict, timeout: int = 30) -> dict:
    """
    POST to a Server 1 /internal/* endpoint.
    S2 → S1 → S3 is the correct chain for cross-server triggers.
    Never calls S3 directly.
    """
    s1_url       = os.environ.get("SERVER1_URL", "")
    agent_secret = os.environ.get("AGENT_SECRET", "")

    if not s1_url:
        logger.error("[execution_crew] SERVER1_URL not set — cannot trigger S3 agent")
        return {"status": "failed", "error": "SERVER1_URL not configured"}

    try:
        resp = requests.post(
            f"{s1_url}{endpoint}",
            json=body,
            headers={"X-Agent-Secret": agent_secret},
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout:
        return {"status": "failed", "error": f"timeout calling {endpoint}"}
    except requests.HTTPError as exc:
        return {"status": "failed", "error": f"HTTP {exc.response.status_code} from S1: {endpoint}"}
    except Exception as exc:
        return {"status": "failed", "error": str(exc)[:300]}


# ─── TRIGGER HELPERS ──────────────────────────────────────────────────────────

def trigger_auto_apply(user_id: str) -> dict:
    """
    Signal Server 1 to dispatch the auto-apply agent on Server 3.
    Caller: pg_cron fires /orchestrate → Intelligence Crew detects apply_window_open.
    Then S1 handles the actual S3 dispatch scheduling.
    This function is a fallback manual trigger for that chain.
    """
    return _call_s1_internal(
        "/internal/trigger-s3",
        {
            "agent":   "auto_apply",
            "user_id": user_id,
            "payload": {},
        },
    )


def trigger_resume_tailor(user_id: str, job_id: str, app_id: str, fit_score: int) -> dict:
    """Signal S1 → S3 to tailor a resume for a specific application."""
    return _call_s1_internal(
        "/internal/trigger-s3",
        {
            "agent":   "tailor",
            "user_id": user_id,
            "payload": {
                "job_id":    job_id,
                "app_id":    app_id,
                "fit_score": fit_score,
            },
        },
    )


def trigger_cover_letter(user_id: str, job_id: str, app_id: str) -> dict:
    """Signal S1 → S3 to generate a cover letter for a specific application."""
    return _call_s1_internal(
        "/internal/trigger-s3",
        {
            "agent":   "cover_letter",
            "user_id": user_id,
            "payload": {
                "job_id": job_id,
                "app_id": app_id,
            },
        },
    )


def trigger_scrape() -> dict:
    """Signal S1 → S3 to kick off nightly job scraping (pg_cron equivalent)."""
    return _call_s1_internal(
        "/internal/trigger-s3",
        {
            "agent":   "job_scraper",
            "user_id": None,
            "payload": {},
        },
    )
