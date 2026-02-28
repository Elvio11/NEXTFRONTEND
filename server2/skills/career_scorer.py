"""
skills/career_scorer.py
4-dimension career scoring (0–100 total).

Weights:
  Skills match   30%   user_skills ∩ market_skills / market_skills
  Experience     25%   years vs avg required for role family
  Market demand  25%   active job count for user's role/city
  Salary         20%   salary percentile rank from salary_analyzer

All SQL — no LLM calls.
"""

from db.client import supabase
from skills.salary_analyzer import get_salary_percentiles, get_salary_percentile_rank


async def compute_career_score(
    user_id: str,
    parsed_resume: dict,
    user_profile: dict,
) -> dict:
    """
    Compute 4-dimension career score.
    Returns dict with career_score and score_components.
    """
    role_result = supabase.table("user_target_roles").select("role_family").eq(
        "user_id", user_id
    ).execute()
    role_families = [r["role_family"] for r in (role_result.data or [])]

    # ── Dimension 1: Skills match (30 pts) ───────────────────────────────
    user_skills = {s.lower() for s in parsed_resume.get("skills", [])}

    if role_families:
        market_result = (
            supabase.table("job_skills")
            .select("skill_name")
            .execute()
        )
        market_skills = {
            r["skill_name"].lower() for r in (market_result.data or [])
        }
        if market_skills:
            skills_score = min(
                30.0, (len(user_skills & market_skills) / len(market_skills)) * 30
            )
        else:
            skills_score = 15.0
    else:
        skills_score = 15.0

    # ── Dimension 2: Experience (25 pts) ─────────────────────────────────
    exp_years = parsed_resume.get("experience_years", 0)
    # Avg required exp: query active jobs for user's role family
    if role_families:
        avg_result = (
            supabase.table("jobs")
            .select("exp_min_years")
            .in_("role_family", role_families)
            .eq("is_active", True)
            .execute()
        )
        mins = [r["exp_min_years"] for r in (avg_result.data or []) if r.get("exp_min_years")]
        avg_required = sum(mins) / len(mins) if mins else 3
    else:
        avg_required = 3.0

    exp_score = min(25.0, (exp_years / max(avg_required, 1)) * 25)

    # ── Dimension 3: Market demand (25 pts) ──────────────────────────────
    city = user_profile.get("city_canonical", "")
    if role_families and city:
        demand_result = (
            supabase.table("jobs")
            .select("id", count="exact")
            .in_("role_family", role_families)
            .eq("city_canonical", city)
            .eq("is_active", True)
            .execute()
        )
        active_count = demand_result.count or 0
    else:
        active_count = 0
    demand_score = min(25.0, (active_count / 500) * 25)

    # ── Dimension 4: Salary positioning (20 pts) ─────────────────────────
    current_salary = float(user_profile.get("current_salary_lpa", 0) or 0)
    role_category  = role_families[0] if role_families else "software_engineering"
    benchmarks     = await get_salary_percentiles(role_category, city, exp_years)
    percentile     = get_salary_percentile_rank(current_salary, benchmarks)
    salary_score   = percentile * 20

    career_score = round(skills_score + exp_score + demand_score + salary_score)

    return {
        "career_score": min(100, career_score),
        "score_components": {
            "skills":     round(skills_score, 2),
            "experience": round(exp_score, 2),
            "demand":     round(demand_score, 2),
            "salary":     round(salary_score, 2),
        },
        "market_demand_score": round((demand_score / 25) * 100),
        "benchmarks":  benchmarks,
        "salary_role_category": role_category,
    }
