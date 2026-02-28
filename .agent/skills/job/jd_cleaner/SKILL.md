---
name: jd_cleaner
description: JD text cleaning and skill extraction using Gemini Flash Lite. Use this skill in Agent 7. Takes raw scraped JD text and extracts structured skills, classifies role_family, and generates a 2–3 sentence summary. Never use Sarvam-M for this — Gemini Flash Lite is cheaper and sufficient for extraction.
---

# Skill: jd_cleaner

## Purpose
Transform raw, messy scraped JD text into clean, structured data that Agent 6's prefilter_engine and fit_calculator can use without reading full JD text.

## LLM
Gemini Flash Lite — extraction task, not reasoning. Cheap and fast.

## Input
```python
{
    "fingerprint": "abc123",
    "raw_jd": "<full text from /storage/jds/{fingerprint}.txt>",
    "job_title": "Backend Engineer",
    "company": "Zerodha"
}
```

## Processing

### Step 1 — Strip Boilerplate
Remove: HTML tags, "Equal Opportunity Employer" sections, repeated legal disclaimers, "About Us" boilerplate that's the same across all postings, excessive whitespace and formatting noise.

### Step 2 — Extract Skills (Gemini Flash Lite)
```python
prompt = """
From this job description, extract:
1. required_skills: skills explicitly required (e.g. "must have", "required", "you must know")
2. nice_to_have_skills: skills mentioned as preferred/bonus (e.g. "nice to have", "plus", "preferred")
3. role_family: classify into exactly one of these: swe_backend, swe_frontend, swe_fullstack, 
   data_analyst, data_engineer, data_scientist, ml_engineer, devops, product_manager, 
   designer_ux, designer_ui, business_analyst, marketing, sales, operations, finance, hr, 
   legal, content, support
4. jd_summary: 2–3 sentences describing the role. Be specific and concrete, not generic.

Return JSON only. No preamble.
"""
```

### Step 3 — DB Writes
```python
# Write skills to job_skills junction table
for skill in required_skills:
    db.insert("job_skills", {job_id, skill_name: skill, skill_type: "required"})
for skill in nice_to_have_skills:
    db.insert("job_skills", {job_id, skill_name: skill, skill_type: "nice_to_have"})

# Update job row
db.update("jobs", job_id, {
    "jd_cleaned": True,
    "jd_summary": jd_summary,       # 2–3 sentences in DB — fast dashboard render
    "role_family": role_family       # CRITICAL — used by prefilter_engine
})
```

## Batch Processing
Process in batches of 50 jobs per Gemini call to avoid context limits. Use Gemini's batch API if available.

## Critical Note
`role_family` written by this skill is the foundation of Agent 6's prefilter. If this is wrong, the entire fit scoring pipeline produces irrelevant results. When in doubt, classify as the most specific role family that fits — never leave as NULL.
