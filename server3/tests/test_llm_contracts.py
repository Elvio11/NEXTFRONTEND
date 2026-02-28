"""
tests/test_llm_contracts.py
Test Group 6: LLM Client Contracts
Validates: correct LLM assigned to each agent, Sarvam unavailable returns skipped (not Gemini),
           lazy-init (no env access at import time).
"""

import inspect
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

SERVER3_ROOT = Path(__file__).parent.parent


def test_sarvam_think_called_for_agent10():
    """Agent 10 (Resume Tailor) must use Sarvam-M Think mode."""
    import inspect
    from skills import resume_tailor
    source = inspect.getsource(resume_tailor.tailor_resume)
    assert "think" in source, "resume_tailor must call sarvam.complete with mode='think'"
    assert "gemini" not in source.lower(), "resume_tailor must NOT use Gemini"


def test_sarvam_no_think_called_for_agent13():
    """Agent 13 (Anti-Ban) must use Sarvam-M No-Think mode for fast risk checks."""
    from skills import anti_ban_checker
    source = inspect.getsource(anti_ban_checker.check_risk)
    assert "no_think" in source, "anti_ban_checker must call sarvam with mode='no_think'"


def test_gemini_flash_called_for_agent11():
    """Agent 11 (Cover Letter) must use Gemini Flash — not Sarvam-M."""
    from skills import cover_letter_writer
    source = inspect.getsource(cover_letter_writer.write_cover_letter)
    assert "gemini" in source, "cover_letter_writer must call gemini.complete"
    assert "sarvam" not in source, "cover_letter_writer must NOT use Sarvam-M"


@pytest.mark.asyncio
async def test_sarvam_unavailable_returns_skipped_not_gemini_fallback():
    """
    When Sarvam-M is unavailable, Agent 10 must return status='skipped'.
    It must NOT fall back to Gemini.
    """
    with patch("skills.resume_tailor.sarvam") as mock_sarvam, \
         patch("skills.resume_tailor._load_parsed_resume", return_value={"name": "Test", "skills": [], "work_experience": [], "education": []}):

        from llm.sarvam import SarvamUnavailableError
        mock_sarvam.complete = AsyncMock(side_effect=SarvamUnavailableError("API down"))

        with patch("agents.agent10_tailor.supabase") as mock_sb, \
             patch("agents.agent10_tailor.log_start", new_callable=AsyncMock), \
             patch("agents.agent10_tailor.log_fail", new_callable=AsyncMock):

            # Paid user
            mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
                "id": "user-1", "subscription_tier": "paid"
            }
            # Job exists
            mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
                "id": "job-1", "title": "SWE"
            }

            from agents.agent10_tailor import run_tailor
            result = await run_tailor("user-1", "job-1")
            assert result["status"] == "skipped"
            assert result.get("reason") == "sarvam_unavailable"


def test_llm_clients_lazy_init_sarvam():
    """
    Importing llm.sarvam must NOT access os.environ at import time.
    The key is only read when .complete() is called.
    """
    # Remove module from sys.modules if loaded
    for mod in list(sys.modules.keys()):
        if "llm.sarvam" in mod or mod == "llm.sarvam":
            del sys.modules[mod]

    # Import WITHOUT SARVAM_API_KEY set — must not crash
    import importlib
    with patch.dict(os.environ, {}, clear=False):
        env_backup = os.environ.pop("SARVAM_API_KEY", None)
        try:
            import llm.sarvam as sarvam_mod
            # Import SUCCEEDS — key not read at import time
            assert hasattr(sarvam_mod, "sarvam"), "sarvam singleton must exist after import"
        finally:
            if env_backup:
                os.environ["SARVAM_API_KEY"] = env_backup


def test_llm_clients_lazy_init_gemini():
    """
    Importing llm.gemini must NOT access os.environ at import time.
    """
    for mod in list(sys.modules.keys()):
        if "llm.gemini" in mod or mod == "llm.gemini":
            del sys.modules[mod]

    with patch.dict(os.environ, {}, clear=False):
        env_backup = os.environ.pop("GEMINI_API_KEY", None)
        try:
            import llm.gemini as gemini_mod
            assert hasattr(gemini_mod, "gemini")
        finally:
            if env_backup:
                os.environ["GEMINI_API_KEY"] = env_backup
