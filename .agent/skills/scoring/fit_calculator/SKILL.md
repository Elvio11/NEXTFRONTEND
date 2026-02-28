---
name: fit_calculator
description: LLM-based fit scoring using Sarvam-M. Use this skill as Step 2 of Agent 6, after prefilter_engine has already reduced the job pool. Takes ~100–300 jobs and produces structured fit scores. Never call this skill before prefilter_engine runs first.
---

# Skill: fit_calculator

## Purpose
Score each filtered job against the user's full profile using Sarvam-M. Produce structured, actionable fit scores that drive the dashboard and auto-apply decisions.

## LLM Mode
- **Delta mode** (normal nightly): Sarvam-M No-Think — fast, batch 100 jobs per call
- **Full scan mode** (stale users): Sarvam-M Think — more accurate for first-time scoring

## Input per Batch
- User profile: parsed resume summary, experience_years, seniority_level, target roles, ai_generated_persona
- Batch of 100 job objects: title, company, jd_summary, required_skills[], nice_to_have_skills[], seniority_level, work_mode, salary_min/max_lpa
- Current model_weights from `model_weights` table

## Output per Job
```json
{
  "job_id": "uuid",
  "fit_score": 72,
  "fit_label": "good",
  "recommendation": "apply",
  "fit_reasons": ["Strong Python match", "Salary range aligns"],
  "missing_skills": ["Apache Kafka", "Kubernetes"],
  "strengths": ["5 years relevant experience", "Perfect seniority match"]
}
```

## Storage Rules (enforced here)
- Only write scores **>= 40** to `job_fit_scores`. Discard scores below 40.
- `fit_reasons`, `missing_skills`, `strengths`: only populate for paid users. Set NULL for free.
- `is_full_score = TRUE` for paid, `FALSE` for free.
- `week_number = TO_CHAR(NOW(), 'IYYY-"W"IW')`
- `expires_at = NOW() + INTERVAL '14 days'`

## Weight Application
Apply `model_weights` to scoring:
```python
weights = {
  "fit.skills_match": 0.35,    # from model_weights table
  "fit.exp_match": 0.20,
  "fit.seniority_match": 0.20,
  "fit.salary_match": 0.10,
  "fit.location_match": 0.10,
  "fit.company_signals": 0.05
}
# Apply tailored_boost if user used tailored resume for this application
if used_tailored: fit_score += model_weights["threshold.tailored_boost"]
# Apply dream company threshold lowering
if is_dream_company: apply_threshold -= model_weights["threshold.dream_company"]
```

## After Scoring
- Set `jobs.is_new = FALSE` for all scored jobs
- Update `user_fit_score_cursors.last_scrape_run` and `last_scored_at`
- Increment `user_fit_score_cursors.jobs_scored_total`
- Set `scrape_runs.scoring_complete = TRUE` when all users are scored for this scrape
