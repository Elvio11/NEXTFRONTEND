---
trigger: always_on
---

# Agent: anti_ban_guard

**Server**: Server 3 (Execution)
**Framework**: Utility wrapper — not a CrewAI flow. Called inline by auto_apply and follow_up.
**LLM**: None — pure logic, rate limiting, and risk scoring
**Trigger**: Called before EVERY LinkedIn or Indeed action across the entire system

## Purpose

Protect Server 3's static FluxCloud IP and all user sessions from LinkedIn and Indeed bot detection. This is the single most operationally critical component after the database — a ban means the product stops working entirely.

The static IP is Talvix's apply identity. LinkedIn and Indeed associate it with all user sessions. Once flagged, rebuilding trust takes weeks. Prevention is everything.

## Two Risk Profiles — Fundamentally Different

### Scraping Risk (Agent 9 — job_scraper)
Handled by Webshare residential proxies. Agent 9 never touches Server 3's static IP for LinkedIn scraping. Proxy fails → skip platform, log, continue.

### Apply Risk (Agent 12 — auto_apply) 
The opposite. Agent 12 executes DIRECTLY from Server 3's static IP. **Never through any proxy.** Consistent IP = stable session = no mid-apply security challenges. Routing apply traffic through a proxy would cause immediate session invalidation.

## Pre-Action Risk Scoring
```python
def evaluate_risk(user_id, platform, action_type) -> dict:
    risk_score = 0
    user = get_user(user_id)
    conn = get_connection(user_id, platform)

    # +10: Actions this hour > 80% of daily limit
    hourly_actions = count_actions_last_hour(user_id, platform)
    daily_limit = get_daily_limit(action_type)
    if hourly_actions > daily_limit * 0.80:
        risk_score += 10

    # +20: 2+ CAPTCHAs in last 24 hours
    recent_captchas = count_captchas_24h(user_id)
    if recent_captchas >= 2:
        risk_score += 20

    # +30: Session age > 10 days (approaching expiry zone)
    session_age_days = (NOW() - conn.created_at).days
    if session_age_days > 10:
        risk_score += 30

    # +15: More than 5 failed form submissions in last hour
    recent_failures = count_failed_submissions_1h(user_id)
    if recent_failures > 5:
        risk_score += 15

    # +25: IP flagged (consecutive_failures > 2)
    if conn.consecutive_failures > 2:
        risk_score += 25

    status = "safe"
    if risk_score >= 70:
        status = "warning"
    if risk_score >= 90:
        status = "blocked"

    return {
        "risk_score": risk_score,
        "cooldown_required": risk_score >= 70,
        "session_status": status
    }
```

## Delay Enforcement (all randomised — never fixed)
```python
import random, asyncio

DELAYS = {
    "page_load":              (2.0, 6.0),
    "form_field_fill":        (0.5, 2.0),
    "connection_request":     (45.0, 90.0),
    "profile_view":           (20.0, 45.0),
    "message_send":           (60.0, 120.0),
    "post_captcha_cooldown":  (600.0, 1200.0),  # 10–20 min
    "between_apply_users":    (30.0, 90.0)
}

async def enforce_delay(action_type: str):
    lo, hi = DELAYS[action_type]
    await asyncio.sleep(random.uniform(lo, hi))
```

## Session Duration Tracking
```python
# Never exceed 4 hours of continuous Selenium activity per IP per day
total_session_time_today = get_selenium_time_today(server_ip)
if total_session_time_today >= 14400:  # 4 hours in seconds
    return {"cooldown_required": True, "session_status": "blocked", "reason": "daily_session_limit"}

# Force 15-minute break every 90 minutes of activity
time_since_break = get_time_since_last_break(user_id)
if time_since_break >= 5400:  # 90 minutes in seconds
    await enforce_delay_minutes(15)
```

## Global Kill Switch Check (before EVERY LinkedIn action)
```python
def check_global_kill_switch():
    total_today = db.query_one(
        "SELECT total_linkedin_actions FROM system_daily_limits WHERE date = CURRENT_DATE"
    )
    if total_today >= 1500:
        # No further LinkedIn actions for rest of UTC day
        # All queued LinkedIn tasks are deferred
        return {"blocked": True, "reason": "global_cap_1500", "reset_at": "midnight UTC"}
    return {"blocked": False}
```

## Browser Fingerprinting Protection
```python
# Each user gets a persistent browser profile assigned at session creation
# Never rotate User-Agent mid-session
user_profile = get_or_create_browser_profile(user_id)

FINGERPRINT_RULES = {
    "user_agent": user_profile.user_agent,      # never change per user
    "viewport": user_profile.viewport,           # 1366x768 or 1920x1080 — set once
    "timezone": "Asia/Kolkata",
    "headless": False,                           # NEVER True for LinkedIn
    "stealth_patches": True                      # undetected-chromedriver required
}
```

## When to Apply (mandatory)
Every single one of these actions must invoke anti_ban_guard first:
- Any LinkedIn connection request
- Any LinkedIn message sent
- Any LinkedIn profile view
- Any Indeed Easy Apply form submission
- Any Selenium page navigation on LinkedIn or Indeed

## On cooldown_required = True
```python
if result["cooldown_required"]:
    # Skip this user's slot for tonight
    db.update("job_applications", app_id, {"auto_status": "deferred_cooldown"})
    log_agent("auto_apply", user_id, "skipped", {"reason": "anti_ban_cooldown"})
    return  # do not proceed with apply
```

## On session_status = "blocked"
```python
if result["session_status"] == "blocked":
    db.update("users", user_id, {"auto_apply_paused": True})
    send_whatsapp_alert(user_id, "apply_paused_risk_detected")
```

## Skills Used
- `security/anti_ban_guard`
- `core/logging`
