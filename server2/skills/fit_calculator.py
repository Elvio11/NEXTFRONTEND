"""
skills/fit_calculator.py
Step 2 of fit scoring: LLM batch scoring using Sarvam-M.

Batches 100 jobs per call. Reads model_weights from DB.
Writes scores >= 40 to job_fit_scores table.
Applies:
  - tailored_boost: dream company threshold adjustment
  - is_full_score: True for paid users
  - free users: fit_reasons/missing_skills/strengths = NULL

Never falls back to Gemini. If Sarvam-M unavailable → raises to Agent 6.
"""

import json
import math
from datetime import datetime, timezone, timedelta
from typing import Optional

from db.client import supabase
from llm.sarvam import sarvam, SarvamUnavailableError


_SCORE_PROMPT = """You are a job-fit evaluator for Indian tech roles.

Evaluate each job against the candidate profile and return a JSON array with one object per job.

Candidate profile:
- Skills: {skills}
- Experience: {exp_years} years
- Seniority: {seniority}
- Title: {current_title}

Jobs to evaluate (JSON array):
{jobs_json}

For each job, return:
{{
  "job_id": "<job_id>",
  "fit_score": <integer 0-100>,
  "fit_label": "excellent|good|fair|poor",
  "recommendation": "apply|consider|skip",
  "fit_reasons": ["reason1", "reason2"],
  "missing_skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"]
}}

Return ONLY the JSON array. No explanation. No markdown.
"""


def _load_model_weights() -> dict:
    """Load current model_weights from DB."""
    result = supabase.table("model_weights").select("weight_name, weight_value").execute()
    return {row["weight_name"]: row["weight_value"] for row in (result.data or [])}


def _chunk_list(lst: list, n: int) -> list[list]:
    """Split list into chunks of size n."""
    return [lst[i:i + n] for i in range(0, len(lst), n)]


async def score_jobs(
    user_id: str,
    jobs: list[dict],
    parsed_resume: dict,
    is_paid: bool,
    mode: str,  # "think" | "no_think"
) -> int:
    """
    Batch-score jobs using Sarvam-M. Writes scores >= 40 to job_fit_scores.
    Returns count of scores written.
    """
    weights = _load_model_weights()

    # Load dream company list for threshold adjustment
    dream_result = supabase.table("user_company_prefs").select("company_canonical").eq(
        "user_id", user_id
    ).eq("pref_type", "dream").execute()
    dream_companies = {r["company_canonical"] for r in (dream_result.data or [])}

    scores_written = 0
    batches = _chunk_list(jobs, 100)

    for batch in batches:
        jobs_for_prompt = [
            {
                "job_id":       j["id"],
                "title":        j.get("title", ""),
                "company":      j.get("company", ""),
                "role_family":  j.get("role_family", ""),
                "jd_summary":   j.get("jd_summary", "")[:300],  # cap to save tokens
            }
            for j in batch
        ]

        prompt = _SCORE_PROMPT.format(
            skills=", ".join(parsed_resume.get("top_5_skills", [])),
            exp_years=parsed_resume.get("experience_years", 0),
            seniority=parsed_resume.get("seniority_level", "mid"),
            current_title=parsed_resume.get("current_title", ""),
            jobs_json=json.dumps(jobs_for_prompt, indent=2),
        )

        raw = await sarvam.complete(prompt, mode=mode)

        # Parse JSON response
        try:
            # Strip markdown code fences if present
            clean = raw.strip().lstrip("```json").rstrip("```").strip()
            scored = json.loads(clean)
        except json.JSONDecodeError:
            continue  # skip this batch on parse failure

        now_utc = datetime.now(timezone.utc)
        expires = (now_utc + timedelta(days=14)).isoformat()

        rows_to_insert = []
        for s in scored:
            score = int(s.get("fit_score", 0))
            if score < 40:
                continue  # do not write low scores

            # Apply tailored_boost for dream companies
            company = next(
                (j.get("company_canonical", "") for j in batch if j["id"] == s["job_id"]),
                "",
            )
            if company in dream_companies:
                score = min(100, score + int(weights.get("tailored_boost", 5)))

            rows_to_insert.append({
                "user_id":         user_id,
                "job_id":          s["job_id"],
                "fit_score":       score,
                "fit_label":       s.get("fit_label", "fair"),
                "recommendation":  s.get("recommendation", "consider"),
                "fit_reasons":     s.get("fit_reasons") if is_paid else None,
                "missing_skills":  s.get("missing_skills") if is_paid else None,
                "strengths":       s.get("strengths") if is_paid else None,
                "is_full_score":   is_paid,
                "expires_at":      expires,
            })

        if rows_to_insert:
            supabase.table("job_fit_scores").upsert(
                rows_to_insert, on_conflict="user_id,job_id"
            ).execute()
            scores_written += len(rows_to_insert)

    return scores_written
