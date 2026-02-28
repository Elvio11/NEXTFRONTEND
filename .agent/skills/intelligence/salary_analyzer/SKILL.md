---
name: salary_analyzer
description: Maps user's salary to India market percentiles using the salary_benchmarks table. Pure SQL — no LLM. Use this skill inside Agent 5 as part of career scoring and also when generating career intelligence reports.
---

# Skill: salary_analyzer

## Purpose
Tell the user exactly where their current salary sits relative to peers in their role, city, and experience band. Uses the pre-seeded `salary_benchmarks` table — no LLM, no external API.

## Input
```python
{
    "user_id": "uuid",
    "current_salary_lpa": 12.5,
    "city_canonical": "bangalore",
    "experience_years": 4,
    "role_family": "swe_backend"  # maps to role_category in benchmarks
}
```

## Role Family → Benchmark Category Mapping
```python
ROLE_TO_CATEGORY = {
    "swe_backend": "swe_mid",       # 2-5 years
    "swe_frontend": "swe_mid",
    "swe_fullstack": "swe_mid",
    "data_analyst": "data_analyst",
    "data_scientist": "data_scientist",
    "ml_engineer": "ml_engineer",
    "devops": "devops",
    "product_manager": "product_manager",
    "designer_ux": "designer_ux",
    "business_analyst": "business_analyst",
    "marketing": "marketing",
    "sales": "sales",
    # etc.
}
```

## SQL Lookup
```sql
SELECT p25_lpa, p50_lpa, p75_lpa, p90_lpa
FROM salary_benchmarks
WHERE role_category = :role_category
  AND city = :city
  AND exp_min_years <= :exp_years
  AND exp_max_years >= :exp_years
ORDER BY ABS(exp_min_years - :exp_years) ASC
LIMIT 1;
```

## Output
```python
{
    "percentile": 0.42,          # user is at 42nd percentile
    "p25_lpa": 12.0,
    "p50_lpa": 18.0,
    "p75_lpa": 28.0,
    "p90_lpa": 40.0,
    "current_lpa": 12.5,
    "label": "below_median",     # below_median | at_median | above_median | top_quartile
    "role_category": "swe_mid",
    "city": "bangalore"
}
```

## Write to DB
```sql
UPDATE career_intelligence SET
    salary_p25_lpa = :p25,
    salary_p50_lpa = :p50,
    salary_p75_lpa = :p75,
    salary_role_category = :role_category
WHERE user_id = :user_id;
```
