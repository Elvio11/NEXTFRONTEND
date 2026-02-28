---
name: anti_ban_guard
description: Automation safety logic for all LinkedIn and Indeed actions. Apply this skill whenever writing any code that interacts with LinkedIn (scraping, connecting, messaging, viewing profiles) or Indeed (applying, session use). Enforces human-like delays, risk scoring, cooldown timers, and anomaly detection. Never write LinkedIn/Indeed automation code without this skill.
---

# Skill: anti_ban_guard

## Purpose
Implements automation safety logic to protect Server 3's static IP and user sessions from LinkedIn and Indeed detection.

## Capabilities
- Enforce delay randomness
- Track session duration
- Trigger cooldown timers
- Detect anomaly spikes

## Output
```json
{
  risk_score: 0-100,
  cooldown_required: true/false,
  session_status: "safe | warning | blocked"
}
```

## Rules

### Delay Ranges (all randomized — never fixed)
- Between page loads: 2–6 seconds
- Between form field fills: 0.5–2 seconds
- Between connection requests: 45–90 seconds
- Between profile views: 20–45 seconds
- Between messages: 60–120 seconds
- After CAPTCHA detection: 10–20 minute cooldown minimum

### Risk Scoring (0–100)
Increment risk_score based on:
- +10: Actions in last hour > 80% of daily limit
- +20: 2+ CAPTCHAs in last 24 hours
- +30: Session age > 10 days (approaching expiry zone)
- +15: More than 5 failed form submissions in last hour
- +25: IP flagged in last 48 hours (consecutive_failures > 2)

At risk_score >= 70: `cooldown_required = true`. Pause ALL actions for minimum 30 minutes.
At risk_score >= 90: `session_status = 'blocked'`. Alert user, pause `auto_apply_paused = TRUE`.

### Session Duration Tracking
- Track total active Selenium session time per user per day
- Never exceed 4 hours of continuous Selenium activity per IP per day
- Force 15-minute breaks every 90 minutes of activity

### Global Kill Switch Check
Before EVERY LinkedIn action:
```python
total_today = get_server_linkedin_actions_today()
if total_today >= 1500:
    return {"cooldown_required": True, "session_status": "blocked", "reason": "global_cap"}
```

### Fingerprinting Protection
- Each user gets a persistent User-Agent string assigned at session creation. Never rotate it mid-session.
- Maintain consistent viewport size (1366×768 or 1920×1080 — set at user level, never change)
- Never use headless=True for LinkedIn — always use headed Chrome with stealth patches

## When to Apply
- Every LinkedIn connection request
- Every LinkedIn message sent
- Every LinkedIn profile view
- Every Indeed Easy Apply form submission
- Any Selenium page navigation on LinkedIn or Indeed
