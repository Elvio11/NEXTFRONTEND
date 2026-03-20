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


async def _classify_reply(text: str) -> str:
    """Use Sarvam-M to classify a recruiter's reply."""
    prompt = f"""
    Analyze the following email reply from a recruiter and classify it into exactly one of these categories:
    - INTERVIEW: If they are asking for availability, inviting to a call, or scheduling an interview.
    - REJECTION: If they are saying they are not moving forward or the position is filled.
    - NEUTRAL: If they are asking a follow-up question or providing an update without an invite yet.
    - IGNORE: If it's an automated out-of-office or irrelevant message.

    Reply text:
    "{text}"

    Classification:"""
    try:
        res = await sarvam.complete(prompt, mode="think") # Use think for better accuracy
        res = res.strip().upper()
        for cat in ["INTERVIEW", "REJECTION", "NEUTRAL"]:
            if cat in res:
                return cat
        return "IGNORE"
    except Exception:
        return "IGNORE"


async def _extract_event_details(thread_text: str) -> dict:
    """Extract proposed interview date/time from the email thread using Sarvam-M."""
    prompt = f"""
    Extract the proposed interview date and time from the following email thread.
    If multiple times are mentioned, pick the first one.
    If no specific time is mentioned but it is an interview request, default to tomorrow at 10 AM.
    Current time: {datetime.now(timezone.utc).isoformat()}

    THREAD:
    {thread_text}

    Return ONLY a JSON object: {{"start_time": "ISO_FORMAT", "end_time": "ISO_FORMAT", "summary": "Short title"}}
    """
    try:
        raw = await sarvam.complete(prompt, mode="precise")
        # Extract JSON from potential markdown/text
        if "{" in raw:
            return json.loads(raw[raw.find("{"):raw.rfind("}")+1])
        return {}
    except Exception:
        # Fallback to tomorrow 10am
        start = (datetime.now(timezone.utc) + timedelta(days=1, hours=10)).isoformat()
        end = (datetime.now(timezone.utc) + timedelta(days=1, hours=11)).isoformat()
        return {"start_time": start, "end_time": end, "summary": "Interview"}


async def _detect_interview_and_notify(
    user_id: str, app_id: str, job_title: str, company: str, access_token: str, thread_id: Optional[str]
):
    """Scan the specific Gmail thread for replies and handle logic via LLM classification & MCP."""
    if not thread_id:
        return

    mcp = MCPWrapper()
    try:
        thread = await mcp.get_email_thread(thread_id=thread_id, token=access_token)
        messages = thread.get("messages", [])
        if len(messages) <= 1:
            return  # Only the original message exists

        # Analyze the latest message from the recruiter
        latest_message = messages[-1]
        snippet = latest_message.get("snippet", "")
        
        classification = await _classify_reply(snippet)

        if classification == "INTERVIEW":
            # 1. Update DB
            now_iso = datetime.now(timezone.utc).isoformat()
            get_supabase().table("job_applications").update({
                "interview_detected": True,
                "interview_detected_at": now_iso,
                "follow_up_stopped": True
            }).eq("id", app_id).execute()

            # 2. Extract specific time and Create Calendar Event via MCP
            event_details = await _extract_event_details(str(messages))
            
            await mcp.create_calendar_event(
                summary=event_details.get("summary", f"Interview: {job_title} @ {company}"),
                start_time=event_details.get("start_time"),
                end_time=event_details.get("end_time"),
                token=access_token,
                description=f"Automated booking for {job_title}. Classified from email thread {thread_id}."
            )

            # 3. Notify user via S1
            s1_url = os.environ["SERVER1_URL"]
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{s1_url}/internal/notify",
                    json={
                        "type": "interview_detected",
                        "app_id": app_id,
                        "user_id": user_id,
                        "details": f"New interview for {job_title} at {company}!"
                    },
                    headers={"x-agent-secret": os.environ["AGENT_SECRET"]},
                )

        elif classification == "REJECTION":
            get_supabase().table("job_applications").update({
                "status": "rejected",
                "follow_up_stopped": True
            }).eq("id", app_id).execute()

        elif classification == "NEUTRAL":
            # Just notify, don't stop follow-up unless user intervenes? 
            # Actually, if they replied, we should probably stop the automated sequence to avoid尷尬
            get_supabase().table("job_applications").update({
                "follow_up_stopped": True
            }).eq("id", app_id).execute()

    except Exception as e:
        print(f"Error in thread analysis for {app_id}: {e}")


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
                        app.get("follow_up_thread_id")
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
                    try:
                        app_user_id = app["user_id"]
                        recruiter_url = app.get("recruiter_linkedin_url")
                        
                        if not recruiter_url:
                            continue
                            
                        # Refresh LinkedIn Session via decrypting from DB
                        conn = get_supabase().table("user_connections").select("session_encrypted").eq("user_id", app_user_id).eq("platform", "linkedin").single().execute()
                        if not conn.data:
                            continue
                            
                        session = decrypt_session(conn.data["session_encrypted"])
                        cookies = session.get("cookies", [])
                        
                        mcp = MCPWrapper()
                        
                        # Stage logic: 
                        # If stage == 0 -> Send Connection Request
                        # If stage > 0 -> Send Follow-up Message
                        stage = app.get("follow_up_stage", 0)
                        
                        if stage == 0:
                            # 1. Connection Request
                            msg = await sarvam.complete(f"Write a very brief (under 300 chars) LinkedIn connection request note to recruiter {app.get('recruiter_name', 'Recruiter')} regarding the {app.get('job_title')} role at {app.get('company_name')}. Be extremely professional and brief.", mode="precise")
                            
                            playwright_args = {
                                "action": "connect",
                                "note": msg[:299] # LinkedIn hard limit
                            }
                            
                            res = await mcp.browse_page(
                                task=f"Go to {recruiter_url} and send a connection request with note: {playwright_args['note']}",
                                url=recruiter_url,
                                cookies=cookies
                            )
                            
                        else:
                            # 2. Follow-up Message (assumes connected)
                            msg = await sarvam.complete(f"Write a brief LinkedIn follow-up message to {app.get('recruiter_name', 'Recruiter')} checking in on the {app.get('job_title')} application at {app.get('company_name')}. Professional but conversational.", mode="precise")
                            
                            res = await mcp.browse_page(
                                task=f"Go to {recruiter_url}, click Message, and send: {msg}",
                                url=recruiter_url,
                                cookies=cookies
                            )
                        
                        # Check success and log action
                        if res.get("status") != "error":
                            await _increment_linkedin_actions()
                            
                            new_stage = stage + 1
                            update_data = {
                                "follow_up_stage": new_stage,
                                "follow_up_last_sent_at": datetime.now(timezone.utc).isoformat(),
                            }
                            if new_stage >= 2:
                                update_data["follow_up_stopped"] = True
                                
                            get_supabase().table("job_applications").update(update_data).eq("id", app["id"]).execute()
                            records_processed += 1
                            
                    except Exception as e:
                        await log_fail(run_id, f"LinkedIn App {app.get('id')} error: {e}", int((time.time() - start) * 1000))
                        
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
