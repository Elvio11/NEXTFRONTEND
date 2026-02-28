"""
agents/agent13_anti_ban.py
Agent 13 — Anti-Ban Guard.

Thin wrapper around skills/anti_ban_checker.py.
Accepts HTTP requests from Agent 9 (scraper) and Agent 12 (applier).
Adds structured logging of all risk assessments to agent_logs.
Returns anti_ban_checker result directly.

Called BEFORE every LinkedIn action in Agent 12.
Called BEFORE every LinkedIn scrape attempt in Agent 9.
"""

import time

from log_utils.agent_logger import log_start, log_end, log_fail, new_run_id
from skills.anti_ban_checker import check_risk


async def run_anti_ban(
    user_id: str,
    action_type: str,
    context: dict,
) -> dict:
    """
    Evaluate anti-ban risk for a LinkedIn or Indeed action.

    Args:
        user_id:     User UUID (can be None for global checks like Agent 9 scrape)
        action_type: "scrape" | "apply"
        context:     Additional context dict (platform, etc.)

    Returns:
        {
            "risk_level":    "low" | "medium" | "high" | "critical",
            "proceed":       bool,
            "delay_seconds": int,
            "reason":        str,
        }
    """
    run_id = new_run_id()
    start  = time.time()

    # Use "system" as user_id for global scrape checks with no specific user
    log_user_id = user_id if user_id and user_id != "null" else None

    await log_start("agent13_anti_ban", log_user_id, run_id)

    try:
        result = await check_risk(
            user_id=user_id or "system",
            action_type=action_type,
            context=context,
        )

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, 1, duration_ms)

        return {**result, "duration_ms": duration_ms}

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        # On any exception: block as precaution
        return {
            "risk_level":    "critical",
            "proceed":       False,
            "delay_seconds": 0,
            "reason":        f"anti_ban_error: {str(exc)[:200]}",
            "duration_ms":   duration_ms,
        }
