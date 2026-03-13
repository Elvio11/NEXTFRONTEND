"""
skills/cover_letter_writer.py
Cover letter generation using Gemini Flash.

Produces a 250–350 word, 3-paragraph cover letter tailored to a specific job.
Plain text output written to /storage/cover-letters/{user_id}/{job_id}.txt.

Banned phrases (enforced in prompt):
  "I am writing to express my interest", "passionate", "team player", "results-driven"

Structure: Hook → Evidence (2-3 achievements) → Confident close
Opening sentence must be unique (seeded with user_id + job_id to vary output).
"""

import json
from datetime import datetime, timezone

from llm.gemini import gemini
from skills.humanizer_prompt import HUMANIZER_GUIDELINES
from skills.storage_client import get_json_gz, put_text


# ─── Prompt Builder ────────────────────────────────────────────────────────────

def _build_cover_letter_prompt(resume: dict, job: dict, persona: str) -> str:
    # Extract top 3 achievements from experience for evidence paragraph
    achievements = []
    for exp in resume.get("work_experience", [])[:3]:
        for bullet in exp.get("bullets", [])[:2]:
            achievements.append(bullet)
            if len(achievements) >= 3:
                break
        if len(achievements) >= 3:
            break

    missing_skills = job.get("missing_skills", [])[:2]

    return f"""Write a cover letter for this job application. 250-350 words exactly. 3 paragraphs.

BANNED PHRASES (never use):
- "I am writing to express my interest"
- "passionate"
- "team player"
- "results-driven"
- "I hope this letter finds you well"

JOB:
Title:   {job.get('title', '')}
Company: {job.get('company', '')}
Required skills: {', '.join(job.get('required_skills', [])[:15])}
JD summary: {job.get('jd_summary', job.get('raw_jd', ''))[:800]}

APPLICANT PROFILE:
Name:         {resume.get('name', 'The applicant')}
Current role: {resume.get('current_title', '')}
Years exp:    {resume.get('experience_years', '')}
Top skills:   {', '.join(resume.get('skills', [])[:10])}
Persona/tone: {persona}

Top achievements to use as evidence:
{chr(10).join(f'- {a}' for a in achievements)}

Missing skills to address honestly (1-2 sentences max):
{', '.join(missing_skills) if missing_skills else 'None — full skill match'}

STRUCTURE:
Paragraph 1 (Hook): Unique opening (never start with "I"). Reference the specific role and company. Show you know what they do.
Paragraph 2 (Evidence): 2-3 specific achievements from the resume. Use numbers where available.
Paragraph 3 (Close): Confident but not arrogant. Clear next-step ask. No "I look forward to hearing from you" clichés.

Output ONLY the cover letter text. No subject line. No "Dear Hiring Manager" — start directly with the hook paragraph.

{HUMANIZER_GUIDELINES}"""


# ─── Main Entry ────────────────────────────────────────────────────────────────

async def write_cover_letter(user_id: str, job: dict, persona: str = "professional") -> str:
    """
    Generate a cover letter for the user and save to FluxShare.

    Args:
        user_id: User UUID
        job: dict with keys: id, title, company, required_skills, jd_summary, missing_skills
        persona: user's AI persona tone (confident / narrative / technical / etc.)

    Returns:
        Storage path: /storage/cover-letters/{user_id}/{job_id}.txt

    Raises:
        RuntimeError: if Gemini fails (caller catches and returns skipped)
        FileNotFoundError: if parsed resume missing from FluxShare
    """
    job_id = str(job.get("id", "unknown"))

    try:
        resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
    except Exception as exc:
        raise FileNotFoundError(f"Parsed resume not found: {exc}")

    prompt  = _build_cover_letter_prompt(resume, job, persona)
    letter  = await gemini.complete(prompt, mode="flash")

    output_path = f"cover-letters/{user_id}/{job_id}.txt"
    await put_text(output_path, letter.strip())

    return output_path
