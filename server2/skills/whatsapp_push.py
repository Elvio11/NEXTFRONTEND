"""
skills/whatsapp_push.py
Stub: delegates WA message sending to Server 1 Baileys socket.

Server 2 NEVER calls Baileys directly — Baileys lives on Server 1.
This skill POSTs to Server 1's internal endpoint.
Server 1 then checks wa_opted_in, quiet hours, rate limits before sending.

Rate limit: 1 message per 1500ms — enforced by Server 1, not here.
"""

import os
import httpx


async def send_whatsapp(
    user_id: str,
    message: str,
    event_type: str = "coach_message",
) -> bool:
    """
    POST to Server 1 internal endpoint to send a WhatsApp message.
    Returns True if Server 1 accepted the request, False on error.
    Server 1 handles: opted_in check, quiet hours, rate limiting.
    """
    server1_url = os.environ["SERVER1_URL"]
    agent_secret = os.environ["AGENT_SECRET"]

    payload = {
        "user_id":    user_id,
        "message":    message,
        "event_type": event_type,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{server1_url}/internal/wa-send",
                json=payload,
                headers={
                    "X-Agent-Secret": agent_secret,
                    "Content-Type":   "application/json",
                },
            )
            return resp.status_code == 200
    except Exception:
        return False  # WA push failure is non-critical — agent continues
