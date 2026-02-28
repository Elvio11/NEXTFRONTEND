---
name: feedback_loop
description: The self-learning brain — three layers operating at different timescales. Use this skill when Agent 15 (feedback_calibrator) needs to capture a signal (Layer 1), run daily weight micro-adjustments (Layer 2), or execute weekly deep calibration (Layer 3). Layer 1 is always-on and called inline by other agents. Layers 2 and 3 are scheduled. Hard DB bounds on all weights make miscalibration physically impossible.
---

# Skill: feedback_loop

## Layer 1 — Real-Time Signal Capture (always on, zero latency)
Called inline by every other agent at the moment an event occurs. Never batch. Never delay.

### Signal Write (called from any agent)
```python
def capture_signal(signal_type, user_id, signal_value, context):
    db.insert("learning_signals", {
        "signal_type": signal_type,
        "user_id": user_id,
        "signal_value": signal_value,         # numeric (fit_score, day_number, etc.)
        "context": context,                    # JSONB — see required fields below
        "prompt_version_id": get_active_prompt_version(signal_type),
        "expires_at": NOW() + INTERVAL '7 days'  # hot window — aggregated Sunday then deleted
    })
```

### Required Context JSONB (every signal)
```json
{
  "platform": "linkedin | indeed | naukri | ...",
  "fit_score": 72,
  "seniority": "mid",
  "work_mode": "hybrid",
  "user_persona": "professional",
  "role_family": "swe_backend",
  "exp_years": 4,
  "used_tailored": true,
  "followup_count": 1,
  "days_since_apply": 7
}
```

### Signal Types — Never Miss These
| Signal Type | Trigger | Capturing Agent |
|---|---|---|
| `application_submitted` | Every apply (auto or manual) | auto_apply / user action |
| `application_viewed` | Status update from platform | follow_up Gmail scan |
| `callback_received` | Status → 'callback' | follow_up |
| `interview_scheduled` | interview_scheduled_at set | follow_up / user |
| `offer_received` | Status → 'offer' | follow_up / user |
| `rejection_received` | Status → 'rejected' | follow_up |
| `ghosted` | 30+ days, no update | pg_cron / follow_up |
| `low_score_callback` | fit_score < 60 but got callback | follow_up — MOST CRITICAL |
| `fit_score_overridden` | User skipped high-score job | user action |
| `fit_score_validated` | User applied to recommended job | user action |
| `tailored_resume_callback` | Callback, used_tailored = true | follow_up |
| `generic_resume_callback` | Callback, used_tailored = false | follow_up |
| `followup_email_replied` | Gmail reply detected | email_followup |
| `li_connection_accepted` | LinkedIn request accepted | linkedin_outreach |
| `li_connection_declined` | LinkedIn request declined | linkedin_outreach |
| `apply_failed_captcha` | CAPTCHA during apply | auto_apply |
| `apply_failed_session` | Session error during apply | auto_apply |

---

## Layer 2 — Daily Micro-Adjustments (5 AM IST daily)
Statistical analysis only — no LLM. Small, bounded weight adjustments.

```python
def run_daily_calibration():
    signals = db.query("""
        SELECT * FROM learning_signals
        WHERE created_at > NOW() - INTERVAL '7 days'
        AND signal_type IN ('callback_received', 'rejection_received', 'low_score_callback',
                            'li_connection_accepted', 'li_connection_declined',
                            'followup_email_replied')
    """)

    # Only adjust weights with >= 20 signal samples
    if len(signals) < 20:
        log_calibration_skipped("insufficient_signals_layer2")
        return

    # Detect patterns
    platform_rates = compute_callback_rate_by_platform(signals)
    seniority_bias = compute_seniority_bias(signals)
    followup_day_rates = compute_followup_day_effectiveness(signals)

    # Apply adjustments — HARD LIMIT: max 5% change per weight per day
    weights = db.query("SELECT * FROM model_weights")
    for weight in weights:
        new_value = compute_adjusted_value(weight, patterns)
        max_change = weight.weight_value * 0.05
        new_value = clamp(new_value, weight.weight_value - max_change, weight.weight_value + max_change)
        # DB CHECK constraint enforces min_value/max_value — cannot exceed bounds
        db.update("model_weights", weight.id, {"weight_value": new_value})

    # Sync to FluxShare
    write_json("/storage/model-data/weights_current.json", get_all_weights())

    # Log calibration run
    db.insert("calibration_runs", {
        "layer": 2,
        "status": "completed",
        "weights_adjusted": adjusted_count,
        "top_finding": generate_one_line_summary(patterns)
    })
```

---

## Layer 3 — Weekly Deep Calibration (Sunday midnight IST)
Requires >= 50 outcome signals in past 7 days. Uses Gemini Flash for analysis.

```python
def run_weekly_calibration():
    outcome_signals = db.query("""
        SELECT * FROM learning_signals
        WHERE created_at > NOW() - INTERVAL '7 days'
        AND signal_type IN ('callback_received', 'rejection_received', 'offer_received',
                            'interview_scheduled', 'low_score_callback')
    """)

    if len(outcome_signals) < 50:
        db.insert("calibration_runs", {
            "layer": 3,
            "status": "skipped_insufficient_data",
            "signals_available": len(outcome_signals),
            "signals_required": 50
        })
        return

    # Deep analysis dimensions (Gemini Flash)
    analysis = gemini_flash.analyze({
        "callback_rate_by_score_bucket": group_by_score_bucket(outcome_signals),
        "callback_rate_by_platform_x_role": group_by_platform_role(outcome_signals),
        "tailored_vs_generic_delta": compute_tailoring_lift(outcome_signals),
        "followup_day_response_rates": group_by_followup_day(outcome_signals),
        "active_ab_test_results": get_ab_test_results()
    })

    # Update weights (max 15% change per weekly run)
    update_weights_from_analysis(analysis, max_change_pct=0.15)

    # New prompt version if improvement found
    if analysis.get("better_prompt_found"):
        db.insert("prompt_versions", {
            "agent_name": analysis["agent"],
            "prompt_text": analysis["new_prompt"],
            "active": True,   # old version set active=False by unique partial index
            "hypothesis": analysis["hypothesis"]
        })

    # Outputs
    write_gzip(f"/storage/calibration/{run_id}.json.gz", analysis)
    db.insert("model_performance_snapshots", aggregate_weekly_stats(outcome_signals))
    db.insert("calibration_runs", {
        "layer": 3,
        "status": "completed",
        "top_finding": analysis["top_finding"],  # one-line human summary for founder
        "prompt_version_id": new_prompt_version_id
    })

    # Delete 7-day-old signals (now aggregated)
    db.execute("DELETE FROM learning_signals WHERE expires_at < NOW()")
```

## Safety — All 23 Weights Are Bounded
```sql
-- DB-level CHECK constraint — calibration CANNOT exceed bounds
ALTER TABLE model_weights ADD CONSTRAINT weight_bounds
  CHECK (weight_value BETWEEN min_value AND max_value);
-- This makes miscalibration physically impossible at the DB level
```
