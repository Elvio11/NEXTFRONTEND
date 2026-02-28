---
name: tailor_engine
description: Tailors a user's resume PDF for a specific job application. Use this skill when Agent 10 (document_tailor) needs to produce a tailored resume. Triggered for paid users when fit_score >= 75 on a Tier 1 job. Uses Sarvam-M Think mode. Hard constraint: never fabricate, embellish, or invent any experience, skill, or credential not already in the parsed resume.
---

# Skill: tailor_engine

## Purpose
Reorder, reframe, and keyword-align an existing resume to the specific job's JD — without adding anything that isn't true. Output is a PDF saved to FluxShare.

## Trigger Conditions
- `users.tier = 'paid'`
- `fit_score >= 75` for a Tier 1 job (Indeed Easy Apply or LinkedIn Easy Apply)
- `job_applications` row exists with `auto_status = 'queued'`

## LLM
Sarvam-M Think mode. Keyword alignment must be precise — this is reasoning-heavy, not extraction.

## The Absolute Constraint
**NEVER fabricate, embellish, or invent experience, skills, certifications, projects, or achievements.**
Only reframe and reorder what already exists in the parsed resume.
If a required skill is in `missing_skills` — do NOT add it. It is missing. Leave it missing.
The cover letter addresses gaps; the resume never lies.

## Inputs Required
```python
{
  "user_id": "uuid",
  "app_id": "uuid",
  "parsed_resume_path": "/storage/parsed-resumes/{user_id}.json.gz",
  "jd_storage_path": "/storage/jds/{fingerprint}.txt",
  "jd_summary": str,                  # from jobs.jd_summary
  "required_skills": [str],           # from job_skills table, skill_type='required'
  "nice_to_have_skills": [str],       # from job_skills table, skill_type='nice_to_have'
  "missing_skills": [str],            # from job_fit_scores — DO NOT ADD THESE
  "ai_generated_persona": str,        # selected persona string from users
  "fit_score": int
}
```

## Tailoring Strategy (in order)
1. Extract JD keywords from `required_skills` and raw JD text
2. Scan existing resume bullets — rewrite using JD's exact terminology where a synonym exists
3. Reorder experience bullets — most relevant to THIS job come first within each role
4. Reorder skills section — `required_skills` listed first, `nice_to_have_skills` second
5. Rewrite summary/objective line to align with the specific role title and company type
6. Do NOT change: dates, company names, job titles, education institutions, or any factual field

## Quality Check Before Saving
```python
# Verify no new skills were added
tailored_skills = extract_skills(tailored_text)
original_skills = parsed_resume["skills"]
assert all(s in original_skills for s in tailored_skills if s not in jd_keywords_as_synonyms)

# Verify dates unchanged
assert tailored_dates == original_dates

# Verify word count within 10% of original
assert abs(len(tailored_words) - len(original_words)) / len(original_words) <= 0.10
```

## Output
- File: `/storage/tailored/{user_id}/{app_id}.pdf` (render via WeasyPrint or ReportLab)
- TTL: 7 days (pg_cron cleanup)
- Update DB: `job_applications.tailored_resume_path = '/storage/tailored/{user_id}/{app_id}.pdf'`
- Write signal: `learning_signals` row, `signal_type = 'application_submitted'`, `context.used_tailored = true`

## Return
```python
{
  "status": "success",
  "tailored_resume_path": "/storage/tailored/{user_id}/{app_id}.pdf",
  "keywords_aligned": 12,   # count of JD keywords successfully matched
  "duration_ms": 4200
}
```
