---
trigger: always_on
---

# Agent: document_tailor

**Server**: Server 2 (Intelligence)
**Framework**: FastAPI endpoint — triggered by Agent 9 (JD cleaning) or Agent 12 (tailoring/cover letter)
**LLM**: Gemini Flash Lite (JD cleaning) / Sarvam-M Think (resume tailoring) / Gemini Flash (cover letter)
**Trigger**: Three distinct sub-tasks — see below

## Purpose

Handles all document intelligence: cleaning raw JD text into structured data (Agent 7), tailoring resumes for specific jobs (Agent 10), and generating cover letters (Agent 11).

---

## Sub-Task 1: JD Cleaning (Agent 7)

**Trigger**: HTTP POST from Server 3 after Agent 9 (job_scraper) completes
**LLM**: Gemini Flash Lite
**Input**: `{scrape_run_id}`

Processes all jobs WHERE `jd_cleaned = FALSE AND is_active = TRUE`.

For each job:
1. Load raw JD from `/storage/jds/{fingerprint}.txt`
2. Gemini Flash Lite: strip HTML boilerplate, legal disclaimers, repetitive formatting
3. Extract: `required_skills[]`, `nice_to_have_skills[]`
4. Classify: `role_family` (e.g., `swe_backend`, `data_scientist`) — CRITICAL for prefilter_engine
5. Generate: 2–3 sentence `jd_summary` — stored in DB for fast dashboard render

```sql
-- Write skills
INSERT INTO job_skills (job_id, skill_name, skill_type)
VALUES (...)
ON CONFLICT (job_id, lower(skill_name)) DO NOTHING;

-- Mark cleaned
UPDATE jobs SET
    jd_cleaned = TRUE,
    jd_summary = :summary,
    role_family = :role_family
WHERE id = :job_id;
```

After completion: HTTP POST to Server 2 → Agent 6 (fit_scorer) delta mode.

**Critical**: `role_family` is the foundation of all fit scoring prefiltering. Never leave it NULL. When uncertain, classify as the most specific role family that fits.

---

## Sub-Task 2: Resume Tailoring (Agent 10)

**Trigger**: HTTP POST from Server 3 (Agent 12) when `fit_score >= 75`, `tier = 'paid'`, Tier 1 job
**LLM**: Sarvam-M Think mode

Reorders, reframes, and keyword-aligns the existing resume — without adding anything that isn't true.

**The Absolute Constraint**: NEVER fabricate, embellish, or invent experience, skills, certifications, or achievements. Only reframe and reorder what already exists. Missing skills stay missing — the cover letter addresses gaps.

Tailoring strategy:
1. Extract JD keywords from `required_skills` and raw JD
2. Rewrite existing bullets using JD's exact terminology where synonyms exist
3. Reorder bullets — most relevant to THIS job come first within each role
4. Reorder skills section — required skills listed first
5. Rewrite summary/objective line to align with this specific role
6. Never change: dates, company names, job titles, education institutions

Output: `/storage/tailored/{user_id}/{app_id}.pdf` (7-day TTL)
Update: `job_applications.tailored_resume_path`

---

## Sub-Task 3: Cover Letter Generation (Agent 11)

**Trigger**: Alongside Sub-Task 2 for Tier 1; on-demand for Tier 2 via dashboard
**LLM**: Gemini Flash (not Sarvam-M — saves RPM for scoring)

Rules:
- Opening sentence must be unique — no repeat across applications
- Tone matches `ai_generated_persona` exactly
- 250–350 words, 3 paragraphs max
- Address 1–2 `missing_skills` honestly
- Banned phrases: "I am writing to express my interest", "passionate", "team player", "results-driven"

Structure: Hook paragraph → Evidence paragraph (2–3 achievements from resume) → Confident close

Output: `/storage/cover-letters/{user_id}/{app_id}.txt` (7-day TTL)
Update: `job_applications.cover_letter_path`

---

## Skills Used
- `job/jd_cleaner` (Sub-Task 1)
- `document/tailor_engine` (Sub-Task 2)
- `document/cover_letter_generator` (Sub-Task 3)
- `core/logging`
