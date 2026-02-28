---
trigger: always_on
---

# Agent: follow_up

**Server**: Server 3 (Execution)
**Framework**: CrewAI — two independent tracks running in parallel
**LLM**: Sarvam-M Precise (email track). None (LinkedIn track).
**Trigger**: Email track — hourly. LinkedIn track — 9 AM IST daily window open.

## Purpose

Two independent tracks that run in parallel. Email track: keep applications alive by following up at Day 7, 14, 21. LinkedIn track: build recruiter relationships that get applications noticed.

---

## Track 1 — Email Follow-Up

### Gmail Scan (every hour)
- Read Gmail inbox for replies to sent applications
- Match reply to `job_applications` by subject line / sender domain
- On reply: `fu_stopped = TRUE`, `fu_stop_reason = 'reply_received'`, update `status`

### Follow-Up Schedule (send only 9 AM–11 AM IST)
```sql
SELECT ja.* FROM job_applications ja
WHERE ja.fu_stopped = FALSE
  AND ja.status NOT IN ('rejected', 'withdrawn', 'ghosted')
  AND (
    (ja.fu_email_1_sent_at IS NULL
      AND ja.applied_at < NOW() - INTERVAL '7 days')
    OR
    (ja.fu_email_2_sent_at IS NULL
      AND ja.fu_email_1_sent_at IS NOT NULL
      AND ja.fu_email_1_sent_at < NOW() - INTERVAL '7 days')
    OR
    (ja.fu_close_loop_sent_at IS NULL
      AND ja.fu_email_2_sent_at IS NOT NULL
      AND ja.fu_email_2_sent_at < NOW() - INTERVAL '7 days')
  )
```

### Email Rules
- Sarvam-M Precise mode — quality over speed for emails
- Hyper-variant structure: rotate between question-led, value-add, brief check-in, honest curiosity
- No two follow-ups share the same opening sentence or CTA
- Each email must be unique in structure AND tone — protects deliverability
- After send: update `fu_email_1_sent_at` / `fu_email_2_sent_at` / `fu_close_loop_sent_at`
- Write `learning_signals`: `signal_type = 'followup_email_sent'`

---

## Track 2 — LinkedIn Networking

### Operating Hours
**STRICTLY 9 AM to 6 PM IST. No exceptions.**

### Pre-Action Checks (every action)
```python
# 1. Server-wide kill switch
total_today = get_server_linkedin_actions_today()
if total_today >= 1500: defer_all_linkedin(); return

# 2. Per-user daily caps
if connections_sent_today >= 15: skip_connections()
if messages_sent_today >= 30: skip_messages()
if profile_views_today >= 40: skip_views()

# 3. User paused check
if linkedin_daily_limits.paused_until > NOW(): skip_user()
```

### Connection Sequence
```
Day 2 after application:
  → anti_ban_guard delay
  → Search LinkedIn for recruiter at company
  → View recruiter profile (profile_views++)
  → Send connection request (< 200 chars, reference specific role)
  → Log: li_connection_sent_at, li_recruiter_name, li_recruiter_url

Day 4:
  → Check li_connection_status
  → If 'accepted': send follow-up message (messages_sent++)
  → Log: li_message_sent_at, li_connection_status = 'accepted'

Day 7:
  → If still pending: li_connection_status = 'withdrawn'
  → Write learning signal: li_connection_declined
```

### Acceptance Rate Monitoring
```python
# If 7-day rolling rate < 30%: pause for 7 days
if acceptance_rate_7d < 0.30:
    db.update("linkedin_daily_limits", {"paused_until": NOW() + 7 days})
```

### System Counter Update (after every LinkedIn action)
```sql
INSERT INTO system_daily_limits (date, total_linkedin_actions)
VALUES (CURRENT_DATE, 1)
ON CONFLICT (date) DO UPDATE
SET total_linkedin_actions = total_linkedin_actions + 1;
```

## Skills Used
- `communication/email_followup`
- `communication/linkedin_outreach`
- `security/anti_ban_guard`
- `core/logging`
