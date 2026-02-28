---
trigger: always_on
---

# Agent: resume_intelligence

**Server**: Server 2 (Intelligence)
**Framework**: CrewAI — @start task in CareerPlannerFlow
**LLM**: Sarvam-M Think mode
**Trigger**: User uploads resume (Onboarding Step 2) OR user uploads a new resume later

## Purpose

Parse the user's resume, extract structured data, and generate ai_generated_persona options for the user to select. This is the entry point for all downstream intelligence — fit scoring, skill gap analysis, cover letters, and form Q&A all depend on what this agent extracts.

## Input

- Resume file (`.pdf` via PyPDF2, `.docx` via python-docx)
- `user_id` from JWT
- File delivered via Server 1 → Server 2 HTTP POST

## Processing Steps

1. Parse file based on extension
2. Extract: `skills[]`, `experience_years`, `current_title`, `seniority_level`, `education[]`, `certifications[]`, `work_experience[]`
3. Infer `seniority_level` using Sarvam-M Think if not explicitly stated in resume
4. Generate `ai_generated_persona` — 3 distinct 200-word variants (confident / narrative / technical) for user to choose from in Step 4
5. Compress and write full parsed JSON to `/storage/parsed-resumes/{user_id}.json.gz`
6. Write slim `summary` JSONB to `resumes` table: `{seniority, top_5_skills, exp_years, persona: null}`
7. Set `users.fit_scores_stale = TRUE` — triggers full re-score in Agent 6
8. Set `users.onboarding_completed = TRUE` after first successful parse
9. Set `resumes.parse_status = 'done'`

## Output (returned to Server 1)

```json
{
  "status": "success",
  "duration_ms": 0,
  "storage_path": "/storage/parsed-resumes/{user_id}.json.gz",
  "persona_options": [
    "<200-word confident persona>",
    "<200-word narrative persona>",
    "<200-word technical persona>"
  ],
  "extracted_summary": {
    "seniority": "mid",
    "top_5_skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    "exp_years": 4,
    "current_title": "Backend Engineer"
  }
}
```

## Handoff (after this agent completes)

CareerPlannerFlow triggers `and_()` parallel execution of:
- Agent 4 (skill_gap)
- Agent 5 (career_intelligence)
- Agent 6 (fit_scorer — full scan mode, because `fit_scores_stale = TRUE`)

All three run in parallel. When all complete: `users.dashboard_ready = TRUE` → Supabase realtime fires to frontend.

## Error Handling

- Corrupt file → `parse_status = 'failed'`, write `parse_error`, return failure to Server 1 (frontend shows re-upload prompt)
- Password-protected PDF → fail with `"password_protected"` reason
- Image-only PDF (no text layer) → fail with `"no_text_content"` reason
- Never silently fail — frontend must know so user can retry

## Skills Used
- `resume/parser`
- `resume/persona_generator`
- `core/logging`
