---
name: whatsapp_push
description: Sends WhatsApp messages to users via the Baileys socket on Server 1. Use this skill whenever any agent needs to send a notification, alert, or coach message to a user's WhatsApp. Always check wa_opted_in, quiet_hours, and wa_ai_replies_today caps before sending. Rate limit: 1 message per 1500ms — never bypass this.
---

# Skill: whatsapp_push

## Purpose
Single interface for all outbound WhatsApp messages. Enforces opt-in checks, rate limits, quiet hours, and reply caps before every send.

## Pre-Send Checklist (run every time, no exceptions)
```python
def can_send_whatsapp(user_id, message_type):
    user = get_user(user_id)

    # 1. Must be opted in
    if not user.wa_opted_in:
        return False, "not_opted_in"

    # 2. Must have phone registered
    if not user.wa_phone:
        return False, "no_phone"

    # 3. AI reply cap (free users only)
    if message_type == "ai_reply" and user.tier == "free":
        if user.wa_ai_replies_today >= 3:
            return False, "daily_ai_cap_reached"

    # 4. Quiet hours check (coach messages only)
    if message_type == "coach":
        prefs = user.notif_prefs
        if is_in_quiet_hours(prefs.get("quiet_hours_start"), prefs.get("quiet_hours_end")):
            return False, "quiet_hours"

    # 5. Coach enabled check
    if message_type == "coach" and not user.notif_prefs.get("coach_enabled", True):
        return False, "coach_disabled"

    return True, None
```

## Rate Limiting (Baileys)
```python
# Global rate limiter — shared across all users
# Hard limit: 1 message per 1500ms
await asyncio.sleep(1.5)  # minimum gap between any two sends
# Never fire two sends concurrently — queue and space them
```

## Message Types
| Type | Trigger | LLM | Template or Generated |
|---|---|---|---|
| `job_alert` | New top match scored | None | Template |
| `application_update` | Status change (callback, interview, offer) | None | Template |
| `session_expiring_7d` | 7 days before expiry | None | Template |
| `session_expiring_3d` | 3 days before expiry | None | Template |
| `session_expiring_1d` | 1 day before expiry | None | Template |
| `session_expired` | Expiry reached | None | Template |
| `apply_paused` | 3x consecutive failures | None | Template |
| `coach` | 7 AM IST daily (paid only) | Sarvam-M Think | Generated |
| `subscription_expiring` | 3 days before expiry | None | Template |
| `ai_reply` | Response to WA command | Sarvam-M No-Think | Generated |

## Inbound WA Command Gate (3 layers — enforced before any response)
```python
# Gate 1: phone registered
if not user_exists_by_phone(wa_phone):
    return  # silently ignore, no response

# Gate 2: opted in
if not user.wa_opted_in:
    send_raw("Please connect your WhatsApp first via the Talvix dashboard.")
    return

# Gate 3: paid-only command
PAID_COMMANDS = ["status", "report", "coach", "resume", "apply_now"]
if command in PAID_COMMANDS and user.tier == "free":
    send_raw("This command requires a Talvix paid plan. Upgrade at talvix.in")
    return
```

## Notifications DB Write (every send)
```python
db.insert("notifications", {
    "user_id": user_id,
    "channel": "whatsapp",
    "event_type": message_type,
    "title": title,
    "body": message_body,
    "status": "sent",
    "expires_at": NOW() + INTERVAL '7 days'  # high urgency
    # LOW urgency: NOW() + INTERVAL '48 hours'
})
```

## wa_bot_health Update (every send)
```python
db.update("wa_bot_health", id=1, {
    "messages_sent_today": messages_sent_today + 1,
    "last_message_at": NOW()
})
```

## SIM Scaling Thresholds
- 0–500 users: 1 Jio SIM (~₹350/month)
- 500–2,000: 2 SIMs
- 2,000–5,000: 3 SIMs
- 5,000–10,000: 5 SIMs
