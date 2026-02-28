"""
skills/anti_ban_checker.py
Risk scoring engine for LinkedIn and Indeed actions.

Evaluates current LinkedIn action volume, session age, and apply velocity
to determine whether to proceed with an action.

CRITICAL RULE: If total_linkedin_actions >= 1500, ALWAYS return critical/False
WITHOUT calling Sarvam-M. The kill switch is deterministic — not LLM-evaluated.

Risk thresholds:
  low      → < 200 LinkedIn actions today
  medium   → 200–800 actions
  high     → 800–1200 actions
  critical → >= 1200 (block), kill switch >= 1500 (hard block)
"""

import asyncio
import json
from datetime import date, datetime, timezone
from typing import Any

from db.client import supabase
from llm.sarvam import sarvam, SarvamUnavailableError


# ─── Kill Switch ───────────────────────────────────────────────────────────────

def _get_linkedin_actions_today() -> int:
    """Query system_daily_limits for today's total LinkedIn action count."""
    result = (
        supabase.table("system_daily_limits")
        .select("total_linkedin_actions")
        .eq("date", date.today().isoformat())
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0].get("total_linkedin_actions", 0)
    return 0


def _get_user_applies_last_24h(user_id: str) -> int:
    """Count applications submitted by this user in the last 24 hours."""
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = (
        supabase.table("job_applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("applied_at", cutoff)
        .execute()
    )
    return result.count or 0


def _get_session_age_days(user_id: str, platform: str) -> int:
    """Return the age in days of the user's session for the given platform."""
    result = (
        supabase.table("user_connections")
        .select("created_at")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .limit(1)
        .execute()
    )
    if result.data:
        created_at_str = result.data[0]["created_at"]
        created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - created_at).days
    return 0


# ─── Main Check ────────────────────────────────────────────────────────────────

async def check_risk(
    user_id: str,
    action_type: str,  # "scrape" | "apply"
    context: dict[str, Any] | None = None,
) -> dict:
    """
    Evaluate risk for a LinkedIn or Indeed action.

    Returns:
        {
            "risk_level":    "low" | "medium" | "high" | "critical",
            "proceed":       bool,
            "delay_seconds": int,
            "reason":        str,
        }

    CRITICAL: If LinkedIn actions >= 1500, returns critical immediately
              without calling Sarvam-M.
    """
    context = context or {}
    platform = context.get("platform", "linkedin")

    # ── Hard kill switch check — no LLM needed ──────────────────────────────
    linkedin_actions_today = _get_linkedin_actions_today()
    if linkedin_actions_today >= 1500:
        return {
            "risk_level":    "critical",
            "proceed":       False,
            "delay_seconds": 0,
            "reason":        f"LinkedIn global kill switch: {linkedin_actions_today}/1500 actions today",
        }

    # ── Gather context for Sarvam-M risk evaluation ─────────────────────────
    applies_24h    = _get_user_applies_last_24h(user_id)
    session_age    = _get_session_age_days(user_id, platform)

    # Determine threshold-based risk level first (deterministic)
    if linkedin_actions_today >= 1200:
        risk_level    = "critical"
        proceed       = False
        delay_seconds = 0
        reason        = f"LinkedIn actions at {linkedin_actions_today}/1500 — critical threshold"
        return {
            "risk_level":    risk_level,
            "proceed":       proceed,
            "delay_seconds": delay_seconds,
            "reason":        reason,
        }

    if linkedin_actions_today >= 800:
        base_risk = "high"
    elif linkedin_actions_today >= 200:
        base_risk = "medium"
    else:
        base_risk = "low"

    # ── Use Sarvam-M No-Think to get nuanced assessment ──────────────────────
    prompt = f"""You are a LinkedIn anti-ban risk evaluator for a job application platform.
Evaluate the current risk level and decide whether to proceed.

Context:
- Action type: {action_type}
- Platform: {platform}
- LinkedIn actions today (server-wide): {linkedin_actions_today}/1500
- User's applications in last 24h: {applies_24h}
- Session age (days): {session_age}
- Base risk from action count: {base_risk}
- Additional context: {json.dumps(context)}

Risk levels: low < 200 actions, medium 200-800, high 800-1200, critical >= 1200.
A session older than 10 days adds significant risk.
More than 8 user applies in 24h adds medium risk.

Respond ONLY with valid JSON (no markdown):
{{"risk_level": "low|medium|high|critical", "proceed": true|false, "delay_seconds": 0-120, "reason": "brief explanation"}}

Rules:
- low/medium: proceed=true, delay_seconds=0-30
- high: proceed=true only if session is fresh (< 7 days), delay_seconds=30-90
- critical: proceed=false always, delay_seconds=0"""

    try:
        raw_response = await sarvam.complete(prompt, mode="no_think")
        # Parse JSON from Sarvam response
        parsed = json.loads(raw_response.strip())
        # Enforce: critical always means proceed=False
        if parsed.get("risk_level") == "critical":
            parsed["proceed"] = False
        return {
            "risk_level":    parsed.get("risk_level", base_risk),
            "proceed":       bool(parsed.get("proceed", base_risk == "low")),
            "delay_seconds": int(parsed.get("delay_seconds", 0)),
            "reason":        str(parsed.get("reason", "Sarvam risk assessment"))[:500],
        }
    except (SarvamUnavailableError, json.JSONDecodeError, KeyError, ValueError) as exc:
        # Sarvam unavailable or bad JSON — fall back to deterministic thresholds
        proceed       = base_risk in ("low", "medium")
        delay_seconds = 0 if base_risk == "low" else (30 if base_risk == "medium" else 90)
        return {
            "risk_level":    base_risk,
            "proceed":       proceed,
            "delay_seconds": delay_seconds,
            "reason":        f"Deterministic fallback (Sarvam error: {str(exc)[:100]})",
        }
