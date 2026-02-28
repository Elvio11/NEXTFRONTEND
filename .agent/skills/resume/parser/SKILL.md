---
name: skill_gap_analyzer
description: Identifies top skill gaps and ROI-ranked learning recommendations for Agent 4. Compares user's skills against market demand from the job_skills table. Use this skill in Agent 4 during onboarding and weekly refresh.
---

# Skill: skill_gap_analyzer

## Purpose
Tell the user exactly which skills to learn next, ranked by how much each skill will improve their callback rate. Actionable, specific, not generic.

## Input
```python
{
    "user_skills": ["Python", "Django", "PostgreSQL"],
    "role_family": "swe_backend",
    "city_canonical": "bangalore",
    "experience_years": 4
}
```

## Step 1 — Market Skill Frequency (SQL, no LLM)
```sql
SELECT skill_name, skill_type, COUNT(*) as frequency
FROM job_skills js
JOIN jobs j ON js.job_id = j.id
WHERE j.role_family = :role_family
  AND j.city_canonical = :city
  AND j.is_active = TRUE
GROUP BY skill_name, skill_type
ORDER BY frequency DESC
LIMIT 100;
```

## Step 2 — Gap Identification
```python
market_skills = {skill: freq for skill, freq in query_result}
user_skill_set = set(user_skills)
gaps = {skill: freq for skill, freq in market_skills.items() 
        if skill.lower() not in {s.lower() for s in user_skill_set}}
```

## Step 3 — ROI Ranking (Sarvam-M Think)
For top 10 gaps, ask Sarvam-M to rank by:
1. Market demand frequency
2. Estimated learning time vs. career impact
3. How quickly a recruiter would notice this skill
4. Job salary uplift potential for this skill in user's city

## Step 4 — Resource Suggestions
For each top gap, suggest:
- 1 free resource (YouTube playlist, official docs, free course)
- 1 paid resource (if high-value skill worth investing)
- Estimated hours to reach working proficiency

## Output (written to skill_gap_results)
```python
# top_gaps JSONB in DB — top 3 only (shown to free AND paid users)
[
    {
        "skill": "Apache Kafka",
        "importance_pct": 67,    # appears in 67% of relevant job postings
        "roi_rank": 1,
        "est_hours": 30,
        "courses": [
            "Free: Confluent Kafka Tutorial (YouTube, 6h)",
            "Paid: Udemy Kafka Masterclass (10h, ₹500)"
        ]
    }
]

# Full report → /storage/skill-gaps/{user_id}.json.gz
# (all gaps, not just top 3 — paid users see this via dashboard)
```
