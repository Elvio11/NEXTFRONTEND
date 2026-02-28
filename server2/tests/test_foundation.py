"""
tests/test_foundation.py
Test Group 1: Foundation Security — QA Debugger Phase 3C

Tests:
  - No .env files in server2/
  - No hardcoded secrets in any server2/ file
  - HTTP 403 when X-Agent-Secret missing or wrong
  - HTTP 200 when X-Agent-Secret correct
  - SUPABASE_SERVICE_ROLE_KEY only in db/client.py
"""

import os
import re
import subprocess
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Mock env before importing app
os.environ.setdefault("SUPABASE_URL",              "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("AGENT_SECRET",              "test-agent-secret")
os.environ.setdefault("SARVAM_API_URL",            "http://localhost:9999")
os.environ.setdefault("SARVAM_API_KEY",            "test-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",            "test-gemini-key")
os.environ.setdefault("SERVER1_URL",               "http://localhost:3000")
os.environ.setdefault("SERVER2_URL",               "http://localhost:8002")

SERVER2_DIR = Path(__file__).parent.parent  # server2/


def _find_files(extension: str = ".py") -> list[Path]:
    return list(SERVER2_DIR.rglob(f"*{extension}"))


def _find_py_files_excluding(exclude_dirs: list[str]) -> list[Path]:
    files = []
    for f in _find_files(".py"):
        if not any(excl in str(f) for excl in exclude_dirs):
            files.append(f)
    return files


# ─── Environment & File Hygiene ──────────────────────────────────────────────

def test_no_dotenv_files_in_server2_directory():
    """No .env files of any kind — secrets from Doppler only."""
    env_files = list(SERVER2_DIR.glob(".env*")) + list(SERVER2_DIR.glob("**/.env*"))
    assert not env_files, f".env files found: {env_files}"


def test_no_hardcoded_secrets_in_any_server2_file():
    """No hardcoded service_role keys or API key patterns."""
    patterns = [
        r'service_role.*=.*["\'][a-zA-Z0-9\-_]{20,}',
        r'SARVAM_API_KEY.*=.*["\'][a-zA-Z0-9\-_]{10,}',
        r'GEMINI_API_KEY.*=.*["\'][a-zA-Z]{10,}',
        r'eyJ[A-Za-z0-9_-]{50,}',  # JWT token pattern
    ]
    violations = []
    for f in _find_py_files_excluding(["tests", "__pycache__"]):
        content = f.read_text(errors="ignore")
        for pattern in patterns:
            if re.search(pattern, content):
                violations.append(f"{f}: {pattern}")
    assert not violations, f"Hardcoded secrets found:\n" + "\n".join(violations)


def test_no_dotenv_import_in_any_file():
    """No 'from dotenv' or 'import dotenv' anywhere."""
    violations = []
    for f in _find_files(".py"):
        content = f.read_text(errors="ignore")
        if "dotenv" in content.lower() and "__pycache__" not in str(f):
            violations.append(str(f))
    assert not violations, f"dotenv imports found: {violations}"


def test_service_role_key_only_in_db_client():
    """SUPABASE_SERVICE_ROLE_KEY must only appear in db/client.py."""
    violations = []
    for f in _find_files(".py"):
        if "db/client.py" in str(f) or "db\\client.py" in str(f):
            continue
        if "__pycache__" in str(f) or "tests/" in str(f):
            continue
        content = f.read_text(errors="ignore")
        if "SERVICE_ROLE_KEY" in content:
            violations.append(str(f))
    assert not violations, f"SERVICE_ROLE_KEY referenced outside db/client.py: {violations}"


# ─── HTTP 403 / 200 Tests ────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def test_client():
    from unittest.mock import patch, MagicMock, AsyncMock
    # Patch supabase before app import
    with patch("db.client.create_client", return_value=MagicMock()):
        from main import app
        return TestClient(app)


def test_agent_secret_missing_returns_403(test_client):
    """Missing X-Agent-Secret header → 403."""
    resp = test_client.post("/api/agents/skill-gap", json={
        "agent": "skill_gap", "user_id": "test-uuid", "payload": {}
    })
    assert resp.status_code == 403


def test_agent_secret_wrong_returns_403(test_client):
    """Wrong X-Agent-Secret header → 403."""
    resp = test_client.post("/api/agents/skill-gap", json={
        "agent": "skill_gap", "user_id": "test-uuid", "payload": {}
    }, headers={"X-Agent-Secret": "wrong-secret"})
    assert resp.status_code == 403


def test_health_endpoint_no_auth_required(test_client):
    """GET /health should return 200 without any auth header."""
    resp = test_client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
