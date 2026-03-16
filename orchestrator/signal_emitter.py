"""
orchestrator/signal_emitter.py
Learning signal writer — Layer 1 of the Feedback Calibrator.

Called inline after every meaningful system event.
Zero batching. Zero latency. Write before returning from the action.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from db.client import get_supabase

logger = logging.getLogger(__name__)

# Required context fields per spec (all optional in the write; best-effort)
_CONTEXT_FIELDS = [
    "platform",
    "fit_score",
    "seniority",
    "work_mode",
    "user_persona",
    "role_family",
    "exp_years",
    "used_tailored",
    "followup_count",
    "days_since_apply",
]

# All valid signal types — from Agent 15 Layer 1 spec
SIGNAL_TYPES = {
    "application_submitted",
    "callback_received",
    "rejection_received",
    "ghosted",
    "low_score_callback",
    "fit_score_overridden",
    "fit_score_validated",
    "tailored_resume_callback",
    "generic_resume_callback",
    "followup_email_sent",
    "followup_email_replied",
    "li_connection_accepted",
    "li_connection_declined",
    "apply_failed_captcha",
    "apply_failed_session",
}


def emit_signal(
    signal_type: str,
    user_id:     str,
    context:     dict,
) -> None:
    """
    Write a learning signal to the learning_signals table.
    TTL = 7 days (hot window). Aggregated Sunday midnight by Agent 15 Layer 2.

    Args:
        signal_type: One of the SIGNAL_TYPES constants.
        user_id:     UUID of the user this signal belongs to.
        context:     Dict with platform, fit_score, seniority, etc.
                     Missing fields are ignored — partial context is always acceptable.

    Never raises. Failures are logged and swallowed — signals are advisory.
    """
    if signal_type not in SIGNAL_TYPES:
        logger.warning("[signal_emitter] Unknown signal_type=%s — skipping", signal_type)
        return

    try:
        # Build the context JSONB — only include recognised fields
        ctx = {k: context.get(k) for k in _CONTEXT_FIELDS if context.get(k) is not None}

        now_utc = datetime.now(timezone.utc)
        expires_at = _add_days(now_utc, 7).isoformat()

        get_supabase().table("learning_signals").insert({
            "signal_type": signal_type,
            "user_id":     user_id,
            "context":     ctx,
            "created_at":  now_utc.isoformat(),
            "expires_at":  expires_at,
        }).execute()

        logger.debug(
            "[signal_emitter] emitted signal_type=%s user_id=%s",
            signal_type, user_id,
        )

    except Exception as exc:
        # Never block the caller — signals are best-effort
        logger.error(
            "[signal_emitter] Failed to emit signal_type=%s user_id=%s: %s",
            signal_type, user_id, exc,
        )


def _add_days(dt: datetime, days: int) -> datetime:
    from datetime import timedelta
    return dt + timedelta(days=days)
