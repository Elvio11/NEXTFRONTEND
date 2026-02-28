---
name: session_validator
description: Session health checking for user_connections (LinkedIn and Indeed sessions). Use this skill before every auto-apply window and whenever session validity needs to be confirmed. Handles warning alerts at 7-day and 3-day expiry thresholds.
---

# Skill: session_validator

## Purpose
Check whether a user's platform session is still valid before attempting any auto-apply action. Send proactive expiry warnings to prevent silent apply failures.

## When to Run
- **Daily at 7:30 PM IST** — 30 minutes before apply window opens
- **Before every individual apply slot** during Agent 12 execution
- **On-demand** when any Selenium action returns a session error

## Validation Steps

```python
for connection in user_connections.where(user_id=user_id, is_valid=True):
    # 1. Check estimated_expires_at
    days_until_expiry = (connection.estimated_expires_at - NOW()).days

    # 2. Send 7-day warning if not sent
    if days_until_expiry <= 7 and not connection.warning_7d_sent:
        send_whatsapp_alert(user, "session_expiring_7d", platform)
        send_dashboard_notification(user, "session_expiring", urgency="medium")
        connection.warning_7d_sent = True

    # 3. Send 3-day warning if not sent
    if days_until_expiry <= 3 and not connection.warning_3d_sent:
        send_whatsapp_alert(user, "session_expiring_3d", platform)
        connection.warning_3d_sent = True

    # 4. Send 1-day warning if not sent
    if days_until_expiry <= 1 and not connection.warning_1d_sent:
        send_whatsapp_alert(user, "session_expiring_1d", platform)
        connection.warning_1d_sent = True

    # 5. If expired: mark invalid, pause auto-apply
    if days_until_expiry <= 0:
        connection.is_valid = False
        user.auto_apply_paused = True
        send_whatsapp_alert(user, "session_expired", platform)
```

## On Apply Failure (Session Error)
```python
connection.consecutive_failures += 1
connection.last_failure_reason = error_message

if connection.consecutive_failures >= 3:
    connection.is_valid = False
    user.auto_apply_paused = True
    # Alert user to reconnect via The Vault popup
```

## Output
```json
{
  "is_valid": true,
  "days_until_expiry": 4,
  "action_taken": "warning_3d_sent",
  "should_proceed": true
}
```
