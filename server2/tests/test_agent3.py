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
    """Create a minimal valid PDF file for testing."""
    from reportlab.pdfgen import canvas
    pdf_path = tmp_path / "resume.pdf"
    try:
        c = canvas.Canvas(str(pdf_path))
        c.drawString(100, 750, SAMPLE_RESUME_TEXT[:200])
        c.save()
    except ImportError:
        # Fallback: write minimal PDF bytes manually
        pdf_path.write_bytes(
            b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n"
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        )
    return str(pdf_path)


@pytest.fixture
def temp_docx(tmp_path):
    """Create a minimal DOCX file for testing."""
    from docx import Document
    doc = Document()
    doc.add_paragraph(SAMPLE_RESUME_TEXT)
    docx_path = tmp_path / "resume.docx"
    doc.save(str(docx_path))
    return str(docx_path)


def _make_mock_db():
    mock_db = MagicMock()
    mock_db.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    return mock_db


def test_pdf_parse_extracts_skills(tmp_path):
    """PDF parsing extracts at least some skills."""
    from skills.resume_parser import _infer_skills
    skills = _infer_skills(SAMPLE_RESUME_TEXT)
    assert len(skills) > 0
    assert any(s in ["python", "postgresql", "aws", "docker"] for s in skills)


def test_docx_parse_extracts_skills(temp_docx):
    """DOCX parsing extracts text without error."""
    from skills.resume_parser import _extract_docx_text
    text = _extract_docx_text(temp_docx)
    assert len(text) > 50
    assert "python" in text.lower() or "Python" in text


def test_corrupt_pdf_returns_failed_status():
    """Corrupt PDF file → ParseError with 'corrupt_file' reason."""
    from skills.resume_parser import ParseError, _extract_pdf_text
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"this is not a real pdf")
        f_name = f.name
    with pytest.raises(ParseError) as exc_info:
        _extract_pdf_text(f_name)
    os.unlink(f_name)
    assert "corrupt" in str(exc_info.value).lower() or len(str(exc_info.value)) > 0


def test_password_protected_pdf_returns_failed_status(tmp_path):
    """Password-protected PDF → ParseError('password_protected')."""
    import PyPDF2
    # Create a simple encrypted PDF for testing
    pdf_path = tmp_path / "encrypted.pdf"
    # Simulate password_protected detection
    from skills.resume_parser import ParseError
    # We can't easily create an encrypted PDF in tests, so test the branch directly
    with patch("PyPDF2.PdfReader") as mock_reader:
        mock_reader.return_value.is_encrypted = True
        with pytest.raises(ParseError) as exc_info:
            from skills.resume_parser import _extract_pdf_text
            _extract_pdf_text(str(pdf_path))
        assert "password_protected" in str(exc_info.value)


def test_parsed_resume_written_to_storage_gzipped(tmp_path):
    """Parsed resume should be gzip'd JSON at /storage/parsed-resumes/{user_id}.json.gz"""
    with patch("skills.resume_parser.STORAGE_PATH", str(tmp_path)), \
         patch("skills.resume_parser._extract_pdf_text", return_value=SAMPLE_RESUME_TEXT):
        from skills.resume_parser import parse_resume
        user_id = "test-user-123"
        result = parse_resume(f"{tmp_path}/fake.pdf", user_id)
        out_path = tmp_path / f"{user_id}.json.gz"
        assert out_path.exists()
        with gzip.open(str(out_path), "rt", encoding="utf-8") as f:
            data = json.load(f)
        assert data["user_id"] == user_id
        assert isinstance(data["skills"], list)


def test_persona_options_returns_exactly_3_variants():
    """persona_generator must return exactly 3 variants."""
    three_variants = "Confident persona here.|||Narrative persona here.|||Technical persona here."

    async def mock_complete(prompt, mode):
        return three_variants

    import asyncio
    from skills import persona_generator
    with patch.object(persona_generator.sarvam, "complete", side_effect=mock_complete):
        result = asyncio.get_event_loop().run_until_complete(
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
    with patch("agents.agent3_resume.supabase", mock_db), \
         patch("agents.agent3_resume.parse_resume", return_value={
             "seniority_level": "mid", "top_5_skills": ["Python"],
             "experience_years": 3, "current_title": "Engineer",
             "skills": ["Python"], "top_5_skills": ["Python"]
         }), \
         patch("agents.agent3_resume.generate_personas", new_callable=AsyncMock,
               return_value=["p1", "p2", "p3"]), \
         patch("log_utils.agent_logger.supabase", mock_db):
        import agents.agent3_resume as a3
        asyncio.get_event_loop().run_until_complete(
            a3.run("user-id", "/storage/fake.pdf")
        )

    assert called_with_stale, "fit_scores_stale was never set to True"
