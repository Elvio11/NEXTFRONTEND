# server2/skills/whatsapp_push.py
# Sends notifications via Server 1's unified /internal/notify endpoint.
# All agents call send_notification() — never call Server 1 directly elsewhere.
#
# The old send_whatsapp() function is preserved for backward compat but internally
# delegates to /internal/wa-send (existing behavior).
#
# PRODUCTION FIX: server1 URL and agent secret are read lazily at call time,
# NOT at module import time, to prevent crashes during test/startup.

import os
import httpx
from log_utils.agent_logger import log_event


def _server1_url() -> str:
    """Read SERVER1_URL at call time — never at import time."""
    url = os.environ.get("SERVER1_URL", "")
    if not url:
        log_event("whatsapp_push", "error", "SERVER1_URL not set — notifications disabled")
    return url


def _agent_secret() -> str:
    """Read AGENT_SECRET at call time — never at import time."""
    return os.environ.get("AGENT_SECRET", "")


async def send_notification(user_id: str, message_type: str, payload: dict) -> bool:
    """
    Send a notification to a user via all their active channels.
    Returns True if at least one channel delivered successfully.
    Never raises — always returns bool.
    """
    server1_url = _server1_url()
    if not server1_url:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{server1_url}/internal/notify",
                json={
                    "user_id": user_id,
                    "message_type": message_type,
                    "payload": payload,
                },
                headers={
                    "X-Agent-Secret": _agent_secret(),
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code == 200:
                return True
            else:
                log_event(
                    "whatsapp_push",
                    "warn",
                    f"notify returned {resp.status_code} for user {user_id}: {resp.text}",
                )
                return False
    except Exception as e:
        log_event(
            "whatsapp_push",
            "error",
            f"Failed to notify user {user_id}: {str(e)}",
        )
        return False


# ── Backward compat: original send_whatsapp() ──────────────────────────────────

async def send_whatsapp(
    user_id: str,
    message: str,
    event_type: str = "coach_message",
) -> bool:
    """
    Legacy function: sends WA message via /internal/wa-send.
    Preserved for any existing callers. New code should use send_notification().
    """
    server1_url = _server1_url()
    if not server1_url:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{server1_url}/internal/wa-send",
                json={
                    "user_id": user_id,
                    "message": message,
                    "event_type": event_type,
                },
                headers={
                    "X-Agent-Secret": _agent_secret(),
                    "Content-Type": "application/json",
                },
            )
            return resp.status_code == 200
    except Exception:
        return False  # WA push failure is non-critical — agent continues


# ── Convenience wrappers (used by agents) ────────────────────────────────────


async def notify_job_alert(user_id: str, job: dict) -> bool:
    return await send_notification(
        user_id,
        "job_alert",
        {
            "job_title": job.get("title"),
            "company": job.get("company"),
            "city": job.get("city"),
            "employment_type": job.get("employment_type"),
            "fit_score": job.get("fit_score"),
            "apply_tier": job.get("apply_tier"),
            "apply_url": job.get("apply_url"),
            "job_id": str(job.get("id")),
        },
    )


async def notify_application_update(
    user_id: str, job_title: str, company: str, status: str
) -> bool:
    return await send_notification(
        user_id,
        "application_update",
        {
            "job_title": job_title,
            "company": company,
            "status": status,
        },
    )


async def notify_session_expiring(
    user_id: str, platform: str, days: int, expires_at: str
) -> bool:
    msg_type = f"session_expiring_{days}d"
    return await send_notification(
        user_id,
        msg_type,
        {
            "platform": platform,
            "expires_at": expires_at,
        },
    )


async def notify_session_expired(user_id: str, platform: str) -> bool:
    return await send_notification(
        user_id, "session_expired", {"platform": platform}
    )


async def notify_apply_paused(user_id: str, reason: str) -> bool:
    return await send_notification(
        user_id, "apply_paused", {"failure_reason": reason}
    )


async def notify_apply_submitted(
    user_id: str,
    job_title: str,
    company: str,
    platform: str,
    monthly_count: int,
) -> bool:
    return await send_notification(
        user_id,
        "apply_submitted",
        {
            "job_title": job_title,
            "company": company,
            "platform": platform,
            "monthly_apply_count": monthly_count,
        },
    )


async def notify_coach_message(user_id: str, message: str) -> bool:
    return await send_notification(
        user_id, "coach", {"message": message}
    )


async def notify_subscription_expiring(user_id: str, expires_at: str) -> bool:
    return await send_notification(
        user_id, "subscription_expiring", {"expires_at": expires_at}
    )
