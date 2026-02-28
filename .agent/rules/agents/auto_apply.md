---
trigger: always_on
---

# Agent: auto_apply

**Server**: Server 3 (Execution)
**Framework**: CrewAI + Selenium WebDriver
**LLM**: None (Selenium execution). Agent 13 (form_answerer) called inline for custom questions.
**Trigger**: Dynamic Continuous Queue. Window: 8 PM to 6 AM IST daily.

## Purpose

Automatically apply to Tier 1 jobs (Indeed Easy Apply + LinkedIn Easy Apply) on behalf of paid users who have valid sessions and have enabled auto-apply. The most complex agent — must mimic human behaviour perfectly to maintain session stability.

## Apply Window & Slot Scheduling

- Window: 8 PM to 6 AM IST (10 hours = 600 minutes)
- Each user gets a deterministic nightly slot:
```python
slot_offset_minutes = hash(str(user_id) + date.today().isoformat()) % 600
apply_at = datetime(today, 20, 0) + timedelta(minutes=slot_offset_minutes)
# Jitter: ±15 minutes applied to slot
```
- Same approximate time each night, never exact. Prevents burst detection.
- NOT a batch job. Users processed one at a time at their individual slots.

## Review Mode (first 14 days)

Active for first 14 days after `users.auto_apply_activated_at`:
- Each queued application gets `auto_status = 'queued'` instead of auto-submitting
- User approves or rejects via dashboard before submission
- After 14 days: auto_status flows automatically to `'in_progress'` → `'submitted'`

## Pre-Apply Eligibility Gate

Run `core/eligibility_checker` skill. Checks (in order):
1. `auto_apply_enabled = TRUE`
2. `auto_apply_paused = FALSE`
3. `tier = 'paid'`
4. Session `is_valid = TRUE` from `user_connections`
5. `daily_apply_count < daily_apply_limit` (default 10)
6. `monthly_apply_count < 250` (hard cap)
7. Company not in user blacklist
8. Not already applied to this job (dedup)

If any check fails: skip user for tonight, log reason, send WA alert if session is the issue.

## Apply Execution (Tier 1 ONLY)

Platform priority: LinkedIn Easy Apply first, then Indeed Easy Apply.

```
1. anti_ban_guard: evaluate risk_score. If cooldown_required → defer user, skip tonight.
2. session_validator: check is_valid, estimated_expires_at, send expiry warnings.
3. Load session from user_connections: AES-256 decrypt in memory. NEVER log decrypted value.
4. If fit_score >= 75 and tier = 'paid':
   → POST to Server 2: trigger Agent 10 (resume tailoring)
   → POST to Server 2: trigger Agent 11 (cover letter)
   → Wait for both to complete before applying
5. Selenium: headless=False, undetected-chromedriver, inject session cookies
6. Navigate to job apply URL
7. anti_ban_guard: enforce random delay (2–6 seconds page load)
8. Fill form fields: name, email, phone, work experience, education from parsed resume
9. Upload tailored resume if available, else primary resume
10. Custom question detected → call form_answerer inline (Sarvam-M No-Think, < 3 seconds)
11. Submit form
12. Detect success confirmation page
13. Screenshot on ANY exception → /storage/screenshots/{app_id}.png
```

## After Successful Apply

```python
db.insert("job_applications", {
    "status": "applied",
    "auto_status": "submitted",
    "method": "auto",
    "fit_score_at_apply": fit_score,
    "tailored_resume_path": path_if_used,
    "cover_letter_path": path_if_used
})
db.update("users", {"daily_apply_count": +1, "monthly_apply_count": +1})
db.insert("learning_signals", {"signal_type": "application_submitted", "context": {...}})
# WhatsApp: "Applied to {role} at {company}"
```

## Failure Handling

| Failure Type | auto_status | Action |
|---|---|---|
| CAPTCHA detected | `failed_captcha` | Screenshot, increment retry_count |
| Session invalid | `failed_session` | consecutive_failures += 1 |
| Form field not found | `failed_not_found` | Screenshot, log failure_note |
| 3 consecutive same-type failures | — | auto_apply_paused = TRUE, WA alert |

## Skills Used
- `core/eligibility_checker`
- `automation/session_validator`
- `automation/selenium_apply`
- `automation/form_answerer` (inline)
- `security/anti_ban_guard`
- `communication/whatsapp_push`
- `core/logging`
