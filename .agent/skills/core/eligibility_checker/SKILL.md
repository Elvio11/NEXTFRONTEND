---
name: eligibility_checker
description: Pre-apply gate that checks all conditions before any auto-apply attempt. Use this skill at the start of every Agent 12 apply slot. If any check fails, skip the user and log the reason. Never attempt an apply without running this first.
---

# Skill: eligibility_checker

## Purpose
Single gate that validates all conditions required before attempting an auto-apply. Prevents cap violations, session errors, and blacklist applies.

## All Checks (run in this order — fail fast)

```python
def check_eligibility(user_id, job_id, platform):

    user = get_user(user_id)
    job = get_job(job_id)
    connection = get_connection(user_id, platform)

    # 1. Auto-apply enabled
    if not user.auto_apply_enabled:
        return fail("auto_apply_disabled")

    # 2. Not paused
    if user.auto_apply_paused:
        return fail("auto_apply_paused")

    # 3. Paid tier only
    if user.tier != 'paid':
        return fail("free_tier")

    # 4. Session valid
    if not connection or not connection.is_valid:
        send_whatsapp_alert(user, "session_invalid")
        return fail("session_invalid")

    # 5. Daily cap check
    today_count = get_daily_apply_count(user_id)
    if today_count >= user.daily_apply_limit:  # default 10
        return fail("daily_cap_reached")

    # 6. Monthly cap check (hard cap — no override)
    monthly_count = user.monthly_apply_count
    if monthly_count >= 250:
        return fail("monthly_cap_reached")

    # 7. Blacklist check
    if job.company_canonical in get_blacklist(user_id):
        return fail("company_blacklisted")

    # 8. Already applied (dedup check)
    existing = check_existing_application(user_id, job_id)
    if existing and existing.status != 'withdrawn':
        return fail("already_applied")

    return {"eligible": True, "reason": None}
```

## Output
```json
{
  "eligible": true,
  "reason": null
}
```

or on failure:
```json
{
  "eligible": false,
  "reason": "daily_cap_reached"
}
```

## After Each Successful Apply
Caller (Agent 12) must increment both counters:
```sql
UPDATE users SET
  daily_apply_count = daily_apply_count + 1,
  monthly_apply_count = monthly_apply_count + 1
WHERE id = :user_id;
```
