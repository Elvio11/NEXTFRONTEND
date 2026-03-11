"""
orchestrator/context_builder.py
Builds the unified context object handed to CrewAI Orchestrator.

Python packages the full system state. CrewAI reads it and decides.
Nothing here touches an LLM. Pure data assembly.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone, time as dtime
from typing import Any

from db.client import get_supabase

# ─── WINDOW HELPERS ───────────────────────────────────────────────────────────

_APPLY_START_UTC  = dtime(14, 30)  # 8 PM IST
_APPLY_END_UTC    = dtime(0,  30)  # 6 AM IST
_FU_START_UTC     = dtime(3,  30)  # 9 AM IST (follow-up send window open)
_FU_END_UTC       = dtime(5,  30)  # 11 AM IST (follow-up send window close)


def is_within_apply_window() -> bool:
    """True if current UTC time is within the 8 PM–6 AM IST nightly apply window."""
    now = datetime.now(timezone.utc).time().replace(second=0, microsecond=0)
    return now >= _APPLY_START_UTC or now <= _APPLY_END_UTC


def is_within_followup_window() -> bool:
    """True if current UTC time is within the 9 AM–11 AM IST follow-up send window."""
    now = datetime.now(timezone.utc).time().replace(second=0, microsecond=0)
    return _FU_START_UTC <= now <= _FU_END_UTC


# ─── CONTEXT ASSEMBLY ─────────────────────────────────────────────────────────

def build_context(
    trigger:      str,
    user:         dict | None          = None,
    conn:         dict | None          = None,
    scrape_run:   dict | None          = None,
    cursor:       dict | None          = None,
    apps:         dict | None          = None,
    daily_limits: dict | None          = None,
    sarvam_ok:    bool                 = True,
    s3_ok:        bool                 = True,
) -> dict:
    """
    Assemble the full context object passed to the CrewAI Orchestrator.

    Args:
        trigger:      Triggering event string (e.g. 'resume_uploaded', 'apply_window_open').
        user:         Fetched user row dict, or None for system-scoped triggers.
        conn:         Fetched user_connections row (platform session), or None.
        scrape_run:   Latest scrape_runs row, or None.
        cursor:       user_fit_score_cursors row, or None.
        apps:         Dict of application-state summaries (pending fu, awaiting review, replies).
        daily_limits: system_daily_limits row for today, or None.
        sarvam_ok:    Result of Sarvam health check.
        s3_ok:        Result of S3 reachability check.

    Returns:
        Structured context dict that Orchestrator Agent reads.
    """
    now_utc = datetime.now(timezone.utc).isoformat()

    user_ctx: dict | None = None
    if user:
        # Normalise tier — audit found tier vs subscription_tier inconsistency
        tier = user.get("tier") or user.get("subscription_tier") or "free"
        user_ctx = {
            "id":                   user.get("id"),
            "tier":                 tier,
            "persona":              user.get("persona") or user.get("ai_generated_persona"),
            "fit_scores_stale":     user.get("fit_scores_stale", False),
            "dashboard_ready":      user.get("dashboard_ready", False),
            "daily_apply_count":    user.get("daily_apply_count", 0),
            "daily_apply_limit":    user.get("daily_apply_limit", 10),
            "monthly_apply_count":  user.get("monthly_apply_count", 0),
            "review_mode":          _review_mode_active(user),
            "wa_opted_in":          user.get("wa_opted_in", False),
            "auto_apply_enabled":   user.get("auto_apply_enabled", False),
            "auto_apply_paused":    user.get("auto_apply_paused", False),
            "session_valid":        conn.get("is_valid", False) if conn else False,
            "session_expires":      conn.get("estimated_expires_at") if conn else None,
        }

    job_pool_ctx: dict = {
        "latest_scrape_run_id": (scrape_run or {}).get("id"),
        "total_new_jobs":       (scrape_run or {}).get("total_new", 0),
        "scoring_complete":     (scrape_run or {}).get("scoring_complete", False),
        "user_cursor":          (cursor or {}).get("last_scrape_run_id"),
    }

    apps_ctx: dict = {
        "pending_follow_up":  (apps or {}).get("pending_follow_up", []),
        "awaiting_review":    (apps or {}).get("awaiting_review", []),
        "recent_replies":     (apps or {}).get("recent_replies", []),
    }

    system_ctx: dict = {
        "linkedin_actions_today": (daily_limits or {}).get("total_linkedin_actions", 0),
        "sarvam_healthy":         sarvam_ok,
        "s3_healthy":             s3_ok,
    }

    # recent_signals — pull 7-day summary from learning_signals
    recent_signals = _fetch_recent_signal_summary()

    return {
        "trigger":           trigger,
        "timestamp":         now_utc,
        "apply_window_open": is_within_apply_window(),
        "followup_window":   is_within_followup_window(),
        "user":              user_ctx,
        "job_pool":          job_pool_ctx,
        "applications":      apps_ctx,
        "system":            system_ctx,
        "recent_signals":    recent_signals,
    }


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _review_mode_active(user: dict) -> bool:
    """
    Review mode is active for 14 days after auto_apply_activated_at.
    After 14 days, applies submit automatically.
    """
    activated_at = user.get("auto_apply_activated_at")
    if not activated_at:
        return False
    from datetime import timedelta
    try:
        if isinstance(activated_at, str):
            from dateutil.parser import parse as parse_dt
            activated_at = parse_dt(activated_at)
        if activated_at.tzinfo is None:
            activated_at = activated_at.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - activated_at) < timedelta(days=14)
    except Exception:
        return False


def _fetch_recent_signal_summary() -> dict:
    """
    Pull a 7-day signal summary from learning_signals.
    Returns lightweight aggregates — callback_rate, top_platform, li_acceptance.
    Falls back to empty dict on any error (signals are advisory, not critical).
    """
    try:
        result = (
            get_supabase()
            .table("learning_signals")
            .select("signal_type, context")
            .gte("created_at", _seven_days_ago_iso())
            .execute()
        )
        signals = result.data or []
        if not signals:
            return {}

        applied   = [s for s in signals if s["signal_type"] == "application_submitted"]
        callbacks = [s for s in signals if s["signal_type"] == "callback_received"]
        li_acc    = [s for s in signals if s["signal_type"] == "li_connection_accepted"]
        li_dec    = [s for s in signals if s["signal_type"] == "li_connection_declined"]

        # Callback rate
        cb_rate = round(len(callbacks) / len(applied), 3) if applied else 0.0

        # Top performing platform by callbacks
        cb_platforms: dict[str, int] = {}
        for s in callbacks:
            p = (s.get("context") or {}).get("platform", "unknown")
            cb_platforms[p] = cb_platforms.get(p, 0) + 1
        top_platform = max(cb_platforms, key=cb_platforms.get) if cb_platforms else None

        # LinkedIn acceptance rate
        total_li = len(li_acc) + len(li_dec)
        li_acc_rate = round(len(li_acc) / total_li, 3) if total_li else 0.0

        return {
            "callback_rate":              cb_rate,
            "top_performing_platform":    top_platform,
            "acceptance_rate_linkedin":   li_acc_rate,
        }
    except Exception:
        return {}


def _seven_days_ago_iso() -> str:
    from datetime import timedelta
    return (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
