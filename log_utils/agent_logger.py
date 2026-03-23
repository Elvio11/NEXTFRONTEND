"""
log_utils/agent_logger.py
Writes structured start/end/fail/skip records to the agent_logs table.

TTL rules:
  success / skipped  → expires_at = NOW() + 3 days
  failed             → expires_at = NOW() + 30 days
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from db.client import get_supabase

_logger = logging.getLogger("agent_logger")

def _now() -> datetime:
    return datetime.now(timezone.utc)

async def log_start(
    agent_name: str,
    user_id: Optional[str],
    run_id: str,
) -> None:
    """Insert an agent_logs row with status='started'. Exception-safe."""
    try:
        data = {
            "id":           run_id,
            "agent_name":   agent_name,
            "user_id":      user_id,
            "status":       "started",
            "expires_at":   (_now() + timedelta(days=3)).isoformat(),
            "metadata":     {}
        }
        get_supabase().table("agent_logs").insert(data).execute()
    except Exception as e:
        _logger.error(f"Logging failed (log_start): {e}")

async def log_end(
    run_id: str,
    records_processed: int,
    duration_ms: int,
) -> None:
    """Update agent_logs row to status='completed'. Exception-safe."""
    try:
        get_supabase().table("agent_logs").update({
            "status":            "completed",
            "records_processed": records_processed,
            "duration_ms":       duration_ms,
            "expires_at":        (_now() + timedelta(days=3)).isoformat(),
        }).eq("id", run_id).execute()
    except Exception as e:
        _logger.error(f"Logging failed (log_end): {e}")

async def log_fail(
    run_id: str,
    error: str,
    duration_ms: int,
) -> None:
    """Update agent_logs row to status='failed' with 30-day TTL. Exception-safe."""
    try:
        get_supabase().table("agent_logs").update({
            "status":        "failed",
            "error_message": error[:500],
            "duration_ms":   duration_ms,
            "expires_at":    (_now() + timedelta(days=30)).isoformat(),
        }).eq("id", run_id).execute()
    except Exception as e:
        _logger.error(f"Logging failed (log_fail): {e}")

async def log_skip(
    run_id: str,
    reason: str,
) -> None:
    """Update agent_logs row to status='skipped'. Exception-safe."""
    try:
        get_supabase().table("agent_logs").update({
            "status":        "skipped",
            "error_message": reason[:500],
            "expires_at":    (_now() + timedelta(days=3)).isoformat(),
        }).eq("id", run_id).execute()
    except Exception as e:
        _logger.error(f"Logging failed (log_skip): {e}")

def new_run_id() -> str:
    """Generate a fresh UUID for a new agent run."""
    return str(uuid.uuid4())

def log_event(agent_name: str, level: str, message: str) -> None:
    """Legacy shim for non-structured logging. Exception-safe."""
    try:
        msg = f"[{agent_name}] {message}"
        if level.lower() == "error":
            _logger.error(msg)
        elif level.lower() == "warn":
            _logger.warning(msg)
        else:
            _logger.info(msg)
    except Exception:
        pass
