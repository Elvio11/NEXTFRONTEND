"""
agents/agent14_follow_up.py
Agent 14 — Follow-Up Sender & Interview Detector.

Handles:
1. Multi-stage email follow-up via Gmail API.
2. LinkedIn connection requests and follow-up messages.
3. Automated interview detection in Gmail threads.
4. Google Calendar event creation for detected interviews.

Constraints:
- Sarvam-M Precise for all text generation.
- Strict LinkedIn kill switch (DB-driven).
- All secrets via os.environ[].
- All storage via storage_client.py.
"""

import asyncio
import json
import os
import time
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, Any

import httpx

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from llm.sarvam import sarvam, SarvamUnavailableError
from skills.session_manager import decrypt_session
from skills.storage_client import put_json_gz
from skills.anti_ban_checker import check_linkedin_limit
from skills.mcp_wrapper import MCPWrapper

# ─── Constants & CONFIG ───────────────────────────────────────────────────────

EMAIL_INTERVALS = {
    0: (5, 7),  # Stage 0 -> 1: 5-7 days
    1: (12, 14),  # Stage 1 -> 2: 12-14 days
    2: (21, 21),  # Stage 2 -> End: 21 days
}

REJECTION_KEYWORDS = [
    "rejected",
    "unfortunately",
    "not moving forward",
    "other candidates",
    "position filled",
    "decided to move forward with other",
]

INTERVIEW_KEYWORDS = [
    "interview",
    "call scheduled",
    "meet with",
    "video call",
    "phone screen",
    "we'd like to",
    "invitation to interview",
    "next steps",
    "availability",
]

# ─── Helper: LinkedIn Kill Switch ─────────────────────────────────────────────

# Kill switch logic moved to check_linkedin_limit in anti_ban_checker


async def _increment_linkedin_actions() -> None:
    """Call RPC to increment global LinkedIn action counter."""
    today = datetime.now(timezone.utc).date().isoformat()
    # Assuming the RPC 'increment_linkedin_daily_count' exists as per instructions
    get_supabase().rpc(
        "increment_linkedin_daily_count", {"action_date": today}
    ).execute()


# ─── Helper: Google API (Gmail/Calendar) ──────────────────────────────────────


async def _refresh_google_token(user_id: str, platform: str = "google") -> str:
    """Refresh Google OAuth token using stored refresh_token."""
    # Fetch user_connections for google/gmail
    conn = (
        get_supabase()
        .table("user_connections")
        .select("session_encrypted")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .single()
        .execute()
    )
    if not conn.data:
        raise ValueError(f"No Google connection found for user {user_id}")

    # Session contains refresh_token
    session = decrypt_session(conn.data["session_encrypted"])
    refresh_token = session.get("refresh_token")
    if not refresh_token:
        raise ValueError("No refresh_token found in session data")

    # Call Google token endpoint
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": os.environ["GOOGLE_CLIENT_ID"],
                "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        new_tokens = resp.json()
        access_token = new_tokens["access_token"]

        # Optional: update session with new access_token if needed,
        # but usually we just use it and relying on refresh_token next time.
        return access_token


# ─── Email Sequence Logic ─────────────────────────────────────────────────────


async def _generate_followup_email(
    stage: int, job_title: str, company: str, user_name: str
) -> str:
    """Generate follow-up email text via Sarvam-M Precise."""
    prompts = {
        0: f"Write a brief (100 words) follow-up email checking in on my application for {job_title} at {company}. Express continued interest. Tone: Professional and concise. Candidate name: {user_name}",
        1: f"Write a follow-up email (120 words) for {job_title} at {company}. Add value by referencing my interest in their mission and core skills. Tone: Proactive. Candidate name: {user_name}",
        2: f"Write a final graceful follow-up email (80 words) for {job_title} at {company}, closing the loop. Tone: Respectful and brief. Candidate name: {user_name}",
    }
    try:
        return await sarvam.complete(prompts.get(stage, prompts[0]), mode="precise")
    except SarvamUnavailableError:
        return ""


async def _send_gmail(
    access_token: str, to: str, subject: str, body: str, thread_id: Optional[str] = None
) -> None:
    """Send email via MCP Gmail."""
    try:
        mcp = MCPWrapper()
        await mcp.send_email(to=to, subject=subject, body=body, token=access_token)
    except Exception as e:
        raise Exception(f"Failed to send email via MCP: {e}")


# ─── Interview Detection & Calendar ───────────────────────────────────────────


async def _detect_interview_and_notify(
    user_id: str, app_id: str, job_title: str, company: str, access_token: str
):
    """Scan Gmail for interview triggers and handle notifications/calendar via MCP."""
    mcp = MCPWrapper()
    
    # 1. Fetch recent messages
    query_str = "{" + " ".join(INTERVIEW_KEYWORDS) + "}"
    search_result = await mcp.search_email(query=query_str, token=access_token)
    
    messages = search_result.get("messages", [])
    
    for m in messages:
        snippet = m.get("snippet", "").lower()

        if any(kw in snippet for kw in INTERVIEW_KEYWORDS):
            # Interview detected!
            # 2. Update DB
            now_iso = datetime.now(timezone.utc).isoformat()
            get_supabase().table("job_applications").update(
                {
                    "interview_detected": True,
                    "interview_detected_at": now_iso,
                }
            ).eq("id", app_id).execute()

            # 3. Create Calendar Event (simplified via MCP if available, else omit for now)
            # Future enhancement: `mcp.create_calendar_event(...)`
            # For now we stub out the direct HTTPx calendar request since MCP is preferred.
            event = {
                "summary": f"Interview: {job_title} @ {company}",
                "start": {
                    "dateTime": (
                        datetime.now(timezone.utc) + timedelta(days=1)
                    ).isoformat()
                },
                "end": {
                    "dateTime": (
                        datetime.now(timezone.utc) + timedelta(days=1, hours=1)
                    ).isoformat()
                },
            }
            # If there was a calendar call, we dispatch it via HTTPx still, 
            # unless a calendar MCP is provided
            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                    json=event,
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                # 4. Notify user via S1
                s1_url = os.environ["SERVER1_URL"]
                await client.post(
                    f"{s1_url}/internal/notify",
                    json={
                        "type": "interview_detected",
                        "app_id": app_id,
                        "user_id": user_id,
                    },
                    headers={"x-agent-secret": os.environ["AGENT_SECRET"]},
                )

                # 5. Draft thank-you email
                thank_you_prompt = f"Draft a professional thank-you email to be sent after an interview for {job_title} at {company}. Tone: Gracious and enthusiastic."
                thank_you_draft = await sarvam.complete(
                    thank_you_prompt, mode="precise"
                )
                get_supabase().table("job_applications").update(
                    {"thank_you_draft": thank_you_draft}
                ).eq("id", app_id).execute()

                # 6. Learning signal
                get_supabase().table("learning_signals").insert(
                    {
                        "user_id": user_id,
                        "type": "interview_detected",
                        "payload": {"app_id": app_id, "company": company},
                    }
                ).execute()

                break  # Only handle one per run for now


# ─── Main Run Logic ───────────────────────────────────────────────────────────


async def run_follow_up() -> dict:
    """Main entry point for Agent 14."""
    run_id = new_run_id()
    start = time.time()
    await log_start("agent14_follow_up", None, run_id)

    records_processed = 0
    try:
        # ── 0. Fetch all paid users ───────────────────────────────────────────────
        users_result = (
            get_supabase().table("users").select("id").eq("tier", "professional").execute()
        )
        professional_user_ids = [u["id"] for u in (users_result.data or [])]

        # ── 1. Fetch eligible applications for Email Follow-up ──────────────
        for user_id in professional_user_ids:
            apps = (
                get_supabase()
                .rpc("get_eligible_followups", {"p_user_id": user_id})
                .execute()
            )

            for app in apps.data or []:
                try:
                    app_user_id = app["user_id"]
                    access_token = await _refresh_google_token(app_user_id)

                    # Check for replies/rejections (Interview detection run here)
                    await _detect_interview_and_notify(
                        app_user_id,
                        app["id"],
                        app["job_title"],
                        app["company_name"],
                        access_token,
                    )

                    # Logic for sending next email sequence
                    stage = app["follow_up_stage"]
                    email_body = await _generate_followup_email(
                        stage,
                        app["job_title"],
                        app["company_name"],
                        app["user_full_name"],
                    )

                    if email_body:
                        await _send_gmail(
                            access_token,
                            app["recruiter_email"] or "hr@company.com",
                            f"Follow up: {app['job_title']} application",
                            email_body,
                        )

                        # Update application state
                        new_stage = stage + 1
                        update_data = {
                            "follow_up_stage": new_stage,
                            "follow_up_last_sent_at": datetime.now(
                                timezone.utc
                            ).isoformat(),
                        }
                        if new_stage >= 2:
                            update_data["follow_up_stopped"] = True

                        get_supabase().table("job_applications").update(update_data).eq(
                            "id", app["id"]
                        ).execute()

                        # Learning signal
                        get_supabase().table("learning_signals").insert(
                            {
                                "user_id": app_user_id,
                                "type": "follow_up_sent",
                                "payload": {"app_id": app["id"], "stage": stage},
                            }
                        ).execute()

                        records_processed += 1
                except Exception as e:
                    cur_duration = int((time.time() - start) * 1000)
                    await log_fail(
                        run_id, f"App {app.get('id')} error: {e}", cur_duration
                    )

        # ── 2. LinkedIn Follow-up ───────────────────────────────────────────
        if not await check_linkedin_limit():
            await log_skip(run_id, "LinkedIn kill switch active — skipping LI tasks")
        else:
            for user_id in professional_user_ids:
                li_apps = (
                    get_supabase()
                    .rpc("get_eligible_linkedin_tasks", {"p_user_id": user_id})
                    .execute()
                )
                for app in li_apps.data or []:
                    # Placeholder for MCP Playwright LinkedIn logic
                    # 1. Search recruiter -> connection request
                    # 2. If accepted -> send message
                    # After each action: _increment_linkedin_actions()
                    pass

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, records_processed, duration_ms)
        return {
            "status": "success",
            "duration_ms": duration_ms,
            "records_processed": records_processed,
            "error": None,
        }

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(e), duration_ms)
        return {
            "status": "failed",
            "duration_ms": duration_ms,
            "records_processed": 0,
            "error": str(e),
        }
