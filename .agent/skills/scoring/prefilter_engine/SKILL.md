---
name: prefilter_engine
description: Pre-filtering logic that reduces 200,000 active jobs to ~100–300 relevant jobs per user before any LLM call. Use this skill as Step 1 of every fit scoring run. Never pass raw job pool to Sarvam-M — always prefilter first. This is the primary cost control mechanism for Agent 6.
---

# Skill: prefilter_engine

## Purpose
Reduce the 200K active job pool to a small, relevant candidate set per user using pure SQL and TF-IDF — zero LLM tokens at this stage.

## Two-Stage Filtering

### Stage 1 — SQL Hard Filter

```sql
SELECT j.*
FROM jobs j
WHERE j.role_family IN (
    SELECT role_family FROM user_target_roles WHERE user_id = :user_id
  )
  AND j.seniority_level IN (:user_seniority, 'not_specified')
  AND (
    j.city_canonical IN (
      SELECT city_canonical FROM users WHERE id = :user_id
    )
    OR j.work_mode = 'remote'
  )
  AND j.is_active = TRUE
  AND j.company_canonical NOT IN (
    SELECT company_canonical FROM user_company_prefs
    WHERE user_id = :user_id AND pref_type = 'blacklist'
  )
  -- Delta mode only:
  -- AND j.is_new = TRUE
```

Expected output after Stage 1: ~500–2,000 jobs

### Stage 2 — TF-IDF Cosine Similarity

1. Load user's `top_5_skills` from `resumes.summary`
2. Build TF-IDF vector from skill keywords
3. Score each job from Stage 1 against resume keyword vector using cosine similarity
4. Keep top N by cosine score (N = 300 for full scan, N = 100 for delta mode)

Expected output after Stage 2: ~100–300 jobs ready for LLM scoring

## Output

```python
{
  "filtered_jobs": [...],  # list of job IDs + metadata
  "total_after_sql": 847,
  "total_after_tfidf": 143,
  "mode": "delta | full_scan"
}
```

## Critical Notes
- role_family on jobs is set by Agent 7 (JD Cleaning). If a job has role_family = NULL it was not yet cleaned — exclude it from prefilter.
- Dream company boost: for jobs at `user_company_prefs.pref_type = 'dream'` companies, lower the cosine threshold by 20% — include them even if similarity is lower.
- This stage must complete in under 5 seconds for any user. Index-backed SQL + in-memory TF-IDF only.
