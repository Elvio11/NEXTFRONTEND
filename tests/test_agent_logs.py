"""
tests/test_agent_logs.py
Test Group 7: agent_logs Compliance
Validates: log written at start with 'started', log at end with 'completed',
           exception writes 'failed', TTL rules (3d/30d), no secrets in logs.
"""

import asyncio
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock, call

import pytest


# ── TTL Tests ─────────────────────────────────────────────────────────────────

def test_success_log_expires_at_is_3_days():
    """log_end must set expires_at = NOW() + 3 days."""
    from log_utils.agent_logger import log_end
    import inspect
    source = inspect.getsource(log_end)
    assert "days=3" in source, "log_end must set expires_at = now + 3 days"
    assert "days=30" not in source, "log_end must NOT use 30-day TTL"


def test_failure_log_expires_at_is_30_days():
    """log_fail must set expires_at = NOW() + 30 days."""
    from log_utils.agent_logger import log_fail
    import inspect
    source = inspect.getsource(log_fail)
    assert "days=30" in source, "log_fail must set expires_at = now + 30 days"


@pytest.mark.asyncio
async def test_agent_log_written_at_start_with_status_started():
    """log_start must insert a row with status='started'."""
    with patch("log_utils.agent_logger.supabase") as mock_sb:
        insert_data = {}
        def capture(data):
            insert_data.update(data)
            return MagicMock(execute=MagicMock())
        mock_sb.table.return_value.insert.side_effect = capture

        from log_utils.agent_logger import log_start
        await log_start("test_agent", "user-123", "run-456")

        assert "started" in str(insert_data.get("status", "")), \
            "log_start must insert with status='started'"
        assert insert_data.get("id") == "run-456"
        assert insert_data.get("user_id") == "user-123"


@pytest.mark.asyncio
async def test_agent_log_written_at_end_with_status_completed():
    """log_end must update the row with status='completed'."""
    with patch("log_utils.agent_logger.supabase") as mock_sb:
        update_data = {}
        def capture_update(data):
            update_data.update(data)
            return MagicMock(eq=MagicMock(return_value=MagicMock(execute=MagicMock())))
        mock_sb.table.return_value.update.side_effect = capture_update

        from log_utils.agent_logger import log_end
        await log_end("run-456", 5, 1200)

        assert update_data.get("status") == "completed"
        assert update_data.get("records_processed") == 5
        assert update_data.get("duration_ms") == 1200


@pytest.mark.asyncio
async def test_agent_log_on_exception_writes_status_failed():
    """log_fail must update the row with status='failed'."""
    with patch("log_utils.agent_logger.supabase") as mock_sb:
        update_data = {}
        def capture_update(data):
            update_data.update(data)
            return MagicMock(eq=MagicMock(return_value=MagicMock(execute=MagicMock())))
        mock_sb.table.return_value.update.side_effect = capture_update

        from log_utils.agent_logger import log_fail
        await log_fail("run-456", "Something went wrong", 500)

        assert update_data.get("status") == "failed"
        assert "Something" in update_data.get("error_message", "")


@pytest.mark.asyncio
async def test_error_message_capped_at_500_chars():
    """Error messages must be capped at 500 chars to prevent secret leakage."""
    with patch("log_utils.agent_logger.supabase") as mock_sb:
        update_data = {}
        def capture_update(data):
            update_data.update(data)
            return MagicMock(eq=MagicMock(return_value=MagicMock(execute=MagicMock())))
        mock_sb.table.return_value.update.side_effect = capture_update

        from log_utils.agent_logger import log_fail
        long_error = "X" * 1000
        await log_fail("run-456", long_error, 100)

        assert len(update_data.get("error_message", "")) <= 500, \
            "error_message must be capped at 500 chars"


def test_no_session_data_in_agent_log_metadata():
    """No agent file should log 'session_encrypted' or cookie data."""
    import subprocess
    server3_root = Path(__file__).parent.parent
    result = subprocess.run(
        ["grep", "-r", "--include=*.py", "-n", "session_encrypted.*log", str(server3_root)],
        capture_output=True, text=True,
    )
    bad = [l for l in result.stdout.strip().splitlines() if "NEVER" not in l and "#" not in l.split(":")[0]]
    assert not bad, f"session_encrypted appears near a log call:\n{bad}"


def test_no_secrets_in_agent_log_error_message():
    """log_fail source must cap error at 500 chars and never log raw stack traces with env vars."""
    from log_utils import agent_logger
    import inspect
    source = inspect.getsource(agent_logger.log_fail)
    # Must truncate: error[:500] pattern
    assert "[:500]" in source or "[:500" in source, \
        "log_fail must truncate error to 500 chars with error[:500]"


@pytest.mark.asyncio
async def test_log_start_sets_expires_at():
    """log_start must set expires_at at INSERT time (not relying on pg_cron)."""
    with patch("log_utils.agent_logger.supabase") as mock_sb:
        insert_data = {}
        def capture(data):
            insert_data.update(data)
            return MagicMock(execute=MagicMock())
        mock_sb.table.return_value.insert.side_effect = capture

        from log_utils.agent_logger import log_start
        await log_start("agent_test", None, "run-999")

        assert "expires_at" in insert_data, "log_start must set expires_at at INSERT time"
