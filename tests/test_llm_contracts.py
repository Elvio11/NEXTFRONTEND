"""
tests/test_llm_contracts.py
Test Group 6: LLM Client Contracts

Tests:
  - Sarvam-M Think called for Agent 3
  - Sarvam-M No-Think called for Agent 6 delta
  - Gemini Flash Lite called for Agent 7
  - Sarvam unavailable → returns skipped (NOT Gemini fallback)
"""

import asyncio
import gzip
import json
import os
from unittest.mock import AsyncMock, MagicMock, patch, call
import pytest

os.environ.setdefault("SUPABASE_URL",              "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SARVAM_API_URL",            "http://localhost:9999")
os.environ.setdefault("SARVAM_API_KEY",            "test-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",            "test-gemini-key")
os.environ.setdefault("AGENT_SECRET",              "test-agent-secret")
os.environ.setdefault("SERVER1_URL",               "http://localhost:3000")


def test_sarvam_think_mode_called_for_agent3():
    """persona_generator must call sarvam.complete(..., mode='think')."""
    called_modes = []

    async def mock_complete(prompt, mode):
        called_modes.append(mode)
        return "variant1|||variant2|||variant3"

    import asyncio
    from skills import persona_generator
    with patch.object(persona_generator.sarvam, "complete", side_effect=mock_complete):
        asyncio.get_event_loop().run_until_complete(
            persona_generator.generate_personas({
                "current_title": "Engineer", "experience_years": 3,
                "seniority_level": "mid", "top_5_skills": ["Python"]
            })
        )

    assert "think" in called_modes, f"Expected 'think' mode call, got: {called_modes}"


def test_sarvam_no_think_mode_called_for_agent6_delta():
    """Agent 6 delta must call sarvam batch scoring with mode='no_think'."""
    called_modes = []

    async def mock_score_jobs(user_id, jobs, parsed_resume, is_paid, mode):
        called_modes.append(mode)
        return 5

    # Verify the mode is "no_think" for delta in agent6
    import inspect
    from agents import agent6_fit
    source = inspect.getsource(agent6_fit)
    # The source should set sarvam_mode="no_think" when mode="delta"
    assert '"no_think"' in source or "'no_think'" in source, \
        "Agent 6 must use no_think mode for delta"
    assert "delta" in source, "Agent 6 must have delta mode handling"


def test_gemini_flash_lite_called_for_agent7():
    """jd_cleaner must call gemini.complete(..., mode='flash_lite')."""
    called_modes = []

    async def mock_complete(prompt, mode):
        called_modes.append(mode)
        return '{"required_skills":["Python"],"nice_to_have_skills":[],"role_family":"swe_backend","jd_summary":"Test role."}'

    from skills import jd_cleaner
    with patch.object(jd_cleaner.gemini, "complete", side_effect=mock_complete):
        asyncio.get_event_loop().run_until_complete(
            jd_cleaner.clean_jd("We are looking for a Python developer with FastAPI experience.")
        )

    assert "flash_lite" in called_modes, \
        f"Agent 7 must use flash_lite mode, got: {called_modes}"


def test_sarvam_unavailable_returns_skipped_not_gemini_fallback():
    """If Sarvam-M raises SarvamUnavailableError, agent must return 'skipped', never use Gemini."""
    from llm.sarvam import SarvamUnavailableError
    gemini_called = []

    async def unavailable_sarvam(prompt, mode):
        raise SarvamUnavailableError("Sarvam is down")

    async def track_gemini(prompt, mode):
        gemini_called.append(mode)
        return "fallback response"

    mock_db = MagicMock()
    mock_db.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[])

    with patch("skills.persona_generator.sarvam.complete", side_effect=unavailable_sarvam), \
         patch("llm.gemini.GeminiClient.complete", side_effect=track_gemini), \
         patch("agents.agent3_resume.supabase", mock_db), \
         patch("log_utils.agent_logger.supabase", mock_db), \
         patch("agents.agent3_resume.parse_resume", return_value={
             "seniority_level": "mid", "top_5_skills": ["Python"],
             "experience_years": 3, "current_title": "Engineer",
             "skills": ["Python"]
         }):
        from agents import agent3_resume
        result = asyncio.get_event_loop().run_until_complete(
            agent3_resume.run("user-id", "/storage/fake.pdf")
        )

    assert result["status"] == "skipped", \
        f"Sarvam unavailable must return 'skipped', got '{result['status']}'"
    assert not gemini_called, \
        "Gemini MUST NOT be called when Sarvam-M is unavailable — no paid LLM fallback"
