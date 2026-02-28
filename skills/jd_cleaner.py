"""
skills/jd_cleaner.py
Cleans raw JD text using Gemini Flash Lite.

Strips HTML boilerplate, extracts required_skills[], nice_to_have_skills[],
classifies role_family, generates 2-3 sentence jd_summary.

Used ONLY by Agent 7. Gemini Flash Lite is appropriate here (extraction task).
Do NOT use this pattern for fit scoring or resume tailoring — those require Sarvam-M.
"""

import json

from llm.gemini import gemini


_CLEAN_PROMPT = """You are a JD cleaning and classification specialist.

Clean the raw job description below. Extract structured data and classify the role.

Raw JD:
\"\"\"
{raw_jd}
\"\"\"

Return ONLY a JSON object with these fields:
{{
  "required_skills": ["skill1", "skill2", ...],
  "nice_to_have_skills": ["skill1", ...],
  "role_family": "<one of: swe_backend, swe_frontend, swe_fullstack, data_scientist, data_engineer, ml_engineer, devops, cloud_engineer, product_manager, designer, qa_engineer, mobile_dev, solutions_architect, engineering_manager, other>",
  "jd_summary": "<2-3 sentence plain text summary of the role>"
}}

Rules:
- required_skills: only clearly stated as required/mandatory
- nice_to_have_skills: stated as preferred/nice-to-have/bonus
- role_family: pick the SINGLE best fit from the list above
- jd_summary: no HTML, no brand language, factual and concise
- Return ONLY JSON, no markdown, no explanation"""


async def clean_jd(raw_jd: str) -> dict:
    """
    Call Gemini Flash Lite to clean and structure a raw JD.
    Returns dict with required_skills, nice_to_have_skills, role_family, jd_summary.
    Returns empty dict on failure (caller skips this job).
    """
    if not raw_jd or len(raw_jd.strip()) < 50:
        return {}

    # Truncate to avoid token overflow (Gemini Flash Lite has lower context)
    prompt = _CLEAN_PROMPT.format(raw_jd=raw_jd[:4000])

    try:
        raw = await gemini.complete(prompt, mode="flash_lite")
        clean = raw.strip().lstrip("```json").rstrip("```").strip()
        result = json.loads(clean)
        return result
    except (json.JSONDecodeError, RuntimeError):
        return {}
