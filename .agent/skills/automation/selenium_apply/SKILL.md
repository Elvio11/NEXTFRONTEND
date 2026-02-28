---
name: selenium_apply
description: Selenium WebDriver automation for Tier 1 auto-apply (Indeed Easy Apply and LinkedIn Easy Apply). Use this skill when writing any Selenium-based form filling or submission code for Agent 12. Always wrap with anti_ban_guard. Never use this for Tier 2 platforms — Tier 2 is URL redirect only.
---

# Skill: selenium_apply

## Purpose
Execute Tier 1 auto-apply via Selenium WebDriver — fill and submit Indeed Easy Apply and LinkedIn Easy Apply forms on behalf of the user, using their captured session cookies.

## Tier 1 Platforms ONLY
- Indeed Easy Apply (`easy_apply = TRUE` on jobs table, `platform_primary = 'indeed'`)
- LinkedIn Easy Apply (`easy_apply = TRUE`, `platform_primary = 'linkedin'`)

**Never use this skill for Tier 2 platforms.** Tier 2 = URL redirect only.

## Session Loading
```python
# Load from user_connections — NEVER log the decrypted value
session_data = decrypt_aes256(
    user_connections.session_encrypted,
    user_connections.session_iv,
    aes_key_from_doppler
)
# Inject cookies into Selenium driver
driver.add_cookie(session_data)
```

## Apply Flow
1. Navigate to job apply URL
2. Check anti_ban_guard → get risk_score → enforce delay
3. Detect form type (single-page vs multi-step)
4. Fill each form field:
   - Name, email, phone: from `users` table
   - Resume: upload tailored PDF from `/storage/tailored/{user_id}/{app_id}.pdf` if available, else primary resume
   - Work experience, education: from parsed resume storage
   - Custom question detected → call Agent 13 (Form Q&A) inline
5. Review page → submit
6. Detect success confirmation page

## Screenshot on Failure
```python
# On ANY exception or unexpected state
driver.save_screenshot(f"/storage/screenshots/{app_id}.png")
# Write path to job_applications.screenshot_path
# Set auto_status = 'failed_*'
```

## Form Field Detection
- Use explicit waits (WebDriverWait), never `time.sleep()`
- Handle both shadow DOM and standard DOM
- Custom question detection: look for textarea, radio buttons, or dropdowns not in standard apply fields
- If field not found after 10-second wait: log `failed_not_found`, screenshot, abort this application

## Headless vs. Headed
- **Never use headless=True for LinkedIn.** LinkedIn detects headless Chrome.
- Use undetected-chromedriver with stealth patches.
- Maintain consistent browser fingerprint per user (same User-Agent, viewport, timezone as initial session).
