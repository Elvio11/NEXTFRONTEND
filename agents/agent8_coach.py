"""
agents/agent8_coach.py
Agent 8 — WhatsApp Career Coach

Generates personalised coaching messages for eligible student/professional users.
Triggered: 7 AM IST daily via pg_cron HTTP POST to /api/agents/coach

Eligibility gate per user:
  - tier IN ('student', 'professional')
  - wa_opted_in = TRUE
  - last_active_at > NOW() - 7 days
  - notif_prefs.coach_enabled = TRUE (if key exists)
  - not in quiet hours

Hyper-variant message structure: rotates across 6 structures,
no two consecutive messages share the same opening structure.

LLM: Sarvam-M Think. Non-negotiable.
"""

import json
import time
import os
import httpx
from datetime import datetime, timezone, timedelta

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.whatsapp_push import send_whatsapp
from skills.mcp_wrapper import MCPWrapper
from llm.sarvam import sarvam, SarvamUnavailableError
from skills.humanizer_prompt import HUMANIZER_GUIDELINES


_STRUCTURES = [
    "progress_update",       # how applications are going
    "skill_gap_nudge",       # what to learn this week
    "application_insight",   # pattern in rejections/callbacks
    "market_demand",         # roles growing/shrinking in their city
    "momentum_builder",      # celebrate a callback or milestone
    "challenge_setter",      # specific action item for today
]

_COACH_PROMPT = """You are a WhatsApp career coach for Indian tech job seekers.

Generate a short, punchy coaching message (3-5 sentences, WhatsApp tone, not email).

Candidate profile:
- Persona: {persona}
- Experience: {exp_years} years
- Target roles: {roles}
- Applications last 14 days: {apps} sent, {callbacks} callbacks, {rejections} rejections
- Top skill gap: {top_gap}
- Career score: {career_score}/100
- Message structure: {structure}
- Previous structure (do NOT repeat): {prev_structure}

Real-time Market Insights (India):
{market_trends}

Rules:
- 3-5 sentences maximum
- End with ONE specific action for today
- WhatsApp-friendly, not formal
- Never start with "I hope you're doing well"
- Match tone to their persona exactly
- Weave in the market insight naturally to build urgency/context

Output ONLY the message. No labels. No headers.

{humanizer_guidelines}"""


def _is_in_quiet_hours(notif_prefs: dict) -> bool:
    """Check if current IST time falls in user's quiet hours."""
    from datetime import timedelta
    ist_now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    current_hour = ist_now.hour

    start = notif_prefs.get("quiet_hours_start")
    end   = notif_prefs.get("quiet_hours_end")

    if start is None or end is None:
        return False

    if start <= end:
        return start <= current_hour < end
    else:  # wraps midnight
        return current_hour >= start or current_hour < end


async def run() -> dict:
    """Full Agent 8 execution — loops all eligible users."""
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent8_coach", None, run_id)

    def _ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # ── Eligibility query ─────────────────────────────────────────────
        try:
            result = get_supabase().rpc("get_coach_eligible_users", {}).execute()
            eligible_data = result.data or []
        except Exception:
            # Fallback SQL if RPC not defined or fails
            result = (
                get_supabase().table("users")
                .select("id, persona, experience_years, notif_prefs, wa_phone")
                .in_("tier", ["student", "professional"])
                .eq("wa_opted_in", True)
                .execute()
            )
            eligible_data = result.data or []

        # Enhanced IQ: Check user status via Server 1 to avoid interrupting active sessions
        s1_url = os.environ.get("SERVER1_URL")
        active_user_ids = []
        if s1_url:
            try:
                async with httpx.AsyncClient() as client:
                    status_resp = await client.get(
                        f"{s1_url}/api/user-status",
                        headers={"x-agent-secret": os.environ["AGENT_SECRET"]}
                    )
                    if status_resp.status_code == 200:
                        # get_user_status returns list of users with last_active_at
                        # We consider anyone active in last 10 min "busy"
                        now = datetime.now(timezone.utc)
                        for u_status in status_resp.json():
                            last_active = datetime.fromisoformat(u_status["last_active_at"].replace("Z", "+00:00"))
                            if (now - last_active) < timedelta(minutes=10):
                                active_user_ids.append(u_status["id"])
            except Exception:
                pass # Fallback to sending if status check fails

        eligible = [
            u for u in eligible_data
            if u["id"] not in active_user_ids
            and not _is_in_quiet_hours(u.get("notif_prefs") or {})
            and (u.get("notif_prefs") or {}).get("coach_enabled", True)
        ]

        messages_sent = 0

        # Global fetch for market trends (caching logic / 1 call per run to avoid rate limits)
        try:
            mcp = MCPWrapper()
            trends_result = await mcp.search_web("tech hiring trends software engineer India current month")
            global_market_trends = trends_result.get("text") or trends_result.get("content") or str(trends_result)[:1000]
        except Exception as e:
            global_market_trends = "Tech hiring remains competitive. Focus on upskilling in AI and Cloud areas."

        for user in eligible:
            user_id = user["id"]

            # Load app stats
            apps_result = (
                get_supabase().table("job_applications")
                .select("status")
                .eq("user_id", user_id)
                .execute()
            )
            apps_data = apps_result.data or []
            app_count      = len(apps_data)
            callback_count = sum(1 for a in apps_data if a["status"] == "callback")
            reject_count   = sum(1 for a in apps_data if a["status"] == "rejected")

            # Load skill gap
            gap_result = (
                get_supabase().table("skill_gap_results")
                .select("top_gaps")
                .eq("user_id", user_id)
                .execute()
            )
            top_gaps = (gap_result.data[0] if gap_result.data else {}).get("top_gaps") or []
            top_gap_str = top_gaps[0]["skill"] if top_gaps else "None identified yet"

            # Load career score
            career_result = (
                get_supabase().table("career_intelligence")
                .select("career_score")
                .eq("user_id", user_id)
                .execute()
            )
            career_score = (career_result.data[0] if career_result.data else {}).get("career_score", 0)

            # Load last message structure from notifications
            last_notif = (
                get_supabase().table("notifications")
                .select("metadata")
                .eq("user_id", user_id)
                .eq("event_type", "coach_message")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            prev_structure = "none"
            if last_notif.data:
                prev_structure = (last_notif.data[0].get("metadata") or {}).get(
                    "structure", "none"
                )

            # Pick structure (rotate — avoid repeating last one)
            available = [s for s in _STRUCTURES if s != prev_structure]
            import hashlib
            h = int(hashlib.md5(f"{user_id}{datetime.now(timezone.utc).date()}".encode()).hexdigest(), 16)
            structure = available[h % len(available)]

            # Load target roles
            roles_result = (
                get_supabase().table("user_target_roles")
                .select("role_family")
                .eq("user_id", user_id)
                .execute()
            )
            roles_str = ", ".join(r["role_family"] for r in (roles_result.data or []))

            # Build prompt
            prompt = _COACH_PROMPT.format(
                persona=user.get("persona", "professional"),
                exp_years=user.get("experience_years", 0),
                roles=roles_str or "Not set",
                apps=app_count,
                callbacks=callback_count,
                rejections=reject_count,
                top_gap=top_gap_str,
                career_score=career_score,
                structure=structure,
                prev_structure=prev_structure,
                market_trends=global_market_trends,
                humanizer_guidelines=HUMANIZER_GUIDELINES,
            )

            try:
                message = await sarvam.complete(prompt, mode="think")
            except SarvamUnavailableError:
                await log_skip(run_id, "sarvam_unavailable")
                return {
                    "status":            "skipped",
                    "duration_ms":       _ms(),
                    "records_processed": messages_sent,
                    "error":             "Sarvam-M unavailable",
                }

            # Send via WhatsApp push stub
            sent = await send_whatsapp(user_id, message)
            if sent:
                # 48-hour TTL for low priority coach message
                expires_at = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()

                # Write to notifications table
                get_supabase().table("notifications").insert({
                    "user_id":    user_id,
                    "event_type": "coach_message",
                    "channel":    "whatsapp",
                    "title":      "Daily Coach",
                    "body":       message[:500],
                    "priority":   "low",
                    "status":     "sent",
                    "metadata":   {"structure": structure},
                    "expires_at": expires_at,
                }).execute()
                messages_sent += 1

        await log_end(run_id, messages_sent, _ms())
        return {"status": "success", "duration_ms": _ms(),
                "records_processed": messages_sent, "error": None}

    except Exception as exc:
        await log_fail(run_id, str(exc), _ms())
        return {"status": "failed", "duration_ms": _ms(),
                "records_processed": 0, "error": str(exc)[:500]}
