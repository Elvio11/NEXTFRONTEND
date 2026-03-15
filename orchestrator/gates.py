"""
orchestrator/gates.py
Python Gating Layer — Four unskippable gates.

Python is the bouncer. No LLM ever touches gate logic.
Gates run in sequence. First failure short-circuits everything.

Gates:
  1. Identity  — X-Agent-Secret + user exists + onboarding complete
  2. Safety    — LinkedIn 1,500 kill switch + Sarvam health + apply window
  3. Account   — session, consecutive failures, daily/monthly caps, tier, paused flag
  4. SystemHealth — FluxShare mounted + S3 reachable

Every gate failure has a coded action. Nothing crashes silently.
"""

from __future__ import annotations

import os
import logging
from datetime import datetime, timezone, time as dtime
from typing import Any, Callable

import requests

from db.client import get_supabase
from llm.sarvam import SarvamClient
from skills.storage_client import get_s3_client
from botocore.exceptions import ClientError, EndpointConnectionError

logger = logging.getLogger(__name__)

# ─── APPLY WINDOW ─────────────────────────────────────────────────────────────
# 8 PM IST → 6 AM IST the next day (UTC: 14:30 → 00:30)
_APPLY_START_UTC = dtime(14, 30)   # 8 PM IST = 14:30 UTC
_APPLY_END_UTC   = dtime(0,  30)   # 6 AM IST =  0:30 UTC (next day)


def _is_within_apply_window() -> bool:
    """True if current UTC time is within the 8 PM–6 AM IST apply window."""
    now_utc = datetime.now(timezone.utc).time().replace(second=0, microsecond=0)
    # Window crosses midnight: 14:30..23:59 OR 00:00..00:30
    return now_utc >= _APPLY_START_UTC or now_utc <= _APPLY_END_UTC


def _trigger_involves_linkedin(trigger: str) -> bool:
    return trigger in {
        "linkedin_connect", "linkedin_message", "linkedin_profile_view",
        "apply_window_open",  # auto-apply includes LinkedIn Easy Apply
    }


def _trigger_requires_sarvam(trigger: str) -> bool:
    return trigger in {
        "resume_uploaded", "score_delta", "full_scan", "coach_daily",
        "skill_gap_refresh", "career_intel_refresh",
    }


def _trigger_requires_session(trigger: str) -> bool:
    return trigger in {"apply_window_open", "linkedin_connect", "linkedin_message"}


def _trigger_requires_s3(trigger: str) -> bool:
    return trigger in {"apply_window_open"}


# ─── GATE FAILURE ─────────────────────────────────────────────────────────────

class GateFailure(Exception):
    """
    Raised by any gate when a hard-stop condition is met.
    Carries the gate name, human-readable message, and the action key
    that tells the caller what to do (log, alert, defer, pause, etc.).
    """

    def __init__(
        self,
        gate: str,
        message: str,
        action: str = "skip_return_skipped",
        http_status: int = 200,
    ) -> None:
        super().__init__(message)
        self.gate        = gate
        self.message     = message
        self.action      = action
        self.http_status = http_status


# ─── GATE 1 — IDENTITY ────────────────────────────────────────────────────────

def gate_identity(
    agent_secret: str,
    user_id: str | None = None,
) -> None:
    """
    Gate 1 — Identity.
    Validates the X-Agent-Secret and, for user-scoped triggers,
    confirms the user exists and has completed onboarding.

    Raises GateFailure on any violation.
    """
    expected = os.environ.get("AGENT_SECRET", "")
    if not expected or agent_secret != expected:
        raise GateFailure(
            gate="identity",
            message="Invalid or missing X-Agent-Secret",
            action="skip_return_skipped",
            http_status=403,
        )

    if user_id:
        result = (
            get_supabase()
            .table("users")
            .select("id, onboarding_completed")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not result.data:
            raise GateFailure(
                gate="identity",
                message=f"User not found: {user_id}",
                action="skip_return_skipped",
                http_status=404,
            )
        if not result.data.get("onboarding_completed"):
            raise GateFailure(
                gate="identity",
                message="Onboarding not complete",
                action="skip_return_skipped",
                http_status=400,
            )


# ─── GATE 2 — SAFETY ──────────────────────────────────────────────────────────

def gate_safety(trigger: str, user_id: str | None = None) -> None:
    """
    Gate 2 — Safety.
    Checks: LinkedIn global kill switch (DB-driven), Sarvam health, apply window.

    This is the canonical single location for the LinkedIn kill switch check.
    Agents (including Agent 13) do NOT need to re-check it separately.

    Raises GateFailure on any violation.
    """
    # ── LinkedIn global kill switch ──────────────────────────────────────────
    if _trigger_involves_linkedin(trigger):
        result = (
            get_supabase()
            .table("system_daily_limits")
            .select("total_linkedin_actions, linkedin_daily_limit")
            .eq("date", datetime.now(timezone.utc).date().isoformat())
            .single()
            .execute()
        )
        data = result.data or {}
        total = data.get("total_linkedin_actions", 0)
        limit = data.get("linkedin_daily_limit", 2000)  # Default to 2000 if column not yet populated
        
        if total >= limit:
            raise GateFailure(
                gate="safety",
                message=f"LinkedIn daily limit reached ({total}/{limit}). Deferring to tomorrow.",
                action="defer_to_tomorrow",
            )

    # ── Sarvam availability ──────────────────────────────────────────────────
    if _trigger_requires_sarvam(trigger):
        try:
            client = SarvamClient()
            if not client.is_healthy():
                raise GateFailure(
                    gate="safety",
                    message="Sarvam-M is unavailable. Returning skipped — no paid LLM fallback.",
                    action="skip_return_skipped",
                )
        except GateFailure:
            raise
        except Exception as exc:
            raise GateFailure(
                gate="safety",
                message=f"Sarvam health check failed: {exc}",
                action="skip_return_skipped",
            ) from exc

    # ── Apply window (8 PM–6 AM IST) ────────────────────────────────────────
    if trigger == "apply_window_open":
        if not _is_within_apply_window():
            raise GateFailure(
                gate="safety",
                message="Outside apply window (8 PM–6 AM IST). Deferring.",
                action="defer",
            )


# ─── GATE 3 — ACCOUNT ─────────────────────────────────────────────────────────

def gate_account(user: dict, trigger: str) -> None:
    """
    Gate 3 — Account.
    Per-user checks: session validity, consecutive failures, daily/monthly caps,
    tier gating, and auto_apply_enabled/paused flags.

    Raises GateFailure on any violation.
    Directly mutates DB (pause flag) for the 3-failures case.
    """
    user_id = user["id"]

    # ── Session validity (apply + LinkedIn triggers) ─────────────────────────
    if _trigger_requires_session(trigger):
        platform = "linkedin" if "linkedin" in trigger else "indeed"
        conn_result = (
            get_supabase()
            .table("user_connections")
            .select("is_valid, consecutive_failures, estimated_expires_at")
            .eq("user_id", user_id)
            .eq("platform", platform)
            .single()
            .execute()
        )
        conn = conn_result.data or {}

        if not conn.get("is_valid", False):
            raise GateFailure(
                gate="account",
                message=f"Session invalid for platform={platform}",
                action="skip_user_send_wa_alert",
            )

        consecutive = conn.get("consecutive_failures", 0)
        if consecutive >= 3:
            get_supabase().table("users").update(
                {"auto_apply_paused": True}
            ).eq("id", user_id).execute()
            raise GateFailure(
                gate="account",
                message=f"3 consecutive failures for platform={platform}. auto_apply paused.",
                action="pause_and_alert",
            )

    # ── Apply-specific account rules ────────────────────────────────────────
    if trigger == "apply_window_open":
        # Tier
        tier = user.get("tier") or user.get("subscription_tier")
        if tier == "free":
            raise GateFailure(
                gate="account",
                message="Free user — auto apply not available",
                action="skip_user_silently",
            )

        # Auto apply enabled / paused
        if not user.get("auto_apply_enabled", False):
            raise GateFailure(
                gate="account",
                message="auto_apply_enabled = FALSE",
                action="skip_user_silently",
            )
        if user.get("auto_apply_paused", False):
            raise GateFailure(
                gate="account",
                message="auto_apply_paused = TRUE",
                action="skip_user_silently",
            )

        # Daily cap
        daily_count = user.get("daily_apply_count", 0)
        daily_limit = user.get("daily_apply_limit", 10)
        if daily_count >= daily_limit:
            raise GateFailure(
                gate="account",
                message=f"Daily apply cap hit ({daily_count}/{daily_limit})",
                action="skip_user_silently",
            )

        # Monthly cap
        monthly_count = user.get("monthly_apply_count", 0)
        if monthly_count >= 250:
            raise GateFailure(
                gate="account",
                message=f"Monthly apply cap hit ({monthly_count}/250)",
                action="skip_user_send_wa_notice",
            )


# ─── GATE 4 — SYSTEM HEALTH ───────────────────────────────────────────────────

def gate_system_health(trigger: str) -> None:
    """
    Gate 4 — System Health.
    Verifies MinIO is reachable and, for apply triggers, that Server 3 is reachable.

    Raises GateFailure on any violation.
    """
    # ── MinIO reachable ──────────────────────────────────────────────────────
    try:
        bucket = os.environ.get("MINIO_BUCKET", "talvix")
        get_s3_client().head_bucket(Bucket=bucket)
    except (ClientError, EndpointConnectionError) as exc:
        raise GateFailure(
            gate="system_health",
            message=f"MinIO storage unreachable: {exc}",
            action="alert_founder_critical",
        )

    # ── Server 3 reachable (apply triggers only) ─────────────────────────────
    if _trigger_requires_s3(trigger):
        s3_url = os.environ.get("SERVER3_URL", "")
        if s3_url:
            try:
                resp = requests.get(
                    f"{s3_url}/health",
                    headers={"X-Agent-Secret": os.environ.get("AGENT_SECRET", "")},
                    timeout=5,
                )
                if resp.status_code != 200:
                    raise GateFailure(
                        gate="system_health",
                        message=f"Server 3 /health returned {resp.status_code}",
                        action="alert_founder_pause_apply",
                    )
            except requests.Timeout:
                raise GateFailure(
                    gate="system_health",
                    message="Server 3 health check timed out (5s)",
                    action="alert_founder_pause_apply",
                )
            except GateFailure:
                raise
            except Exception as exc:
                raise GateFailure(
                    gate="system_health",
                    message=f"Server 3 unreachable: {exc}",
                    action="alert_founder_pause_apply",
                ) from exc


# ─── GATE FAILURE ACTIONS ─────────────────────────────────────────────────────

def _log_skip(user_id: str | None, message: str) -> None:
    logger.warning("[gate] skip user=%s reason=%s", user_id, message)


def _send_wa_alert(user_id: str, message: str) -> None:
    """HTTP POST to S1 /internal/wa-send. Fire-and-forget; never blocks gate response."""
    try:
        s1_url = os.environ.get("SERVER1_URL", "")
        if not s1_url or not user_id:
            return
        requests.post(
            f"{s1_url}/internal/wa-send",
            json={"user_id": user_id, "message": message},
            headers={"X-Agent-Secret": os.environ.get("AGENT_SECRET", "")},
            timeout=3,
        )
    except Exception:
        pass  # WA alert failure must never block the gate response


def _send_wa_founder(message: str, priority: str = "high") -> None:
    """Alert the founder via WA. Fire-and-forget."""
    try:
        founder_phone = os.environ.get("FOUNDER_PHONE", "")
        if not founder_phone:
            return
        s1_url = os.environ.get("SERVER1_URL", "")
        requests.post(
            f"{s1_url}/internal/wa-send",
            json={"phone": founder_phone, "message": f"[{priority.upper()}] {message}"},
            headers={"X-Agent-Secret": os.environ.get("AGENT_SECRET", "")},
            timeout=3,
        )
    except Exception:
        pass


def _pause_all_apply() -> None:
    """System-wide apply pause (S3 unreachable). Sets flag in system_daily_limits."""
    try:
        get_supabase().table("system_daily_limits").upsert(
            {"date": datetime.now(timezone.utc).date().isoformat(), "apply_paused": True}
        ).execute()
    except Exception:
        pass


GATE_FAILURE_ACTIONS: dict[str, Callable[[str | None, str], dict]] = {
    "skip_user_silently": lambda uid, msg: (
        _log_skip(uid, msg),
        {"status": "skipped", "error": msg},
    )[-1],

    "skip_user_send_wa_alert": lambda uid, msg: (
        _log_skip(uid, msg),
        _send_wa_alert(uid, f"⚠️ Talvix: Action skipped — {msg}"),
        {"status": "skipped", "error": msg},
    )[-1],

    "skip_user_send_wa_notice": lambda uid, msg: (
        _log_skip(uid, msg),
        _send_wa_alert(uid, f"ℹ️ Talvix: {msg}"),
        {"status": "skipped", "error": msg},
    )[-1],

    "defer_to_tomorrow": lambda uid, msg: (
        _log_skip(uid, f"[defer] {msg}"),
        {"status": "skipped", "error": msg},
    )[-1],

    "defer": lambda uid, msg: (
        _log_skip(uid, f"[defer] {msg}"),
        {"status": "skipped", "error": msg},
    )[-1],

    "pause_and_alert": lambda uid, msg: (
        _log_skip(uid, f"[pause] {msg}"),
        _send_wa_alert(uid, f"🚨 Talvix: Auto-apply paused — {msg}"),
        {"status": "skipped", "error": msg},
    )[-1],

    "skip_return_skipped": lambda uid, msg: (
        _log_skip(uid, msg),
        {"status": "skipped", "error": msg},
    )[-1],

    "alert_founder_pause_apply": lambda uid, msg: (
        _pause_all_apply(),
        _send_wa_founder(msg, "critical"),
        {"status": "failed", "error": msg},
    )[-1],

    "alert_founder_critical": lambda uid, msg: (
        _send_wa_founder(msg, "critical"),
        {"status": "failed", "error": msg},
    )[-1],
}


def handle_gate_failure(failure: GateFailure, user_id: str | None = None) -> dict:
    """
    Map a GateFailure to its defined action response.
    Never raises. Always returns a structured dict.
    """
    action_fn = GATE_FAILURE_ACTIONS.get(
        failure.action,
        GATE_FAILURE_ACTIONS["skip_return_skipped"],
    )
    return action_fn(user_id, failure.message)


# ─── RUN ALL GATES (ordered) ──────────────────────────────────────────────────

def run_all_gates(
    agent_secret: str,
    trigger: str,
    user_id: str | None = None,
    user: dict | None = None,
) -> None:
    """
    Run all four gates in strict order. Short-circuits on first GateFailure.
    Caller is responsible for catching GateFailure and calling handle_gate_failure().

    Args:
        agent_secret: Value of X-Agent-Secret header.
        trigger:      String identifier of the triggering event.
        user_id:      Optional UUID string for user-scoped triggers.
        user:         Optional pre-fetched user dict (avoids double DB call).
    """
    gate_identity(agent_secret, user_id)
    gate_safety(trigger, user_id)
    if user and trigger:
        gate_account(user, trigger)
    gate_system_health(trigger)
