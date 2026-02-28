---
name: career_scorer
description: Career score calculation for Agent 5. Scores user 0–100 across 4 dimensions and writes to career_intelligence table. Use this skill in Agent 5 during onboarding and weekly refresh.
---

# Skill: career_scorer

## Purpose
Give the user a clear, honest score of where they stand in the market across 4 measurable dimensions.

## Scoring Model

### Total Score: 0–100

| Dimension | Weight | Data Source |
|---|---|---|
| Skills Match | 30% | User skills vs. top 50 jobs in their role family |
| Experience | 25% | Years + seniority vs. target role requirements |
| Market Demand | 25% | Active job count for their role_family + city_canonical |
| Salary Positioning | 20% | Current salary vs. salary_benchmarks percentiles |

### Dimension: Skills Match (30 points max)
```python
user_skills = set(parsed_resume["skills"])
market_skills = get_top_skills_for_role_family(user.target_roles, top_n=50)
overlap_pct = len(user_skills & market_skills) / len(market_skills)
skills_score = overlap_pct * 30
```

### Dimension: Experience (25 points max)
```python
# Compare user's exp_years and seniority to what active jobs require
avg_required_exp = avg(jobs.exp_min_years for jobs in role_family)
if user.experience_years >= avg_required_exp:
    exp_score = 25
else:
    exp_score = (user.experience_years / avg_required_exp) * 25
```

### Dimension: Market Demand (25 points max)
```python
# Count active jobs in user's role_family and city
active_jobs_count = count(jobs where role_family in user.target_roles 
                          and city_canonical = user.city_canonical
                          and is_active = TRUE)
# Scale: 0 jobs = 0, 500+ jobs = 25
demand_score = min(active_jobs_count / 500 * 25, 25)
```

### Dimension: Salary Positioning (20 points max)
```python
# Handled by salary_analyzer skill — returns percentile
percentile = salary_analyzer.get_percentile(user)
salary_score = percentile * 20  # at p75 = 15 pts, at p90 = 18 pts
```

## Output (write to career_intelligence table)
```python
{
    "career_score": int,  # 0-100
    "score_components": {
        "skills": float,
        "experience": float,
        "demand": float,
        "salary": float
    },
    "market_demand_score": int  # 0-100 sub-score for demand dimension
}
```
