---
trigger: always_on
---

# Agent: skill_gap

**Server**: Server 2 (Intelligence)
**Framework**: CrewAI — parallel task in CareerPlannerFlow (and_())
**LLM**: Sarvam-M Think mode
**Trigger**: Parallel with Agents 5 and 6 after Agent 3 completes. Also: every 7 days refresh, new resume upload.

## Purpose

Identify the top skill gaps between the user's current profile and what employers in their target roles are actually requiring right now. Provide ROI-ranked, actionable learning recommendations — not generic advice.

## Input

- Parsed resume from `/storage/parsed-resumes/{user_id}.json.gz`
- `job_skills` table: top active jobs in user's `role_family` (SQL query, no LLM)
- `user_id`, `tier`

## Processing Steps

1. Load parsed resume from FluxShare
2. SQL: fetch skill frequency from `job_skills` for user's role_family and city

```sql
SELECT skill_name, skill_type, COUNT(*) as frequency
FROM job_skills js
JOIN jobs j ON js.job_id = j.id
WHERE j.role_family IN (SELECT role_family FROM user_target_roles WHERE user_id = :user_id)
  AND j.city_canonical = :city
  AND j.is_active = TRUE
GROUP BY skill_name, skill_type
ORDER BY frequency DESC
LIMIT 100;
```

3. Identify gaps: market skills that user doesn't have

```python
user_skill_set = {s.lower() for s in parsed_resume["skills"]}
gaps = {skill: freq for skill, freq in market_skills.items()
        if skill.lower() not in user_skill_set}
```

4. ROI ranking (Sarvam-M Think): rank top 10 gaps by demand frequency + learning time + career impact + salary uplift potential
5. For each top gap: suggest 1 free resource + 1 paid resource + estimated hours to proficiency
6. Write top 3 gaps to `skill_gap_results.top_gaps` JSONB (shown to ALL users)
7. Write full report to `/storage/skill-gaps/{user_id}.json.gz` (full detail for paid users)
8. Set `users.skill_gap_stale = FALSE`
9. Set `skill_gap_results.next_refresh_at = NOW() + INTERVAL '7 days'`

## Output (top_gaps JSONB in DB)

```json
[
  {
    "skill": "Apache Kafka",
    "importance_pct": 67,
    "roi_rank": 1,
    "est_hours": 30,
    "courses": [
      "Free: Confluent Kafka Tutorial (YouTube, 6h)",
      "Paid: Udemy Kafka Masterclass (10h, ~₹500)"
    ]
  },
  {
    "skill": "Kubernetes",
    "importance_pct": 54,
    "roi_rank": 2,
    "est_hours": 40,
    "courses": [
      "Free: KodeKloud Kubernetes for Beginners (YouTube, 8h)",
      "Paid: Certified Kubernetes Admin (CKA) course"
    ]
  }
]
```

Free users: see top 3 gaps from `top_gaps` JSONB in DB.
Paid users: see full report (all gaps ranked) from `/storage/skill-gaps/{user_id}.json.gz`.

## Skills Used
- `intelligence/skill_gap_analyzer`
- `core/logging`
