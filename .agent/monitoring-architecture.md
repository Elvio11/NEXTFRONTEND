# Monitoring Architecture

## What Gets Monitored

### Agent Health (system_health_metrics — hourly snapshots)
- agent_success_rate: % of agent runs completing without error
- avg_agent_latency_ms: average duration across all agent runs in the hour
- failed_agents: array of agent names that errored this hour

### Scraping Health
- scrape_yield: new_jobs / total_scraped (target: > 15%)
- scrape_dedup_rate: refreshed_jobs / total_scraped (healthy: 70-85%)
- source_failures: platforms that returned no results or errored

### Apply Health
- apply_success_rate: successful submits / attempts (target: > 85%)
- captcha_rate: CAPTCHA hits / attempts (alert if > 5%)
- session_failure_rate: invalid sessions / apply attempts (alert if > 10%)

### LLM Health
- sarvam_error_rate: failed Sarvam API calls / total (alert if > 2%)
- gemini_error_rate: failed Gemini API calls / total (alert if > 5%)
- avg_llm_latency_ms: average LLM response time

### Infrastructure
- disk_used_gb / disk_free_gb: FluxShare disk usage
- wa_bot_health table: single-row monitor of Baileys socket status

## Metrics Storage
- system_health_metrics table: one row per hour, 90-day TTL
- Cleaned by pg_cron: DELETE WHERE expires_at < NOW() at 6 AM UTC daily
- agent_logs table: every run logged. 3-day TTL on success, 30-day on failure.

## WA Bot Health (wa_bot_health — single row)
- status: connected | reconnecting | disconnected
- last_connected_at, last_disconnected_at
- reconnect_count: auto-reconnect attempts since last successful connect
- messages_sent_today: resets midnight via pg_cron
- If status = 'disconnected' for > 5 minutes → alert founder via secondary channel

## Alerts (WhatsApp to founder's number)
| Condition | Alert |
|---|---|
| captcha_rate > 5% | "CAPTCHA spike detected — {count} hits in last hour" |
| apply_success_rate < 75% | "Apply success rate dropped to {rate}%" |
| sarvam_error_rate > 2% | "Sarvam API errors elevated — check Server 2" |
| scrape_yield < 10% | "Low scrape yield — check proxy / platform access" |
| wa_bot disconnected > 5min | "Baileys socket disconnected — reconnect needed" |
| session_failure_rate > 10% | "High session failure rate — bulk session expiry?" |
| disk_free_gb < 10 | "FluxShare disk low: {free}GB remaining" |

## Calibration Monitoring (callback rate — the primary health signal)
The ultimate system health metric is callback_rate from model_performance_snapshots.

| callback_rate | Status | Action |
|---|---|---|
| > 12% | Excellent | No change |
| 8–12% | Healthy | Normal micro-adjustments |
| 5–8% | Degraded | Emergency Layer 2 calibration |
| < 5% | Critical | Emergency Layer 3 calibration + founder review |

Emergency calibrations (not Sunday-only) trigger when callback_rate drops below threshold for 3 consecutive days.
