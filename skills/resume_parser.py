"""
skills/resume_parser.py
Parses PDF and DOCX resume files into structured JSON.

Supports:
  .pdf  → PyPDF2 (text extraction layer; raises on password-protected / image-only)
  .docx → python-docx

Output written as gzip'd JSON to /storage/parsed-resumes/{user_id}.json.gz
Returns the parsed dict for downstream use by Agent 3.
"""

import re
import io
from pathlib import Path
from typing import Optional

import PyPDF2
from docx import Document

from skills.storage_client import put_json_gz, get_bytes


class ParseError(Exception):
    """Raised with a machine-readable reason string."""
    pass


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        f = io.BytesIO(file_bytes)
        reader = PyPDF2.PdfReader(f)
        if reader.is_encrypted:
            raise ParseError("password_protected")
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages).strip()
        if not text:
            raise ParseError("no_text_content")
        return text
    except ParseError:
        raise
    except Exception as exc:
        raise ParseError(f"corrupt_file: {exc}") from exc


def _extract_docx_text(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes."""
    try:
        f = io.BytesIO(file_bytes)
        doc = Document(f)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as exc:
        raise ParseError(f"corrupt_file: {exc}") from exc


def _infer_skills(text: str) -> list[str]:
    """
    Simple keyword-based skill extraction from raw resume text.
    Agent 3 uses Sarvam-M Think to refine and rank these.
    """
    tech_keywords = {
        "python", "java", "javascript", "typescript", "golang", "rust", "c++",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
        "react", "angular", "vue", "node.js", "fastapi", "django", "flask",
        "spark", "kafka", "airflow", "pandas", "numpy", "scikit-learn",
        "tensorflow", "pytorch", "machine learning", "deep learning", "nlp",
        "git", "ci/cd", "linux", "bash", "graphql", "rest", "grpc",
        "hadoop", "databricks", "snowflake", "dbt", "tableau", "power bi",
    }
    text_lower = text.lower()
    found = [kw for kw in tech_keywords if kw in text_lower]
    return found[:20]  # cap at 20 to avoid token bloat in Sarvam prompt


def _infer_experience_years(text: str) -> int:
    """Extract years of experience from resume text (best-effort heuristic)."""
    patterns = [
        r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
        r"experience\s+of\s+(\d+)\+?\s*years?",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    # Count date ranges as fallback
    years = re.findall(r"\b(20[0-2]\d)\b", text)
    if len(years) >= 2:
        years_int = sorted(map(int, years))
        return max(0, years_int[-1] - years_int[0])
    return 0


def _infer_current_title(text: str) -> str:
    """Extract likely current job title from top of resume."""
    common_titles = [
        "software engineer", "senior engineer", "staff engineer", "principal engineer",
        "backend developer", "frontend developer", "full stack developer",
        "data scientist", "data engineer", "ml engineer", "product manager",
        "devops engineer", "cloud engineer", "solutions architect",
        "engineering manager", "tech lead",
    ]
    text_lower = text.lower()
    for title in common_titles:
        if title in text_lower:
            return title.title()
    return "Software Engineer"  # safe fallback


def _infer_seniority(exp_years: int) -> str:
    if exp_years < 1:
        return "entry"
    if exp_years < 3:
        return "junior"
    if exp_years < 6:
        return "mid"
    if exp_years < 10:
        return "senior"
    return "lead"


# ─── Public API ──────────────────────────────────────────────────────────────

async def parse_resume(storage_key: str, user_id: str) -> dict:
    """
    Parse a resume file (PDF or DOCX) from MinIO.
    Returns the parsed dict.
    Raises ParseError with a reason string on failure.
    """
    try:
        file_bytes = await get_bytes(storage_key)
    except FileNotFoundError:
        raise ParseError("file_not_found")
    except Exception as exc:
        raise ParseError(f"storage_error: {exc}")

    ext = Path(storage_key).suffix.lower()

    if ext == ".pdf":
        raw_text = _extract_pdf_text(file_bytes)
    elif ext in (".docx", ".doc"):
        raw_text = _extract_docx_text(file_bytes)
    else:
        raise ParseError(f"unsupported_format:{ext}")

    skills = _infer_skills(raw_text)
    exp_years = _infer_experience_years(raw_text)
    current_title = _infer_current_title(raw_text)
    seniority = _infer_seniority(exp_years)

    parsed = {
        "user_id":        user_id,
        "raw_text":       raw_text,
        "skills":         skills,
        "top_5_skills":   skills[:5],
        "experience_years": exp_years,
        "current_title":  current_title,
        "seniority_level": seniority,
        "education":      [],        # Sarvam-M enriches this in agent3_resume.py
        "certifications": [],
        "work_experience": [],
    }

    key = f"parsed-resumes/{user_id}.json.gz"
    await put_json_gz(key, parsed)

    return parsed
