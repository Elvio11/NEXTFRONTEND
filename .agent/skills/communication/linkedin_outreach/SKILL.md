---
name: linkedin_outreach
description: Executes LinkedIn networking actions after job applications — recruiter search, connection requests, and follow-up messages. Use this skill when Agent 14 (follow_up) runs its LinkedIn track. Operating hours: STRICTLY 9 AM to 6 PM IST. Always check per-user daily caps and the server-wide 1,500 action kill switch before any action. Always invoke anti_ban_guard before every LinkedIn interaction.
---

# Skill: linkedin_outreach

## Purpose
Build recruiter relationships after applications are submitted. Increase callback rate by making applications human-visible through thoughtful, limited LinkedIn outreach.

## Operating Hours
**STRICTLY 9 AM to 6 PM IST. Zero exceptions.** No LinkedIn actions outside this window under any circumstance.

## Pre-Action Checklist (every single LinkedIn action)
```python
def can_do_linkedin_action(user_id, action_type):
    # 1. Server-wide kill switch
    total_today = db.query_one(
        "SELECT total_linkedin_actions FROM system_daily_limits WHERE date = CURRENT_DATE"
    )
    if total_today >= 1500:
        return False, "global_cap_reached"

    # 2. Per-user daily caps
    limits = db.query_one(
        "SELECT * FROM linkedin_daily_limits WHERE user_id = ? AND limit_date = CURRENT_DATE",
        user_id
    )
    caps = {"connection_requests": 15, "messages_sent": 30, "profile_views": 40}
    if limits and limits[action_type] >= caps[action_type]:
        return False, f"{action_type}_cap_reached"

    # 3. User not paused
    if limits and limits.paused_until and limits.paused_until > NOW():
        return False, "user_paused"

    return True, None
```

## Sequence (per application)
```
Day 2 after application:
  → Search LinkedIn for recruiter at {company_canonical}
  → View recruiter profile (+1 to profile_views)
  → anti_ban_guard: delay 20–45 seconds between view and request
  → Send connection request (personalised, under 200 characters)
  → Log: li_connection_sent_at, li_recruiter_name, li_recruiter_url

Day 4 (2 days after request):
  → Check li_connection_status
  → If 'accepted': send follow-up message
  → If no response: wait until Day 7, then mark 'withdrawn'

Day 7:
  → If still pending and no acceptance: set li_connection_status = 'withdrawn', stop sequence
```

## Connection Request Generation (Sarvam-M Precise)
```python
prompt = f"""
Write a LinkedIn connection request to a recruiter.
Role I applied for: {job_title} at {company_canonical}
My persona: {ai_generated_persona}

Rules:
- Under 200 characters (LinkedIn hard limit)
- Mention the specific role I applied for
- Sound like a real person, not a bot
- No "I came across your profile"
- No hollow flattery
- Direct, confident, brief
"""
```

## Follow-Up Message (after connection accepted)
```python
prompt = f"""
Write a LinkedIn message to a recruiter who just accepted my connection request.
Role: {job_title} at {company_canonical}
Days since application: {days}
My persona: {ai_generated_persona}

Rules:
- Under 300 characters
- Brief, specific, not needy
- Mention one concrete thing that makes me relevant for this role
- End with an open question, not a demand
"""
```

## DB Updates (job_applications)
| Field | When |
|---|---|
| `li_recruiter_name` | Recruiter found |
| `li_recruiter_url` | Recruiter found |
| `li_connection_status` | Each step: `not_sent → pending → accepted/declined/withdrawn` |
| `li_connection_sent_at` | Request sent |
| `li_message_sent_at` | Follow-up message sent |
| `li_reply_received_at` | Recruiter replies to message |

## Acceptance Rate Monitoring
```python
# After any declined or withdrawn
acceptance_rate_7d = calculate_7d_rolling_acceptance_rate(user_id)
db.update("linkedin_daily_limits", {
    "acceptance_rate_7d": acceptance_rate_7d
})

if acceptance_rate_7d < 0.30:
    db.update("linkedin_daily_limits", {
        "paused_until": NOW() + INTERVAL '7 days'
    })
    # Write learning signal
    db.insert("learning_signals", {"signal_type": "li_connection_declined", ...})
```

## System Counter Update (after every action)
```python
db.execute("""
    INSERT INTO system_daily_limits (date, total_linkedin_actions)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date) DO UPDATE
    SET total_linkedin_actions = total_linkedin_actions + 1
""")
```
