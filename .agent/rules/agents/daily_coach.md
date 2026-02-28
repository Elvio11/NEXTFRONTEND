---
trigger: always_on
---

# Agent: daily_coach

**Server**: Server 2 (Intelligence)
**Framework**: CrewAI standalone task
**LLM**: Sarvam-M Think mode
**Trigger**: 7 AM IST daily via pg_cron HTTP POST to Server 2 /api/agents/coach

## Purpose

Send each paid, WhatsApp-connected user a personalised, genuinely useful career push message every morning. Not a generic notification — a contextual message that makes the user feel the system is actively working for them.

## Eligibility Check (before running for any user)

```sql
SELECT id FROM users
WHERE tier = 'paid'
  AND wa_opted_in = TRUE
  AND last_active_at > NOW() - INTERVAL '7 days'
```

Also check `users.notif_prefs`:
- `coach_enabled = FALSE` → skip this user
- `quiet_hours_start` / `quiet_hours_end` → if 7 AM IST falls in quiet window, defer to next allowed time

## Input per User

- `job_applications` (last 14 days) — status distribution: how many applied, callbacks, rejections
- `skill_gap_results.top_gaps` — current top 3 skill gaps
- `career_intelligence.career_score` — current score and trajectory
- `model_performance_snapshots` — how their applications compare to platform average callback rate
- `user_target_roles` — what they're targeting
- `users.experience_years`, `users.persona` — context for tone calibration

## Message Generation Rules

- **Hyper-variant structure**: no two consecutive coach messages can share the same structure. Rotate between:
  - Progress update (how applications are going)
  - Skill gap nudge (what to learn this week)
  - Application insight (pattern in their rejections/callbacks)
  - Market demand update (roles growing/shrinking in their city)
  - Momentum builder (celebrate a callback or milestone)
  - Challenge/goal setter (specific action item for today)
- Length: 3–5 sentences. Punchy and direct. Not corporate.
- End with one specific, actionable suggestion.
- Never start two consecutive messages with the same word.
- Match tone exactly to `users.persona` (student ≠ professional ≠ career switcher).

## Sarvam-M Think Prompt Pattern

```python
prompt = f"""
Generate a WhatsApp coach message for a job seeker.
Persona: {user.persona} | Experience: {user.experience_years} years
Target roles: {target_roles}
Applications last 14 days: {app_count} sent, {callback_count} callbacks, {rejection_count} rejections
Top skill gap: {top_gap.skill} (appears in {top_gap.importance_pct}% of job postings)
Career score: {career_score}/100
Message structure to use today: {todays_structure}
Previous message structure (do not repeat): {last_structure}

Rules:
- 3-5 sentences max
- End with one specific action they can take today
- WhatsApp-friendly tone, not email tone
- No "I hope you're doing well"
"""
```

## After Sending

- Write to `notifications` table: `channel = 'whatsapp'`, `event_type = 'coach_message'`, `status = 'sent'`
- Write to `agent_logs`: `status = 'completed'`, `records_processed = users_messaged_count`

## Skills Used
- `communication/whatsapp_push`
- `core/logging`
