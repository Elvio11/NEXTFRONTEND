"""
tests/test_gates.py
Tests for the Python Gate Layer (Identity, Safety, Account, System Health).
"""

import os
from unittest.mock import MagicMock, patch

import pytest

from orchestrator.gates import (
    GateFailure,
    gate_identity,
    gate_safety,
    gate_account,
    gate_system_health,
    run_all_gates,
    handle_gate_failure,
)

# Mock env vars
os.environ["AGENT_SECRET"]     = "test-secret"
os.environ["SERVER1_URL"]      = "http://test-server1"
os.environ["S4_URL"]           = "http://test-s3:9000"
os.environ["MINIO_ACCESS_KEY"] = "test-access"
os.environ["MINIO_SECRET_KEY"] = "test-secret"
os.environ["MINIO_BUCKET"]     = "talvix"

# ─── GATE 1: IDENTITY ─────────────────────────────────────────────────────────

def test_gate_identity_rejects_wrong_secret():
    with pytest.raises(GateFailure) as exc:
        gate_identity(agent_secret="wrong", user_id=None)
    assert exc.value.gate == "identity"
    assert exc.value.http_status == 403


@patch("orchestrator.gates.get_supabase")
def test_gate_identity_rejects_missing_user(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
    mock_supabase.return_value = mock_db

    with pytest.raises(GateFailure) as exc:
        gate_identity(agent_secret="test-secret", user_id="user-123")
    assert exc.value.gate == "identity"
    assert exc.value.http_status == 404


# ─── GATE 2: SAFETY ───────────────────────────────────────────────────────────

@patch("orchestrator.gates.get_supabase")
def test_gate_safety_linkedin_kill_switch(mock_supabase):
    mock_db = MagicMock()
    # Mock returning 1500 actions today
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {"total_linkedin_actions": 1500}
    mock_supabase.return_value = mock_db

    with pytest.raises(GateFailure) as exc:
        gate_safety(trigger="linkedin_connect", user_id="user-123")
    assert exc.value.gate == "safety"
    assert exc.value.action == "defer_to_tomorrow"
    assert "1500" in exc.value.message


@patch("orchestrator.gates.SarvamClient")
def test_gate_safety_sarvam_unavailable(mock_sarvam_cls):
    mock_client = MagicMock()
    mock_client.is_healthy.return_value = False
    mock_sarvam_cls.return_value = mock_client

    with pytest.raises(GateFailure) as exc:
        gate_safety(trigger="full_scan")
    assert exc.value.gate == "safety"
    assert exc.value.action == "skip_return_skipped"


# ─── GATE 3: ACCOUNT ──────────────────────────────────────────────────────────

@patch("orchestrator.gates.get_supabase")
def test_gate_account_daily_cap_hit(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {"is_valid": True, "consecutive_failures": 0}
    mock_supabase.return_value = mock_db

    user_state = {
        "id": "u1",
        "tier": "paid",
        "auto_apply_enabled": True,
        "daily_apply_count": 10,
        "daily_apply_limit": 10,
        "monthly_apply_count": 0,
    }
    with pytest.raises(GateFailure) as exc:
        gate_account(user_state, trigger="apply_window_open")
    
    assert exc.value.gate == "account"
    assert "Daily apply cap hit" in exc.value.message
    assert exc.value.action == "skip_user_silently"


@patch("orchestrator.gates.get_supabase")
def test_gate_account_monthly_cap_hit(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {"is_valid": True, "consecutive_failures": 0}
    mock_supabase.return_value = mock_db

    user_state = {
        "id": "u1",
        "tier": "paid",
        "auto_apply_enabled": True,
        "daily_apply_count": 0,
        "daily_apply_limit": 10,
        "monthly_apply_count": 250,
    }
    with pytest.raises(GateFailure) as exc:
        gate_account(user_state, trigger="apply_window_open")
    
    assert exc.value.gate == "account"
    assert "Monthly apply cap hit" in exc.value.message
    assert exc.value.action == "skip_user_send_wa_notice"


@patch("orchestrator.gates.get_supabase")
def test_gate_account_free_user_blocked(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {"is_valid": True, "consecutive_failures": 0}
    mock_supabase.return_value = mock_db

    user_state = {
        "id": "u1",
        "tier": "free",
        "auto_apply_enabled": True,
    }
    with pytest.raises(GateFailure) as exc:
        gate_account(user_state, trigger="apply_window_open")
    
    assert exc.value.gate == "account"
    assert "Free user" in exc.value.message
    assert exc.value.action == "skip_user_silently"


@patch("orchestrator.gates.get_supabase")
def test_gate_account_session_invalid(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {"is_valid": False}
    mock_supabase.return_value = mock_db

    user_state = {"id": "u1"}
    with pytest.raises(GateFailure) as exc:
        gate_account(user_state, trigger="linkedin_connect")
    
    assert exc.value.gate == "account"
    assert "Session invalid" in exc.value.message
    assert exc.value.action == "skip_user_send_wa_alert"


@patch("orchestrator.gates.get_supabase")
def test_gate_account_three_consecutive_failures(mock_supabase):
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "is_valid": True,
        "consecutive_failures": 3
    }
    update_mock = MagicMock()
    mock_db.table.return_value.update.return_value.eq.return_value.execute = update_mock
    mock_supabase.return_value = mock_db

    user_state = {"id": "u1"}
    with pytest.raises(GateFailure) as exc:
        gate_account(user_state, trigger="linkedin_connect")
    
    assert exc.value.gate == "account"
    assert "3 consecutive failures" in exc.value.message
    assert exc.value.action == "pause_and_alert"
    update_mock.assert_called_once()  # Enforces DB mutation happened


# ─── GATE 4: SYSTEM HEALTH ────────────────────────────────────────────────────

@patch("orchestrator.gates.get_s3_client")
def test_gate_system_health_storage_missing(mock_get_s3):
    mock_client = MagicMock()
    # Mock EndpointConnectionError
    from botocore.exceptions import EndpointConnectionError
    mock_client.head_bucket.side_effect = EndpointConnectionError(endpoint_url="http://test-s3")
    mock_get_s3.return_value = mock_client
    
    with pytest.raises(GateFailure) as exc:
        gate_system_health(trigger="scrape")
        
    assert exc.value.gate == "system_health"
    assert exc.value.action == "alert_founder_critical"


# ─── RUN ALL GATES ────────────────────────────────────────────────────────────

@patch("orchestrator.gates.gate_identity")
@patch("orchestrator.gates.gate_safety")
@patch("orchestrator.gates.gate_account")
@patch("orchestrator.gates.gate_system_health")
def test_all_gates_pass(mock_health, mock_acct, mock_safety, mock_ident):
    # No exceptions raised
    run_all_gates(agent_secret="test-secret", trigger="test_trigger", user_id="u1", user={"id":"u1"})
    mock_ident.assert_called_once()
    mock_safety.assert_called_once()
    mock_acct.assert_called_once()
    mock_health.assert_called_once()


def test_gate_failure_never_crashes():
    gf = GateFailure(gate="identity", message="msg", action="skip_return_skipped")
    res = handle_gate_failure(gf, "u1")
    assert res == {"status": "skipped", "error": "msg"}
