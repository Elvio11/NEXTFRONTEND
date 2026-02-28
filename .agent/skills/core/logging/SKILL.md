---
name: logging
description: Standardised agent logging to the agent_logs table. Use this skill in every agent to write structured logs on start, completion, and failure. Always set expires_at at INSERT time — 3 days for success, 30 days for errors.
---

# Skill: logging

## Purpose
Write structured logs to `agent_logs` so every agent run is auditable and debugging is always possible.

## Log on Agent Start
```python
log_id = insert_agent_log({
    "agent_name": "fit_scorer",
    "user_id": user_id,        # NULL for system-level agents (scraper, calibration)
    "run_id": run_uuid,        # groups multiple log rows for one agent run
    "status": "started",
    "expires_at": NOW() + INTERVAL '3 days'
})
```

## Log on Success
```python
update_agent_log(log_id, {
    "status": "completed",
    "duration_ms": elapsed_ms,
    "sarvam_tokens": token_count,
    "gemini_tokens": gemini_count,
    "metadata": {"records_processed": 143, "mode": "delta"}
})
```

## Log on Failure
```python
update_agent_log(log_id, {
    "status": "failed",
    "duration_ms": elapsed_ms,
    "error_message": str(exception)[:500],
    "expires_at": NOW() + INTERVAL '30 days'  # errors kept longer
})
```

## Log on Skip (eligibility not met)
```python
insert_agent_log({
    "status": "skipped",
    "agent_name": "auto_apply",
    "user_id": user_id,
    "metadata": {"skip_reason": "daily_cap_reached"},
    "expires_at": NOW() + INTERVAL '3 days'
})
```

## TTL Rules
- `status = 'completed'` or `'skipped'`: `expires_at = NOW() + INTERVAL '3 days'`
- `status = 'failed'`: `expires_at = NOW() + INTERVAL '30 days'`
- Set `expires_at` at INSERT time. pg_cron deletes at 3 AM IST daily: `DELETE FROM agent_logs WHERE expires_at < NOW()`

## run_id Usage
Use a shared `run_id` UUID when an agent produces multiple log rows for a single execution (e.g., Agent 9 logs one row per platform scraped). This allows filtering all rows for one run: `WHERE run_id = ?`
