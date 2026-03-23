"""
tests/test_agent3.py
Test Group 2: Agent 3 — Resume Intelligence

Tests: PDF/DOCX parse, error handling, storage write, DB flags, personas.
Uses mocked Sarvam-M to avoid network calls.
"""

import gzip
import json
import os
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Set env vars before imports
os.environ.setdefault("SUPABASE_URL",              "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SARVAM_API_URL",            "http://localhost:9999")
os.environ.setdefault("SARVAM_API_KEY",            "test-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",            "test-gemini-key")
os.environ.setdefault("AGENT_SECRET",              "test-agent-secret")
os.environ.setdefault("SERVER1_URL",               "http://localhost:3000")


SAMPLE_RESUME_TEXT = """
John Doe
Senior Software Engineer — 5 years experience

Skills: Python, FastAPI, PostgreSQL, AWS, Docker, Kubernetes

Work Experience:
2019-2024: Backend Engineer at TechCorp
  - Built microservices with Python and FastAPI
  - Managed PostgreSQL databases at scale
  - Deployed containerized services on AWS ECS

Education: B.Tech Computer Science, IIT Bombay, 2019
"""


@pytest.fixture
def temp_pdf(tmp_path):
    """Create a dummy PDF file path."""
    pdf_path = tmp_path / "resume.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 dummy content")
    return str(pdf_path)


@pytest.fixture
def temp_docx(tmp_path):
    """Create a dummy DOCX file path."""
    docx_path = tmp_path / "resume.docx"
    docx_path.write_bytes(b"dummy docx content")
    return str(docx_path)


def _make_mock_db():
    mock_db = MagicMock()
    mock_db.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data={"tier": "free"})
    return mock_db


def test_infer_skills():
    """Skill extraction logic works on raw text."""
    from skills.resume_parser import _infer_skills
    skills = _infer_skills(SAMPLE_RESUME_TEXT)
    assert len(skills) > 0
    assert any(s in ["python", "postgresql", "aws", "docker"] for s in skills)


def test_parse_resume_flow_mcp():
    """Full parse flow mocks the MCP call and storage."""
    user_id = "test-user-123"

    with patch("skills.resume_parser.get_bytes", new_callable=AsyncMock, return_value=b"dummy bytes"), \
         patch("skills.resume_parser._extract_text_via_mcp", new_callable=AsyncMock, return_value=SAMPLE_RESUME_TEXT), \
         patch("skills.resume_parser.put_json_gz", new_callable=AsyncMock) as mock_put:

        from skills.resume_parser import parse_resume
        import asyncio
        result = asyncio.run(parse_resume("resumes/test.pdf", user_id))
        
        assert result["user_id"] == user_id
        assert "python" in [s.lower() for s in result["skills"]]
        assert mock_put.called


def test_persona_options_returns_exactly_3_variants():
    """persona_generator must return exactly 3 variants."""
    three_variants = "Confident persona here.|||Narrative persona here.|||Technical persona here."

    import asyncio
    from skills import persona_generator
    with patch.object(persona_generator.sarvam, "complete", new_callable=AsyncMock, return_value=three_variants):
        result = asyncio.run(
            persona_generator.generate_personas({
                "current_title": "Engineer", "experience_years": 3,
                "seniority_level": "mid", "top_5_skills": ["Python"]
            })
        )
    assert len(result) == 3


def test_fit_scores_stale_set_true_after_parse():
    """Agent 3 must set users.fit_scores_stale = TRUE after successful parse."""
    mock_db = _make_mock_db()
    called_with_stale = []

    def track_update(*args, **kwargs):
        m = MagicMock()
        m.eq.return_value.execute.return_value = MagicMock(data=[])
        if args and isinstance(args[0], dict) and args[0].get("fit_scores_stale") is True:
            called_with_stale.append(True)
        return m

    mock_db.table.return_value.update.side_effect = track_update

    import asyncio
    with patch("agents.agent3_resume.get_supabase", return_value=mock_db), \
         patch("agents.agent3_resume._parse_in_sandbox", new_callable=AsyncMock, return_value={
             "seniority_level": "mid", "top_5_skills": ["Python"],
             "experience_years": 3, "current_title": "Engineer",
             "skills": ["Python"], "raw_text": "dummy"
         }), \
         patch("agents.agent3_resume.generate_personas", new_callable=AsyncMock,
               return_value=["p1", "p2", "p3"]), \
         patch("agents.agent3_resume.put_json_gz", new_callable=AsyncMock), \
         patch("agents.agent3_resume.store_resume_embedding", new_callable=AsyncMock), \
         patch("agents.agent3_resume.delete_from_minio", new_callable=AsyncMock), \
         patch("log_utils.agent_logger.get_supabase", return_value=mock_db):

        import agents.agent3_resume as a3
        asyncio.run(a3.run("user-id", "fake.pdf"))

    assert called_with_stale, "fit_scores_stale was never set to True"
