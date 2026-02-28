"""
tests/test_foundation.py
Test Group 1: Foundation Security
Validates: no .env files, no hardcoded secrets, auth enforcement, module naming rules.
"""

import ast
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Server3 root
SERVER3_ROOT = Path(__file__).parent.parent


# ── Helpers ────────────────────────────────────────────────────────────────────

def grep_server3(pattern: str) -> str:
    """Run grep recursively in server3/. Returns stdout."""
    result = subprocess.run(
        ["grep", "-r", "--include=*.py", "-l", pattern, str(SERVER3_ROOT)],
        capture_output=True, text=True,
    )
    return result.stdout.strip()


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_no_dotenv_files_in_server3():
    """No .env files of any kind should exist."""
    env_files = list(SERVER3_ROOT.rglob(".env*"))
    assert not env_files, f".env FILES FOUND: {env_files}"


def test_no_hardcoded_secrets_in_any_server3_file():
    """No common secret patterns should appear literally in source files."""
    patterns = [
        r"SUPABASE_SERVICE_KEY\s*=\s*['\"]eyJ",
        r"AGENT_SECRET\s*=\s*['\"][a-zA-Z0-9]{20,}",
        r"SARVAM_API_KEY\s*=\s*['\"][a-zA-Z0-9]{20,}",
        r"SESSION_KEY\s*=\s*['\"][0-9a-f]{64}",
    ]
    for pattern in patterns:
        result = subprocess.run(
            ["grep", "-r", "--include=*.py", "-n", "-E", pattern, str(SERVER3_ROOT)],
            capture_output=True, text=True,
        )
        assert not result.stdout.strip(), f"HARDCODED SECRET PATTERN FOUND:\n{result.stdout}"


def test_agent_secret_missing_returns_403():
    """Requests without X-Agent-Secret header must get 403."""
    with patch.dict(os.environ, {"AGENT_SECRET": "test-secret", "SUPABASE_URL": "http://x", "SUPABASE_SERVICE_KEY": "x"}):
        with patch("db.client.create_client", return_value=MagicMock()):
            # Import fresh to pick up mocked env
            import importlib
            import main as m
            client = TestClient(m.app)
            resp = client.post("/api/agents/anti-ban", json={"action_type": "apply"})
            assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


def test_agent_secret_wrong_returns_403():
    """Wrong X-Agent-Secret must get 403."""
    with patch.dict(os.environ, {"AGENT_SECRET": "correct-secret", "SUPABASE_URL": "http://x", "SUPABASE_SERVICE_KEY": "x"}):
        with patch("db.client.create_client", return_value=MagicMock()):
            import main as m
            client = TestClient(m.app)
            resp = client.post(
                "/api/agents/anti-ban",
                json={"action_type": "apply"},
                headers={"x-agent-secret": "wrong-secret"},
            )
            assert resp.status_code == 403


def test_agent_secret_correct_returns_non_403():
    """Correct X-Agent-Secret must NOT get 403."""
    with patch.dict(os.environ, {"AGENT_SECRET": "correct-secret", "SUPABASE_URL": "http://x", "SUPABASE_SERVICE_KEY": "x"}):
        with patch("db.client.create_client", return_value=MagicMock()):
            with patch("agents.agent13_anti_ban.run_anti_ban") as mock_ab:
                mock_ab.return_value = {"risk_level": "low", "proceed": True, "delay_seconds": 0, "reason": "ok"}
                import main as m
                client = TestClient(m.app)
                resp = client.post(
                    "/api/agents/anti-ban",
                    json={"action_type": "apply"},
                    headers={"x-agent-secret": "correct-secret"},
                )
                assert resp.status_code != 403, f"Got unexpected 403"


def test_supabase_service_key_only_in_db_client():
    """SUPABASE_SERVICE_KEY should only be referenced in db/client.py."""
    files_with_key = grep_server3("SUPABASE_SERVICE_KEY")
    # Only db/client.py should reference this key
    lines = [l for l in files_with_key.splitlines() if l.strip()]
    non_client_refs = [l for l in lines if "db/client.py" not in l and "db\\client.py" not in l]
    assert not non_client_refs, f"SUPABASE_SERVICE_KEY found outside db/client.py:\n{non_client_refs}"


def test_no_logging_module_import():
    """No file should import from `logging` module (must use log_utils/)."""
    result = subprocess.run(
        ["grep", "-r", "--include=*.py", "-n", "^import logging", str(SERVER3_ROOT)],
        capture_output=True, text=True,
    )
    # Allow logging in tests themselves — check agent/skill/router files only
    bad_lines = [
        l for l in result.stdout.strip().splitlines()
        if "tests/" not in l and "test_" not in l
    ]
    assert not bad_lines, f"Direct `logging` module import found:\n{bad_lines}"


def test_no_src_prefix_in_main():
    """main.py must not reference 'src.main' — no src/ folder exists."""
    main_content = (SERVER3_ROOT / "main.py").read_text()
    assert "src.main" not in main_content, "main.py references 'src.main' — no src/ folder on Server 3"
    assert "src/" not in main_content, "main.py references src/ path"


def test_port_8003_in_main():
    """main.py must specify port 8003."""
    main_content = (SERVER3_ROOT / "main.py").read_text()
    assert "8003" in main_content, "Port 8003 not found in main.py"
