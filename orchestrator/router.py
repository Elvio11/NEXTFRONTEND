"""
orchestrator/router.py
POST /orchestrate — the gated entry point for all agent dispatches.

Flow:
  1. Gate 1 (Identity)     → validates X-Agent-Secret + user
  2. Gate 2 (Safety)       → LinkedIn kill switch + Sarvam + window
  3. Gate 3 (Account)      → session, caps, tier, flags
  4. Gate 4 (System Health)→ storage mounted + S3 reachable
  5. Build context object
  6. Hand to CrewAI Orchestrator (S2 intelligence crew)

Never routes to Server 3 directly — S3 is triggered via Server 1 only.
"""

from __future__ import annotations

import os
import time
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from middleware.auth import verify_agent_secret
from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from orchestrator.gates import (
    GateFailure,
    run_all_gates,
    handle_gate_failure,
)
from orchestrator.context_builder import build_context
from crew.intelligence_crew import IntelligenceCrew

logger = logging.getLogger(__name__)
router = APIRouter()


class OrchestrateRequest(BaseModel):
    trigger:  str
    user_id:  Optional[str] = None
    payload:  dict          = {}


@router.post("/orchestrate", dependencies=[Depends(verify_agent_secret)])
async def orchestrate(req: OrchestrateRequest, request: Request):
    """
    POST /orchestrate — gated agent dispatch endpoint.

    X-Agent-Secret is verified by the Depends(verify_agent_secret) above (Gate 1 HTTP level).
    The Python gates below provide the full business logic gating.
    """
    t_start   = time.time()
    run_id    = new_run_id()
    user_id   = req.user_id
    trigger   = req.trigger
    agent_secret = request.headers.get("X-Agent-Secret", "")

    await log_start("orchestrator", user_id, run_id)

    # ── Fetch user row if needed (single DB call for all account gates) ──────
    user = None
    if user_id:
        result = (
            get_supabase()
            .table("users")
            .select(
                "id, onboarding_completed, tier, subscription_tier, "
                "auto_apply_enabled, auto_apply_paused, "
                "daily_apply_count, daily_apply_limit, monthly_apply_count, "
                "fit_scores_stale, dashboard_ready, wa_opted_in, persona, "
                "ai_generated_persona, auto_apply_activated_at"
            )
            .eq("id", user_id)
            .single()
            .execute()
        )
        user = result.data or None

    # ── RUN ALL FOUR GATES ───────────────────────────────────────────────────
    try:
        run_all_gates(
            agent_secret=agent_secret,
            trigger=trigger,
            user_id=user_id,
            user=user,
        )
    except GateFailure as gf:
        duration_ms = int((time.time() - t_start) * 1000)
        await log_skip(run_id, reason=f"gate:{gf.gate} — {gf.message}")
        response = handle_gate_failure(gf, user_id)
        response["duration_ms"] = duration_ms
        return response

    # ── BUILD CONTEXT ────────────────────────────────────────────────────────
    conn         = _fetch_conn(user_id, trigger)
    scrape_run   = _fetch_latest_scrape_run()
    cursor       = _fetch_cursor(user_id) if user_id else None
    apps         = _fetch_app_summaries(user_id) if user_id else None
    daily_limits = _fetch_daily_limits()

    context = build_context(
        trigger=trigger,
        user=user,
        conn=conn,
        scrape_run=scrape_run,
        cursor=cursor,
        apps=apps,
        daily_limits=daily_limits,
    )

    # ── HAND TO CREWAI ───────────────────────────────────────────────────────
    try:
        crew   = IntelligenceCrew(context=context, payload=req.payload)
        result = await crew.run()
    except Exception as exc:
        duration_ms = int((time.time() - t_start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        return {
            "status":            "failed",
            "duration_ms":       duration_ms,
            "records_processed": None,
            "error":             str(exc)[:500],
        }

    duration_ms = int((time.time() - t_start) * 1000)
    await log_end(run_id, records_processed=result.get("records_processed", 0), duration_ms=duration_ms)

    return {
        "status":            result.get("status", "success"),
        "duration_ms":       duration_ms,
        "records_processed": result.get("records_processed"),
        "error":             result.get("error"),
    }


# ─── DB FETCH HELPERS ─────────────────────────────────────────────────────────

def _fetch_conn(user_id: str | None, trigger: str) -> dict | None:
    """Fetch user_connections row for the relevant platform, if needed."""
    if not user_id or trigger not in {"apply_window_open", "linkedin_connect",
                                      "linkedin_message", "linkedin_profile_view"}:
        return None
    platform = "linkedin" if "linkedin" in trigger else "indeed"
    try:
        result = (
            get_supabase()
            .table("user_connections")
            .select("is_valid, consecutive_failures, estimated_expires_at, platform")
            .eq("user_id", user_id)
            .eq("platform", platform)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def _fetch_latest_scrape_run() -> dict | None:
    try:
        result = (
            get_supabase()
            .table("scrape_runs")
            .select("id, total_new, scoring_complete")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception:
        return None


def _fetch_cursor(user_id: str) -> dict | None:
    try:
        result = (
            get_supabase()
            .table("user_fit_score_cursors")
            .select("last_scrape_run_id")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def _fetch_app_summaries(user_id: str) -> dict:
    """
    Lightweight fetch of application state:
    - pending follow-up (day 7/14/21 not yet sent)
    - awaiting manual review (review mode queue)
    - recent unprocessed email replies
    """
    try:
        supabase = get_supabase()

        # Pending follow-up
        fu_result = (
            supabase
            .table("job_applications")
            .select("id, applied_at, fu_email_1_sent_at, fu_email_2_sent_at, fu_close_loop_sent_at")
            .eq("user_id", user_id)
            .eq("fu_stopped", False)
            .not_.in_("status", ["rejected", "withdrawn", "ghosted"])
            .execute()
        )

        # Awaiting review (review mode queue)
        review_result = (
            supabase
            .table("job_applications")
            .select("id, job_id")
            .eq("user_id", user_id)
            .eq("auto_status", "queued")
            .execute()
        )

        return {
            "pending_follow_up": fu_result.data or [],
            "awaiting_review":   review_result.data or [],
            "recent_replies":    [],  # Gmail reply detection in Agent 14 (future phase)
        }
    except Exception:
        return {"pending_follow_up": [], "awaiting_review": [], "recent_replies": []}


def _fetch_daily_limits() -> dict | None:
    try:
        from datetime import date
        result = (
            get_supabase()
            .table("system_daily_limits")
            .select("total_linkedin_actions, apply_paused")
            .eq("date", date.today().isoformat())
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None
