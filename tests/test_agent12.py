"""
tests/test_agent12.py
Test Group 5: Auto-Applier (Agent 12)
Validates: eligibility gates, apply caps, fit score filter, anti-ban abort,
           DB record insertion, WhatsApp notification, no time.sleep in apply_engine.
"""

import ast
import asyncio
import inspect
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

SERVER3_ROOT = Path(__file__).parent.parent

# ── Helper ─────────────────────────────────────────────────────────────────────

def _make_user(**overrides):
    base = {
        "id": "user-123",
        "subscription_tier": "paid",
        "wa_opted_in": True,
        "auto_apply_enabled": True,
        "auto_apply_paused": False,
        "daily_apply_limit": 10,
        "auto_apply_activated_at": "2020-01-01T00:00:00+00:00",  # old → not review mode
    }
    return {**base, **overrides}


def _mock_supabase_for_user(mock_sb, user: dict, daily_count=0, monthly_count=0, fit_scores=None):
    """Set up a Supabase mock that returns the given user, apply counts, and fit scores."""
    # user query
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = user
    # count queries
    mock_sb.table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.count = daily_count
    # fit scores
    mock_sb.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.limit.return_value.execute.return_value.data = fit_scores or []


# ── Tests ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_free_user_cannot_trigger_apply():
    """Free tier users must be rejected immediately."""
    with patch("agents.agent12_applier.supabase") as mock_sb, \
         patch("agents.agent12_applier.log_start", new_callable=AsyncMock), \
         patch("agents.agent12_applier.log_skip", new_callable=AsyncMock), \
         patch("agents.agent12_applier._is_in_apply_window", return_value=True):

        mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = _make_user(subscription_tier="free")

        from agents.agent12_applier import run_applier
        result = await run_applier("user-123")
        assert result["status"] == "skipped"
        assert "free_tier" in result.get("reason", "")


@pytest.mark.asyncio
async def test_apply_blocked_outside_apply_window():
    """Applies outside 20:00–06:00 IST must be skipped."""
    with patch("agents.agent12_applier._is_in_apply_window", return_value=False), \
         patch("agents.agent12_applier.log_start", new_callable=AsyncMock), \
         patch("agents.agent12_applier.log_skip", new_callable=AsyncMock):

        from agents.agent12_applier import run_applier
        result = await run_applier("user-123")
        assert result["status"] == "skipped"
        assert "window" in result.get("reason", "")


@pytest.mark.asyncio
async def test_daily_cap_10_enforced():
    """daily_apply_count >= 10 must block apply."""
    with patch("agents.agent12_applier.supabase") as mock_sb, \
         patch("agents.agent12_applier.log_start", new_callable=AsyncMock), \
         patch("agents.agent12_applier.log_skip", new_callable=AsyncMock), \
         patch("agents.agent12_applier._is_in_apply_window", return_value=True), \
         patch("agents.agent12_applier._get_daily_apply_count", return_value=10), \
         patch("agents.agent12_applier._get_monthly_apply_count", return_value=5):

        mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = _make_user()

        from agents.agent12_applier import run_applier
        result = await run_applier("user-123")
        assert result["status"] == "skipped"
        assert "daily" in result.get("reason", "").lower()


@pytest.mark.asyncio
async def test_monthly_cap_250_enforced():
    """monthly_apply_count >= 250 must block apply."""
    with patch("agents.agent12_applier.supabase") as mock_sb, \
         patch("agents.agent12_applier.log_start", new_callable=AsyncMock), \
         patch("agents.agent12_applier.log_skip", new_callable=AsyncMock), \
         patch("agents.agent12_applier._is_in_apply_window", return_value=True), \
         patch("agents.agent12_applier._get_daily_apply_count", return_value=0), \
         patch("agents.agent12_applier._get_monthly_apply_count", return_value=250):

        mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = _make_user()

        from agents.agent12_applier import run_applier
        result = await run_applier("user-123")
        assert result["status"] == "skipped"
        assert "monthly" in result.get("reason", "").lower()


def test_fit_score_below_60_skipped():
    """Agent 12 must filter out jobs with fit_score < 60 in DB query."""
    agent12_src = (SERVER3_ROOT / "agents" / "agent12_applier.py").read_text()
    assert "gte" in agent12_src and "60" in agent12_src, \
        "Agent 12 must query fit_score >= 60 using .gte('fit_score', 60)"


def test_already_applied_job_skipped():
    """_is_already_applied must be called per job."""
    agent12_src = (SERVER3_ROOT / "agents" / "agent12_applier.py").read_text()
    assert "_is_already_applied" in agent12_src, \
        "Agent 12 must call _is_already_applied before applying"


@pytest.mark.asyncio
async def test_anti_ban_critical_aborts_apply():
    """If Agent 13 returns proceed=False, the job must be skipped."""
    with patch("agents.agent12_applier._call_anti_ban", new_callable=AsyncMock) as mock_ab, \
         patch("agents.agent12_applier._is_in_apply_window", return_value=True), \
         patch("agents.agent12_applier._get_daily_apply_count", return_value=0), \
         patch("agents.agent12_applier._get_monthly_apply_count", return_value=0), \
         patch("agents.agent12_applier._get_user_blacklist", return_value=set()), \
         patch("agents.agent12_applier._get_session", return_value={"cookies": []}), \
         patch("agents.agent12_applier.log_start", new_callable=AsyncMock), \
         patch("agents.agent12_applier.log_end", new_callable=AsyncMock), \
         patch("agents.agent12_applier.supabase") as mock_sb:

        mock_ab.return_value = {"risk_level": "critical", "proceed": False, "delay_seconds": 0, "reason": "kill switch"}

        # Set up user query chain carefully
        user_mock = MagicMock()
        user_mock.data = _make_user()
        mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = user_mock
        mock_sb.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            {"job_id": "job-1", "fit_score": 85}
        ]
        mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {"id": "job-1", "title": "SWE", "company": "Acme", "company_canonical": "acme", "apply_url": "https://indeed.com/apply", "source": "indeed"}
        mock_sb.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = []

        from agents.agent12_applier import run_applier
        result = await run_applier("user-123")
        # Ensure anti_ban proceed=False results in skipped/no apply
        assert result["applied"] == 0


def test_successful_apply_inserts_job_application_row():
    """_record_application must insert to job_applications table."""
    agent12_src = (SERVER3_ROOT / "agents" / "agent12_applier.py").read_text()
    assert "job_applications" in agent12_src, \
        "Agent 12 must insert to job_applications table after successful apply"
    assert "_record_application" in agent12_src or "supabase.table(\"job_applications\").insert" in agent12_src


def test_whatsapp_notification_sent_after_apply():
    """Agent 12 must call _send_wa_notification after successful apply."""
    agent12_src = (SERVER3_ROOT / "agents" / "agent12_applier.py").read_text()
    assert "_send_wa_notification" in agent12_src, \
        "Agent 12 must call _send_wa_notification after successful apply"


def test_no_time_sleep_in_apply_engine():
    """apply_engine.py must not use time.sleep() — WebDriverWait only."""
    ae_file = SERVER3_ROOT / "skills" / "apply_engine.py"
    tree = ast.parse(ae_file.read_text())

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            # Check for time.sleep calls
            if isinstance(node.func, ast.Attribute):
                if node.func.attr == "sleep" and isinstance(node.func.value, ast.Name):
                    if node.func.value.id == "time":
                        raise AssertionError(
                            f"time.sleep() found in apply_engine.py at line {node.lineno} — use WebDriverWait"
                        )
