"""
skills/persona_generator.py
Generates 3 × ~200-word AI persona variants using Sarvam-M Think.

Variants:
  confident  — assertive, achievement-focused
  narrative  — story-driven, contextual progression
  technical  — skills-forward, spec-heavy

Called by Agent 3 after resume parsing.
Never falls back to Gemini if Sarvam-M unavailable.
"""

import json
from typing import Optional

from llm.sarvam import sarvam, SarvamUnavailableError


_PERSONA_PROMPT_TEMPLATE = """You are a professional career writer.

Based on the following resume data, generate exactly 3 distinct 200-word professional persona statements for a job seeker.

Resume data:
- Current title: {current_title}
- Experience: {exp_years} years
- Seniority: {seniority}
- Top skills: {skills}

Generate exactly 3 variants:
1. CONFIDENT: Assertive, achievement-focused, leadership tone
2. NARRATIVE: Story-driven, shows career progression and motivation
3. TECHNICAL: Skills-forward, depth-focused, spec-heavy

Each variant must be exactly around 200 words. No headers. Separate variants with the delimiter: |||

Output format (no extra text):
<confident variant>|||<narrative variant>|||<technical variant>"""


async def generate_personas(parsed_resume: dict) -> list[str]:
    """
    Returns a list of exactly 3 persona strings (~200 words each).
    Raises SarvamUnavailableError if Sarvam-M cannot be reached.
    """
    prompt = _PERSONA_PROMPT_TEMPLATE.format(
        current_title=parsed_resume.get("current_title", "Software Engineer"),
        exp_years=parsed_resume.get("experience_years", 0),
        seniority=parsed_resume.get("seniority_level", "mid"),
        skills=", ".join(parsed_resume.get("top_5_skills", [])),
    )

    raw = await sarvam.complete(prompt, mode="think")

    # Split on delimiter
    parts = [p.strip() for p in raw.split("|||")]

    if len(parts) >= 3:
        return parts[:3]

    # Fallback: if model didn't use delimiter, split by double newline
    fallback = [p.strip() for p in raw.split("\n\n") if len(p.strip()) > 50]
    if len(fallback) >= 3:
        return fallback[:3]

    # Last resort: pad with variants of the same text
    while len(parts) < 3:
        parts.append(parts[0] if parts else raw)
    return parts[:3]
