---
name: form_answerer
description: LLM-powered custom question answerer for Tier 1 apply forms. Use this skill only when Agent 12 detects a non-standard question field during selenium_apply execution. Called inline — must be fast. Uses Sarvam-M No-Think mode.
---

# Skill: form_answerer

## Purpose
Answer custom application form questions (text fields, radio buttons, dropdowns) that appear on Indeed and LinkedIn Easy Apply forms and are not handled by standard profile data.

## When Called
- Called INLINE by Agent 12 during selenium_apply execution
- Only when a field is detected that cannot be filled from standard profile data
- Must return answer in < 3 seconds — cannot slow the apply flow

## LLM
Sarvam-M No-Think mode — fast inference, not deep reasoning

## Input
```python
{
  "question_text": "Why do you want to work at {company}?",
  "field_type": "textarea | radio | dropdown",
  "options": [],  # for radio/dropdown only
  "user_context": {
    "ai_generated_persona": "...",  # 200-word persona string
    "target_role": "Backend Engineer",
    "company_name": "Zerodha",
    "experience_years": 4,
    "top_skills": ["Python", "Django", "PostgreSQL"]
  }
}
```

## Output
```json
{
  "answer": "string to inject into form field",
  "confidence": 0.85
}
```

## Answer Rules
- Keep answers under 150 words for textarea fields
- Sound human and genuine — not corporate-speak
- Match the user's `ai_generated_persona` tone
- For "years of experience" questions: use exact number from profile
- For "salary expectation": use `users.expected_salary_lpa`
- For "notice period": default "30 days" unless specified in resume
- For "why this company" type questions: generate genuine-sounding answer that references the role and company, not generic filler
- For Yes/No questions: always answer based on profile data. Never guess on certification or legal eligibility questions.

## Safety
- Never answer questions about criminal record, legal status, or disability status — leave blank and log for user review
- Never fabricate credentials, certifications, or skills not in the resume
