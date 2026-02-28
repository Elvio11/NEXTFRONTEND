---
name: cover_letter_generator
description: Generates a unique, persona-matched cover letter for a job application. Use this skill when Agent 10 (document_tailor) needs to produce a cover letter. Triggered automatically alongside tailor_engine for Tier 1 jobs (fit_score >= 75), or on-demand for Tier 2 jobs via dashboard. Uses Gemini Flash — not Sarvam-M — to preserve Sarvam RPM for scoring. No two cover letters across the system can share the same opening sentence.
---

# Skill: cover_letter_generator

## Purpose
Produce a unique, persona-authentic cover letter for each application. Honest about gaps. Specific about the company. Never generic.

## LLM
Gemini Flash. NOT Sarvam-M — sufficient quality for cover letters, saves Sarvam-M RPM for fit scoring.

## Trigger Conditions
- **Tier 1 auto**: triggered alongside `tailor_engine` when `fit_score >= 75`, `tier = 'paid'`
- **Tier 2 on-demand**: triggered when user clicks "Generate Cover Letter" on dashboard

## Inputs Required
```python
{
  "user_id": "uuid",
  "app_id": "uuid",
  "ai_generated_persona": str,         # 200-word persona string — defines voice and tone
  "parsed_resume_path": str,           # /storage/parsed-resumes/{user_id}.json.gz
  "job_title": str,
  "company_canonical": str,
  "jd_summary": str,                   # 2–3 sentence summary from jobs.jd_summary
  "jd_storage_path": str,              # /storage/jds/{fingerprint}.txt (full JD for context)
  "fit_score": int,
  "missing_skills": [str],             # address gaps honestly — show awareness
  "required_skills": [str],            # highlight where user is strong
  "fit_reasons": [str]                 # from job_fit_scores — use as evidence
}
```

## Content Rules
- Opening sentence must be unique — never reuse the same opener across different applications
- Tone must match `ai_generated_persona` exactly — not generic corporate tone
- Address 1–2 `missing_skills` honestly: acknowledge gap + show learning intent or transferable skill
- Length: 250–350 words. Three paragraphs maximum.
- **Never fabricate** achievements, metrics, or experiences not in the resume
- **Banned phrases**: "I am writing to express my interest", "I am a passionate", "team player", "results-driven", "detail-oriented"

## Three-Paragraph Structure
```
Para 1 — Hook (3–4 sentences):
  Specific, company-aware, persona-authentic opening.
  Reference something concrete about the role or company — not generic enthusiasm.

Para 2 — Evidence (4–5 sentences):
  2–3 concrete achievements from resume, reframed for this role.
  Use fit_reasons as the basis. Quantify where possible.

Para 3 — Close (2–3 sentences):
  Confident, specific ask.
  One honest line addressing a missing_skill if applicable.
  No "looking forward to hearing from you" — be direct.
```

## Opening Sentence Uniqueness
Track opening sentences to prevent repetition:
```python
# Check last 10 cover letters generated for this user
recent_openers = get_recent_cover_letter_openers(user_id, limit=10)
# Regenerate if new opener matches any recent one
```

## Output
- File: `/storage/cover-letters/{user_id}/{app_id}.txt`
- TTL: 7 days (pg_cron cleanup)
- Update DB: `job_applications.cover_letter_path = '/storage/cover-letters/{user_id}/{app_id}.txt'`

## Return
```python
{
  "status": "success",
  "cover_letter_path": "/storage/cover-letters/{user_id}/{app_id}.txt",
  "word_count": 310,
  "duration_ms": 1800
}
```
