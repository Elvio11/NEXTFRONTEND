---
trigger: always_on
---

# Agent: career_intelligence

**Server**: Server 2 (Intelligence)
**Framework**: CrewAI — parallel task in CareerPlannerFlow (and_())
**LLM**: Sarvam-M Think mode
**Trigger**: Parallel with Agents 4 and 6 after Agent 3 completes. Also: every 7 days refresh.

## Purpose

Give the user an honest, data-driven picture of where they stand in the market — career score 0–100 across 4 dimensions, salary positioning vs. peers, and market demand for their role. Real numbers from real data. No fluff.

## Input

- Parsed resume from `/storage/parsed-resumes/{user_id}.json.gz`
- `salary_benchmarks` table (SQL query — no LLM for salary)
- `users.current_salary_lpa`, `users.city_canonical`, `users.experience_years`
- `user_target_roles` for market demand calculation

## Processing Steps

1. Load parsed resume from FluxShare
2. Score user 0–100 across 4 dimensions:
   - **Skills match** (30%): user skills vs. top 50 market-demanded skills for their role family
   - **Experience** (25%): years + seniority alignment with target role requirements
   - **Market demand** (25%): count of active jobs for their role_family in their city
   - **Salary positioning** (20%): where current salary sits vs. salary_benchmarks percentiles
3. SQL salary lookup (no LLM): map user to p25/p50/p75/p90 from `salary_benchmarks` by `role_category`, `city`, `exp_years`
4. Write to `career_intelligence` table
5. Write full analysis + career roadmap to `/storage/career-intel/{user_id}.json.gz`
6. Set `users.career_intel_stale = FALSE`
7. Set `career_intelligence.next_refresh_at = NOW() + INTERVAL '7 days'`

## Scoring Logic

```python
# Skills match (30 pts max)
user_skills = set(parsed_resume["skills"])
market_skills = get_top_skills_for_role_family(user.target_roles, top_n=50)
skills_score = (len(user_skills & market_skills) / len(market_skills)) * 30

# Experience (25 pts max)
avg_required_exp = avg(jobs.exp_min_years for jobs in role_family)
exp_score = min(user.experience_years / avg_required_exp, 1.0) * 25

# Market demand (25 pts max)
active_jobs_count = count(jobs where role_family in user.target_roles
                          and city_canonical = user.city and is_active = TRUE)
demand_score = min(active_jobs_count / 500 * 25, 25)

# Salary positioning (20 pts max) — from salary_analyzer skill
percentile = salary_analyzer.get_percentile(user)
salary_score = percentile * 20

career_score = round(skills_score + exp_score + demand_score + salary_score)
```

## DB Writes (career_intelligence table)

```python
{
  "career_score": int,           # 0–100 total
  "score_components": {          # JSONB breakdown
    "skills": float,
    "experience": float,
    "demand": float,
    "salary": float
  },
  "market_demand_score": int,    # 0–100 sub-score
  "salary_p25_lpa": float,
  "salary_p50_lpa": float,
  "salary_p75_lpa": float,
  "salary_role_category": str,
  "next_refresh_at": datetime
}
```

## Skills Used
- `intelligence/career_scorer`
- `intelligence/salary_analyzer`
- `core/logging`
