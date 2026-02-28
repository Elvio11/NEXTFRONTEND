---
name: persona_generator
description: Generates ai_generated_persona options for the user to choose from during onboarding. Use this skill in Agent 3 after the parser skill completes. The selected persona is used by Agents 10, 11, 13, and 14 throughout the user's lifetime on the platform.
---

# Skill: persona_generator

## Purpose
Create 3 distinct ai_generated_persona options from the parsed resume. The user selects one during onboarding Step 4. This persona string is the user's "voice" — it shapes every cover letter, follow-up email, and form answer the system generates on their behalf.

## LLM
Sarvam-M Think mode — quality matters here, this string is used for the user's entire lifetime on the platform.

## What ai_generated_persona IS

A ~200-word first-person professional positioning statement that:
- Captures the user's actual experience and genuine strengths
- Has a distinct professional voice and personality
- Sounds like something the user would naturally say, not HR boilerplate
- Can be used as a system prompt prefix for all document generation

## Three Variants (different tones, same facts)

```python
variants = {
    "confident": # Direct, achievement-focused, quantifies impact
    "narrative":  # Story-driven, career journey angle, relatable
    "technical":  # Skill-forward, technical credibility, precise
}
```

The user picks one. Their choice is saved to `resumes.summary.persona` and also used to set `users.persona`.

## Input
```python
{
    "current_title": "Backend Engineer",
    "experience_years": 4,
    "top_5_skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    "seniority_level": "mid",
    "education": [{"degree": "B.Tech CSE", "institution": "VIT", "year": 2020}],
    "work_experience": [...],  # last 2 roles
    "target_roles": ["Backend Engineer", "Software Engineer"],
    "user_persona": "professional"  # from onboarding Step 1
}
```

## Output
```python
[
    "<200-word confident persona>",
    "<200-word narrative persona>",
    "<200-word technical persona>"
]
```

## Rules
- Never fabricate experience, companies, or skills not in the resume
- Never use generic phrases like "passionate about", "team player", "results-driven"
- Each variant must be structurally different — different opening, different emphasis
- Write in first person, present tense
- Include specific technologies and concrete examples where possible
