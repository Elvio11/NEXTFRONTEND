"""
tests/test_session_security.py
Test Group 3: Session Security
Validates: session_encrypted never in logs or responses, decrypt/del lifecycle,
           driver.quit always in finally, screenshots on exception saved to /storage/.
"""

import ast
import inspect
import os
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

SERVER3_ROOT = Path(__file__).parent.parent


# ── Session In Logs ────────────────────────────────────────────────────────────

def test_session_encrypted_not_in_any_log_call():
    """No file should log or print 'session_encrypted' values."""
    result_files = []
    for py_file in SERVER3_ROOT.rglob("*.py"):
        content = py_file.read_text(errors="replace")
        if "session_encrypted" in content and "log" in content.lower():
            # Check if it's logging the value (not just referencing key name)
            if any(f"log" in line and "session_encrypted" in line and "NEVER" not in line
                   for line in content.splitlines()):
                result_files.append(str(py_file))
    # agent_logger and session_manager may reference the column name in comments — OK
    # but it must never be passed as a value to log functions
    assert not result_files, f"session_encrypted may be logged in: {result_files}"


def test_session_encrypted_not_in_api_response_schema():
    """Router response models must not include session_encrypted field."""
    for router_file in (SERVER3_ROOT / "routers").rglob("*.py"):
        content = router_file.read_text()
        assert "session_encrypted" not in content, \
            f"session_encrypted referenced in router response: {router_file}"


def test_decrypt_session_uses_doppler_key():
    """session_manager.decrypt_session must read SESSION_KEY from os.environ[...], not os.getenv."""
    sm_file = SERVER3_ROOT / "skills" / "session_manager.py"
    content = sm_file.read_text()
    assert 'os.environ["SESSION_KEY"]' in content, \
        "SESSION_KEY must use os.environ[...] not os.getenv"
    assert "os.getenv" not in content or "SESSION_KEY" not in content, \
        "SESSION_KEY must not use os.getenv (no default)"


def test_decrypt_returns_dict():
    """decrypt_session should return a dict from valid AES-CBC input."""
    import base64, json
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend

    # Build a valid encrypted blob to test with
    test_key    = bytes.fromhex("0" * 64)  # 32 zero bytes
    test_data   = {"cookies": [{"name": "li_at", "value": "test"}]}
    plaintext   = json.dumps(test_data).encode()
    pad_len     = 16 - (len(plaintext) % 16)
    padded      = plaintext + bytes([pad_len] * pad_len)
    iv          = bytes(16)  # zero IV for test
    cipher      = Cipher(algorithms.AES(test_key), modes.CBC(iv), backend=default_backend())
    enc         = cipher.encryptor()
    ciphertext  = enc.update(padded) + enc.finalize()
    encoded     = base64.b64encode(iv + ciphertext).decode()

    with patch.dict(os.environ, {"SESSION_KEY": "0" * 64}):
        from skills.session_manager import decrypt_session
        result = decrypt_session(encoded)
        assert isinstance(result, dict)
        assert "cookies" in result


def test_del_called_after_session_use_in_agent12():
    """agent12 must del session_data after injecting cookies — check source code."""
    agent12_src = (SERVER3_ROOT / "agents" / "agent12_applier.py").read_text()
    assert "del session_data" in agent12_src, \
        "agent12_applier.py must del session_data after cookie injection"


def test_driver_quit_in_browser_pool_finally():
    """browser_pool context manager must call release_driver in finally block."""
    bp_src = (SERVER3_ROOT / "skills" / "browser_pool.py").read_text()
    assert "finally:" in bp_src, "browser_pool.py must have a finally block"
    assert "release_driver" in bp_src or "driver.quit()" in bp_src, \
        "driver.quit()/release_driver must be in finally block"


def test_screenshot_saved_on_selenium_exception():
    """apply_engine must save screenshot on exception."""
    ae_src = (SERVER3_ROOT / "skills" / "apply_engine.py").read_text()
    assert "_save_screenshot" in ae_src, \
        "apply_engine must call _save_screenshot in exception handlers"
    assert "except Exception" in ae_src, \
        "apply_engine must catch Exception and save screenshot"


def test_screenshot_path_starts_with_storage():
    """All screenshot paths must use /storage/ — never local /tmp/ or relative paths."""
    ae_src = (SERVER3_ROOT / "skills" / "apply_engine.py").read_text()
    assert "/storage/screenshots/" in ae_src, \
        "Screenshot paths must use /storage/screenshots/ (FluxShare)"
    assert "/tmp/" not in ae_src, \
        "Screenshot paths must NOT use /tmp/"
