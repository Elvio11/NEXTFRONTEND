---
name: email_followup
description: Generates and sends follow-up emails for job applications via Gmail API. Use this skill when Agent 14 (follow_up) runs its email track. Handles Gmail inbox scanning for replies, and sending Day 7 / Day 14 / Day 21 follow-ups. Each email must be structurally unique — no two emails in a user's sequence can share the same opening sentence, structure, or CTA. Send window: 9 AM to 11 AM IST only. Uses Sarvam-M Precise mode.
---

# Skill: email_followup

## Purpose
Keep applications alive by following up at Day 7, 14, and 21. Stop immediately when a reply is detected. Protect deliverability by making every email structurally different.

## Gmail Integration
```python
# Credentials from user_connections (platform = 'gmail')
# Refresh oauth_access_token if oauth_token_expires_at < NOW()
gmail_service = build_gmail_service(user.oauth_access_token)

# Scan for replies
replies = gmail_service.users().messages().list(
    userId='me',
    q=f'from:{company_domain} OR subject:"{job_title}" newer_than:1d'
).execute()
```

## Send Window
**9 AM to 11 AM IST only.** Never send outside this window — optimal email open rates.
If due emails exist but time is outside window: queue them, send at 9 AM next day.

## Applications Query (run hourly)
```sql
SELECT ja.*, j.title, j.company_canonical, j.company_domain
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
WHERE ja.fu_stopped = FALSE
  AND ja.user_id = :user_id
  AND ja.status NOT IN ('rejected', 'withdrawn', 'ghosted')
  AND ja.method IN ('auto', 'manual')
  AND (
    -- Day 7: first follow-up not sent
    (ja.fu_email_1_sent_at IS NULL
      AND ja.applied_at < NOW() - INTERVAL '7 days')
    OR
    -- Day 14: second follow-up not sent
    (ja.fu_email_2_sent_at IS NULL
      AND ja.fu_email_1_sent_at IS NOT NULL
      AND ja.fu_email_1_sent_at < NOW() - INTERVAL '7 days')
    OR
    -- Day 21: close loop not sent
    (ja.fu_close_loop_sent_at IS NULL
      AND ja.fu_email_2_sent_at IS NOT NULL
      AND ja.fu_email_2_sent_at < NOW() - INTERVAL '7 days')
  )
```

## Email Generation (Sarvam-M Precise)
```python
# Rotate structure — never repeat within same application sequence
STRUCTURES = ["question_led", "value_add", "brief_checkin", "honest_curiosity"]
structure = STRUCTURES[follow_up_number - 1]  # different structure each time

prompt = f"""
Generate a follow-up email for a job application.
Structure type: {structure}
Applicant persona: {ai_generated_persona}
Job: {job_title} at {company_canonical}
Days since application: {days_since_applied}
Follow-up number: {follow_up_number} of 3

Rules:
- Under 120 words
- No "I hope this email finds you well"
- No "I am following up on my application"
- Opening sentence must not match any recent email from this user
- End with a specific, direct ask — not vague enthusiasm
- Match tone to persona exactly
"""
```

## After Sending — DB Updates
```python
if follow_up_number == 1:
    db.update("job_applications", app_id, {"fu_email_1_sent_at": NOW()})
elif follow_up_number == 2:
    db.update("job_applications", app_id, {"fu_email_2_sent_at": NOW()})
elif follow_up_number == 3:
    db.update("job_applications", app_id, {"fu_close_loop_sent_at": NOW()})

# Write learning signal
db.insert("learning_signals", {
    "signal_type": "followup_email_sent",
    "user_id": user_id,
    "signal_value": follow_up_number,
    "context": {"platform": platform, "days_since_apply": days, "follow_up_number": follow_up_number}
})
```

## On Reply Detected — Stop Sequence
```python
db.update("job_applications", app_id, {
    "fu_stopped": True,
    "fu_stop_reason": "reply_received",
    "status": "callback"  # or appropriate status
})

# Write learning signal
db.insert("learning_signals", {
    "signal_type": "followup_email_replied",
    "signal_value": follow_up_number_when_replied,
    "context": {...}
})
```

## Return
```python
{
  "emails_sent": 3,
  "replies_detected": 1,
  "sequences_stopped": 1,
  "duration_ms": 2100
}
```
