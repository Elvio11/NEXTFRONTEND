"""
skills/salary_analyzer.py
Pure SQL lookup against salary_benchmarks table. No LLM.

Returns p25/p50/p75/p90 salary percentiles for the user's role and city.
"""

from db.client import supabase


async def get_salary_percentiles(
    role_category: str,
    city: str,
    exp_years: int,
) -> dict:
    """
    Query salary_benchmarks for percentile data.
    Returns dict with p25, p50, p75, p90 in LPA.
    """
    # Find closest experience band
    result = (
        supabase.table("salary_benchmarks")
        .select("p25_lpa, p50_lpa, p75_lpa, p90_lpa, role_category, city_canonical")
        .eq("role_category", role_category)
        .eq("city_canonical", city)
        .lte("exp_years_min", exp_years)
        .gte("exp_years_max", exp_years)
        .limit(1)
        .execute()
    )

    if result.data:
        row = result.data[0]
        return {
            "p25_lpa": row.get("p25_lpa", 0),
            "p50_lpa": row.get("p50_lpa", 0),
            "p75_lpa": row.get("p75_lpa", 0),
            "p90_lpa": row.get("p90_lpa", 0),
        }

    # Fallback: any city
    fallback = (
        supabase.table("salary_benchmarks")
        .select("p25_lpa, p50_lpa, p75_lpa, p90_lpa")
        .eq("role_category", role_category)
        .lte("exp_years_min", exp_years)
        .gte("exp_years_max", exp_years)
        .limit(1)
        .execute()
    )

    if fallback.data:
        row = fallback.data[0]
        return {
            "p25_lpa": row.get("p25_lpa", 0),
            "p50_lpa": row.get("p50_lpa", 0),
            "p75_lpa": row.get("p75_lpa", 0),
            "p90_lpa": row.get("p90_lpa", 0),
        }

    # No benchmark data — return zeros
    return {"p25_lpa": 0, "p50_lpa": 0, "p75_lpa": 0, "p90_lpa": 0}


def get_salary_percentile_rank(current_salary: float, benchmarks: dict) -> float:
    """
    Returns a 0.0–1.0 percentile rank for the user's current salary vs benchmarks.
    Used to compute the salary component of career_score.
    """
    p25 = benchmarks.get("p25_lpa", 0)
    p50 = benchmarks.get("p50_lpa", 0)
    p75 = benchmarks.get("p75_lpa", 0)
    p90 = benchmarks.get("p90_lpa", 0)

    if current_salary <= 0 or p90 <= 0:
        return 0.5  # neutral if no data

    if current_salary >= p90:
        return 1.0
    if current_salary >= p75:
        return 0.75 + 0.25 * (current_salary - p75) / max(p90 - p75, 1)
    if current_salary >= p50:
        return 0.50 + 0.25 * (current_salary - p50) / max(p75 - p50, 1)
    if current_salary >= p25:
        return 0.25 + 0.25 * (current_salary - p25) / max(p50 - p25, 1)
    return max(0.0, current_salary / max(p25, 1) * 0.25)
