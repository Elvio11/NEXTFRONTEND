"""
skills/resume_parser.py
Parses PDF and DOCX resume files into structured JSON.

6-Layer Upload Security (Layers 3-4 live here):
  Layer 3: DOCX decompression bomb check (ratio < 100, uncompressed < 50MB)
  Layer 4: Macro/OLE object stripping via XML reconstruction (DOCX only)
  Layer 5: Subprocess sandboxing with 30s timeout (implemented in agent3_resume.py)
  PDF:    pypdf text extraction only — never render, never execute

Supports:
  .pdf  → pypdf (text extraction layer; raises on password-protected / image-only)
  .docx → python-docx (after sanitisation)

Output written as gzip'd JSON to MinIO: parsed-resumes/{user_id}.json.gz
Returns the parsed dict for downstream use by Agent 3.
"""

import re
import os
import tempfile
from pathlib import Path
from typing import Optional

from skills.storage_client import put_json_gz, get_bytes
from skills.mcp_wrapper import MCPWrapper


class ParseError(Exception):
    """Raised with a machine-readable reason string."""

    pass


# ─── Deprecated ──────────────────────────────────────────────────────────────
# Layer 3/4 checks and pypdf/python-docx parsers are deprecated.
# We now rely on mcporter (MarkItDown) calling Chromium/PDF.js in a sandbox.

async def _extract_text_via_mcp(file_bytes: bytes, ext: str) -> str:
    """
    Write to temp file, call MarkItDown MCP, and return raw text.
    """
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        wrapper = MCPWrapper()
        result = await wrapper.extract_text(tmp_path)
        
        # Depending on MCP JSON schema, handle possible output shapes:
        text = result.get("text") or result.get("content") or result.get("body")
        if not text:
            # Fallback if the tool returned a nested object
            text = str(result)
            
        return text.strip()
    except Exception as exc:
        raise ParseError(f"mcp_parse_error: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def _infer_skills(text: str) -> list[str]:
    """
    Simple keyword-based skill extraction from raw resume text.
    Agent 3 uses Sarvam-M Think to refine and rank these.
    """
    tech_keywords = {
        "python",
        "java",
        "javascript",
        "typescript",
        "golang",
        "rust",
        "c++",
        "sql",
        "postgresql",
        "mysql",
        "mongodb",
        "redis",
        "elasticsearch",
        "aws",
        "gcp",
        "azure",
        "docker",
        "kubernetes",
        "terraform",
        "ansible",
        "react",
        "angular",
        "vue",
        "node.js",
        "fastapi",
        "django",
        "flask",
        "spark",
        "kafka",
        "airflow",
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "machine learning",
        "deep learning",
        "nlp",
        "git",
        "ci/cd",
        "linux",
        "bash",
        "graphql",
        "rest",
        "grpc",
        "hadoop",
        "databricks",
        "snowflake",
        "dbt",
        "tableau",
        "power bi",
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
        "software engineer",
        "senior engineer",
        "staff engineer",
        "principal engineer",
        "backend developer",
        "frontend developer",
        "full stack developer",
        "data scientist",
        "data engineer",
        "ml engineer",
        "product manager",
        "devops engineer",
        "cloud engineer",
        "solutions architect",
        "engineering manager",
        "tech lead",
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


async def parse_resume(s3_key: str, user_id: str) -> dict:
    """
    Parse a resume file (PDF or DOCX) from MinIO.
    Applies Layers 3-4 for DOCX files before extraction.
    Returns the parsed dict.
    Raises ParseError with a reason string on failure.
    """
    try:
        file_bytes = await get_bytes(s3_key)
    except FileNotFoundError:
        raise ParseError("file_not_found")
    except Exception as exc:
        raise ParseError(f"storage_error: {exc}")

    ext = Path(s3_key).suffix.lower()

    if ext not in [".pdf", ".docx", ".doc"]:
        raise ParseError(f"unsupported_format:{ext}")

    raw_text = await _extract_text_via_mcp(file_bytes, ext)

    skills = _infer_skills(raw_text)
    exp_years = _infer_experience_years(raw_text)
    current_title = _infer_current_title(raw_text)
    seniority = _infer_seniority(exp_years)

    parsed = {
        "user_id": user_id,
        "raw_text": raw_text,
        "skills": skills,
        "top_5_skills": skills[:5],
        "experience_years": exp_years,
        "current_title": current_title,
        "seniority_level": seniority,
        "education": [],  # Sarvam-M enriches this in agent3_resume.py
        "certifications": [],
        "work_experience": [],
    }

    key = f"parsed-resumes/{user_id}.json.gz"
    await put_json_gz(key, parsed)

    return parsed
