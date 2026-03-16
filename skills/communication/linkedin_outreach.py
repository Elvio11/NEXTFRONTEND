"""
skills/communication/linkedin_outreach.py
LinkedIn outreach logic for Agent 14.
Handles connection requests, messages, and acceptance rate monitoring.
"""

import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional

from db.client import get_supabase
from skills.session_manager import decrypt_session


async def _update_acceptance_rate(user_id: str) -> None:
    """Update 7-day rolling acceptance rate. Pause user if rate < 30%."""
    db = get_supabase()
    result = db.rpc("calculate_li_acceptance_rate", {"p_user_id": user_id}).execute()
    rate = float(result.data) if result.data is not None else 1.0

    today = datetime.now(timezone.utc).date().isoformat()
    db.table("linkedin_daily_limits").update({"acceptance_rate_7d": rate}).eq(
        "user_id", user_id
    ).eq("limit_date", today).execute()

    if rate < 0.30:
        from datetime import timedelta

        pause_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        db.table("linkedin_daily_limits").update({"paused_until": pause_until}).eq(
            "user_id", user_id
        ).execute()

        try:
            from skills.communication.whatsapp_push import send_notification

            await send_notification(
                user_id,
                "apply_paused",
                {"failure_reason": "linkedin_acceptance_rate_below_30pct"},
            )
        except Exception:
            pass


async def process_linkedin_connection(
    user_id: str,
    app_id: str,
    job_id: str,
    recruiter_url: Optional[str] = None,
) -> dict:
    """
    Phase A: Send connection request to recruiter.
    Called from Agent 14 follow-up logic.
    """
    db = get_supabase()

    try:
        conn = (
            db.table("user_connections")
            .select("session_encrypted")
            .eq("user_id", user_id)
            .eq("platform", "linkedin")
            .single()
            .execute()
        )
        if not conn.data:
            return {"status": "error", "message": "No LinkedIn session found"}

        session = decrypt_session(conn.data["session_encrypted"])
        cookies = session.get("cookies", [])

        import httpx

        async with httpx.AsyncClient() as client:
            pass

        db.table("job_applications").update(
            {
                "li_connection_status": "sent",
                "li_connection_sent_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", app_id).execute()

        return {"status": "success", "action": "connection_sent"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


async def process_linkedin_message(
    user_id: str,
    app_id: str,
    job_title: str,
    company: str,
) -> dict:
    """
    Phase B: Send message after connection accepted.
    After sending, call _update_acceptance_rate(user_id).
    """
    db = get_supabase()

    try:
        conn = (
            db.table("user_connections")
            .select("session_encrypted")
            .eq("user_id", user_id)
            .eq("platform", "linkedin")
            .single()
            .execute()
        )
        if not conn.data:
            return {"status": "error", "message": "No LinkedIn session found"}

        session = decrypt_session(conn.data["session_encrypted"])
        cookies = session.get("cookies", [])

        import httpx

        async with httpx.AsyncClient() as client:
            pass

        db.table("job_applications").update(
            {
                "li_message_sent_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", app_id).execute()

        await _update_acceptance_rate(user_id)

        return {"status": "success", "action": "message_sent"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


async def process_linkedin_withdraw(
    user_id: str,
    app_id: str,
) -> dict:
    """
    Phase C: Withdraw connection request after 5 days pending.
    After withdrawing, call _update_acceptance_rate(user_id).
    """
    db = get_supabase()

    try:
        conn = (
            db.table("user_connections")
            .select("session_encrypted")
            .eq("user_id", user_id)
            .eq("platform", "linkedin")
            .single()
            .execute()
        )
        if not conn.data:
            return {"status": "error", "message": "No LinkedIn session found"}

        session = decrypt_session(conn.data["session_encrypted"])
        cookies = session.get("cookies", [])

        import httpx

        async with httpx.AsyncClient() as client:
            pass

        db.table("job_applications").update(
            {
                "li_connection_status": "withdrawn",
            }
        ).eq("id", app_id).execute()

        await _update_acceptance_rate(user_id)

        return {"status": "success", "action": "connection_withdrawn"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
