"""
skills/skill_gap_analyzer.py
Identifies top skill gaps between the user's profile and the current job market.

Step 1: SQL skill frequency query from job_skills table (no LLM)
Step 2: Sarvam-M Think ROI ranking of top 10 gaps
Step 3: Returns top 3 for DB + full list for FluxShare report

Output written to /storage/skill-gaps/{user_id}.json.gz
"""

import gzip
import json
import os
from datetime import datetime, timezone, timedelta

from db.client import supabase
from llm.sarvam import sarvam, SarvamUnavailableError


STORAGE_PATH = "/storage/skill-gaps"

_ROI_PROMPT = """You are a career coach specialising in the Indian tech job market.

The job seeker has these skills: {user_skills}
Experience: {exp_years} years, Seniority: {seniority}

Missing skills ranked by market demand frequency:
{gaps_list}

Rank the TOP 10 missing skills by ROI for this specific candidate.
For each, provide:
- est_hours: estimated hours to reach working proficiency
- 1 free resource (YouTube/official docs) and 1 paid resource (Udemy/Coursera)
- salary_uplift: estimated LPA salary increase (range)

Return ONLY a JSON array:
[{{"skill": "...", "importance_pct": 67, "roi_rank": 1, "est_hours": 30, "salary_uplift": "1-2 LPA",
   "courses": ["Free: ...", "Paid: ..."]}}]
"""


async def analyze_skill_gaps(
    user_id: str,
    parsed_resume: dict,
) -> dict:
    """
    Compute skill gaps, write gzip report, return top_gaps (top 3).
    Raises SarvamUnavailableError if Sarvam-M unavailable.
    """
    user_skill_set = {s.lower() for s in parsed_resume.get("skills", [])}

    # Fetch user's target role families
    role_result = supabase.table("user_target_roles").select("role_family").eq(
        "user_id", user_id
    ).execute()
    role_families = [r["role_family"] for r in (role_result.data or [])]

    if not role_families:
        return {"top_gaps": [], "full_gaps": []}

    # SQL skill frequency query
    freq_result = (
        supabase.table("job_skills")
        .select("skill_name, skill_type")
        .in_("jobs.role_family", role_families)   # joined via FK
        .execute()
    )
    all_market_skills = freq_result.data or []

    # Count frequency of each skill
    freq_map: dict[str, int] = {}
    for row in all_market_skills:
        skill = row["skill_name"].lower()
        freq_map[skill] = freq_map.get(skill, 0) + 1

    total_jobs = max(len(all_market_skills), 1)

    # Identify gaps: skills in market not in user profile
    gaps = [
        {
            "skill":          skill,
            "importance_pct": round((count / total_jobs) * 100),
        }
        for skill, count in sorted(freq_map.items(), key=lambda x: -x[1])
        if skill not in user_skill_set
    ][:20]  # cap at 20 for prompt

    if not gaps:
        return {"top_gaps": [], "full_gaps": []}

    gaps_list = "\n".join(
        f"{i+1}. {g['skill']} ({g['importance_pct']}% of jobs)"
        for i, g in enumerate(gaps)
    )

    prompt = _ROI_PROMPT.format(
        user_skills=", ".join(parsed_resume.get("top_5_skills", [])),
        exp_years=parsed_resume.get("experience_years", 0),
        seniority=parsed_resume.get("seniority_level", "mid"),
        gaps_list=gaps_list,
    )

    raw = await sarvam.complete(prompt, mode="think")

    try:
        clean = raw.strip().lstrip("```json").rstrip("```").strip()
        full_gaps = json.loads(clean)
    except json.JSONDecodeError:
        # Fallback: return raw gap list without LLM enrichment
        full_gaps = [
            {"skill": g["skill"], "importance_pct": g["importance_pct"], "roi_rank": i + 1,
             "est_hours": 20, "courses": ["Free: Search YouTube", "Paid: Udemy"]}
            for i, g in enumerate(gaps[:10])
        ]

    top_gaps = full_gaps[:3]

    # Write full report to FluxShare
    os.makedirs(STORAGE_PATH, exist_ok=True)
    out_path = f"{STORAGE_PATH}/{user_id}.json.gz"
    with gzip.open(out_path, "wt", encoding="utf-8") as f:
        json.dump({"user_id": user_id, "full_gaps": full_gaps}, f)

    return {"top_gaps": top_gaps, "full_gaps": full_gaps}
