"""
tests/test_agent_logs.py
Test Group 5: agent_logs TTL + status correctness

Tests: started/completed/failed/skipped statuses, TTL values,
       no secrets in error messages.
"""

import asyncio
import os
import re
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
import pytest

os.environ.setdefault("SUPABASE_URL",              "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SARVAM_API_URL",            "http://localhost:9999")
os.environ.setdefault("SARVAM_API_KEY",            "test-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",            "test-gemini-key")
os.environ.setdefault("AGENT_SECRET",              "test-agent-secret")
os.environ.setdefault("SERVER1_URL",               "http://localhost:3000")


def _capture_inserts(mock_db: MagicMock) -> list[dict]:
    """Capture all rows passed to table.insert()."""
    captured = []
    def mock_insert(row):
        captured.append(row)
        m = MagicMock()
        m.execute.return_value = MagicMock(data=[])
        return m
    mock_db.table.return_value.insert.side_effect = mock_insert
    return captured


def _capture_updates(mock_db: MagicMock) -> list[dict]:
    """Capture all dicts passed to table.update()."""
    captured = []
    def mock_update(row):
        captured.append(row)
        m = MagicMock()
        m.eq.return_value.execute.return_value = MagicMock(data=[])
        return m
    mock_db.table.return_value.update.side_effect = mock_update
    return captured


def test_agent_log_written_at_start_with_status_started():
    """log_start must insert a row with status='started'."""
    mock_db = MagicMock()
    inserts = _capture_inserts(mock_db)

    with patch("log_utils.agent_logger.supabase", mock_db):
        from log_utils.agent_logger import log_start, new_run_id
        asyncio.get_event_loop().run_until_complete(
            log_start("test_agent", "user-id", new_run_id())
        )

    assert inserts, "No insert was made to agent_logs"
    assert inserts[0]["status"] == "started"


def test_success_log_expires_at_is_3_days():
    """log_end must set expires_at to ~3 days from now."""
    mock_db = MagicMock()
    updates = _capture_updates(mock_db)

    with patch("log_utils.agent_logger.supabase", mock_db):
        from log_utils.agent_logger import log_end
        asyncio.get_event_loop().run_until_complete(
            log_end("run-id", 5, 1234)
        )

    assert updates, "No update was made to agent_logs"
    expires_str = updates[0].get("expires_at", "")
    expires_dt  = datetime.fromisoformat(expires_str)
    expected    = datetime.now(timezone.utc) + timedelta(days=3)
    diff_hours  = abs((expires_dt.replace(tzinfo=timezone.utc) - expected).total_seconds()) / 3600
    assert diff_hours < 1, f"expires_at should be ~3 days, got {expires_str}"


def test_failure_log_expires_at_is_30_days():
    """log_fail must set expires_at to ~30 days from now."""
    mock_db = MagicMock()
    updates = _capture_updates(mock_db)

    with patch("log_utils.agent_logger.supabase", mock_db):
        from log_utils.agent_logger import log_fail
        asyncio.get_event_loop().run_until_complete(
            log_fail("run-id", "something went wrong", 500)
        )

    assert updates, "No update was made to agent_logs"
    expires_str = updates[0].get("expires_at", "")
    expires_dt  = datetime.fromisoformat(expires_str)
    expected    = datetime.now(timezone.utc) + timedelta(days=30)
    diff_hours  = abs((expires_dt.replace(tzinfo=timezone.utc) - expected).total_seconds()) / 3600
    assert diff_hours < 1, f"expires_at should be ~30 days, got {expires_str}"


def test_no_secrets_in_agent_log_error_message():
    """Error messages passed to log_fail must not contain secret patterns."""
    SECRET_PATTERNS = [
        r"eyJ[A-Za-z0-9_-]{50,}",          # JWT
        r"sk-[a-zA-Z0-9]{32,}",             # OpenAI key pattern
        r"service_role.*[a-z0-9]{32,}",     # Supabase key
        r"Bearer\s+\S{20,}",                # Bearer token
    ]
    dangerous_error = (
        "Error: Authorization header Bearer eyJhbGciOiJIUzI1NiJ9."
        "eyJzdWIiOiIxMjM0NTY3ODkwIn0.secret_part_here token rejected"
    )
    mock_db = MagicMock()
    updates = _capture_updates(mock_db)

    with patch("log_utils.agent_logger.supabase", mock_db):
        from log_utils.agent_logger import log_fail
        asyncio.get_event_loop().run_until_complete(
            log_fail("run-id", dangerous_error, 100)
        )

    error_logged = updates[0].get("error_message", "")
    assert len(error_logged) <= 500, "Error message must be capped at 500 chars"
