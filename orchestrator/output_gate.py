"""
orchestrator/output_gate.py
Output Gate — validates CrewAI agent outputs before any DB write or send.

Python enforces all hard business rules here. CrewAI cannot bypass them.
Called after every agent completes, before results touch Supabase or storage.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from db.client import get_supabase
from orchestrator.context_builder import is_within_followup_window


class OutputGateFailure(Exception):
    """Raised when an agent output fails validation. Never crashes — caller catches."""

    def __init__(self, agent_id: str, reason: str) -> None:
        super().__init__(f"[output_gate:{agent_id}] {reason}")
        self.agent_id = agent_id
        self.reason   = reason


def gate_output(
    agent_id:  str,
    output:    dict,
    user:      dict | None = None,
    app_id:    str | None  = None,
) -> None:
    """
    Validate agent output before any write or send operation.

    Args:
        agent_id: Agent identifier string (e.g. 'agent_10', 'agent_12').
        output:   The dict returned by the agent.
        user:     Fetched user row (required for cap-related agents).
        app_id:   Job application UUID (required for apply/tailor/cover agents).

    Raises:
        OutputGateFailure: On any validation failure.
    """
    if agent_id == "agent_10":
        _validate_resume_tailor(output, user, app_id)
    elif agent_id == "agent_12":
        _validate_auto_apply(output, user)
    elif agent_id == "agent_14":
        _validate_follow_up(output, user, app_id)
    elif agent_id == "agent_15":
        _validate_calibrator(output)
    # Agents 3–9, 11, 13: no specific output gate — standard status check applies
    _validate_status_contract(agent_id, output)


# ─── AGENT-SPECIFIC VALIDATORS ────────────────────────────────────────────────

def _validate_resume_tailor(output: dict, user: dict | None, app_id: str | None) -> None:
    """Agent 10 — Resume Tailor: PDF must exist on FluxShare."""
    pdf_path = output.get("pdf_path") or output.get("tailored_resume_path")
    if not pdf_path:
        raise OutputGateFailure("agent_10", "No PDF path in output")
    if not os.path.exists(pdf_path):
        raise OutputGateFailure(
            "agent_10",
            f"PDF file not found at {pdf_path} — storage write may have failed",
        )
    if output.get("fabricated_experience"):
        raise OutputGateFailure(
            "agent_10",
            "CRITICAL: fabricated_experience flag set — LLM invented content. Rejected.",
        )


def _validate_auto_apply(output: dict, user: dict | None) -> None:
    """
    Agent 12 — Auto Apply: validates caps, then increments both apply counters atomically.
    This is the ONLY place counters are incremented — never in the agent itself.
    """
    if output.get("status") != "submitted":
        return  # Only increment on confirmed submit

    if not user:
        raise OutputGateFailure("agent_12", "No user dict provided for cap validation")

    user_id      = user["id"]
    daily_count  = user.get("daily_apply_count", 0)
    daily_limit  = user.get("daily_apply_limit", 10)
    monthly_count = user.get("monthly_apply_count", 0)

    if daily_count >= daily_limit:
        raise OutputGateFailure(
            "agent_12",
            f"Daily cap exceeded during execution ({daily_count}/{daily_limit}). Submission rejected.",
        )
    if monthly_count >= 250:
        raise OutputGateFailure(
            "agent_12",
            f"Monthly cap exceeded during execution ({monthly_count}/250). Submission rejected.",
        )

    # Increment both counters
    get_supabase().rpc(
        "increment_apply_counts",
        {"p_user_id": user_id},
    ).execute()


def _validate_follow_up(
    output:  dict,
    user:    dict | None,
    app_id:  str | None,
) -> None:
    """
    Agent 14 — Follow-Up: validates timing window and detects duplicate sends.
    Only runs validation if the output signals an email_sent event.
    """
    if not output.get("email_sent"):
        return

    # Timing gate — 9 AM to 11 AM IST only
    if not is_within_followup_window():
        raise OutputGateFailure(
            "agent_14",
            "Follow-up email blocked — outside 9 AM–11 AM IST send window",
        )

    # Duplicate send guard
    if not app_id:
        raise OutputGateFailure("agent_14", "app_id required for duplicate check")

    day = output.get("day")  # 7, 14, or "close_loop"
    field_map = {
        7: "fu_email_1_sent_at",
        14: "fu_email_2_sent_at",
        "close_loop": "fu_close_loop_sent_at",
    }
    field = field_map.get(day)
    if field:
        result = (
            get_supabase()
            .table("job_applications")
            .select(field)
            .eq("id", app_id)
            .single()
            .execute()
        )
        if result.data and result.data.get(field):
            raise OutputGateFailure(
                "agent_14",
                f"Duplicate follow-up blocked — day={day} already sent for app_id={app_id}",
            )


def _validate_calibrator(output: dict) -> None:
    """
    Agent 15 — Feedback Calibrator: enforces weight bounds and 5%/day change limit.
    The DB CHECK constraint is a second layer; this is the first.
    """
    weight_changes = output.get("weight_changes", {})
    if not weight_changes:
        return

    supabase = get_supabase()
    for weight_key, new_value in weight_changes.items():
        result = (
            supabase
            .table("model_weights")
            .select("weight_value, min_value, max_value")
            .eq("weight_key", weight_key)
            .single()
            .execute()
        )
        if not result.data:
            raise OutputGateFailure(
                "agent_15",
                f"Unknown weight key: {weight_key}",
            )

        w = result.data
        min_v    = w["min_value"]
        max_v    = w["max_value"]
        current  = w["weight_value"]

        # Hard bounds
        if not (min_v <= new_value <= max_v):
            raise OutputGateFailure(
                "agent_15",
                f"Weight '{weight_key}' value {new_value} outside bounds [{min_v}, {max_v}]",
            )

        # 5% daily change limit
        if current != 0:
            change_pct = abs(new_value - current) / abs(current)
            if change_pct > 0.05:
                raise OutputGateFailure(
                    "agent_15",
                    f"Weight '{weight_key}' change {change_pct:.1%} exceeds 5%/day limit",
                )


# ─── STANDARD STATUS CONTRACT CHECK ──────────────────────────────────────────

def _validate_status_contract(agent_id: str, output: dict) -> None:
    """Every agent output must carry a valid 'status' field."""
    valid_statuses = {"success", "skipped", "failed"}
    status = output.get("status")
    if status not in valid_statuses:
        raise OutputGateFailure(
            agent_id,
            f"Invalid or missing 'status' in output: {status!r}. Must be one of {valid_statuses}",
        )
