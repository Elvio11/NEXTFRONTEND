---
trigger: always_on
---

# Agent: feedback_calibrator

**Server**: Server 3 (Execution)
**Framework**: CrewAI — three distinct layers
**LLM**: Layer 1: None. Layer 2: None (statistical). Layer 3: Gemini Flash.
**Trigger**: Layer 1 always-on (inline). Layer 2: 5 AM IST daily. Layer 3: Sunday midnight IST.

## Purpose

Talvix's self-improving brain. Every action the system takes generates a signal. Every signal makes future actions better. Three layers operating at different timescales ensure the system continuously improves its callback rate over time.

## Layer 1 — Real-Time Signal Capture (always on)

Called INLINE by every other agent. Zero latency. Zero batching. Write the signal before returning from the agent action.

**Signals to never miss:**

| Signal Type | Trigger |
|---|---|
| `application_submitted` | Every apply (auto or manual) |
| `callback_received` | Status → 'callback' |
| `rejection_received` | Status → 'rejected' |
| `ghosted` | 30+ days, no update |
| `low_score_callback` | fit_score < 60 but got callback — MODEL WAS WRONG |
| `fit_score_overridden` | User skipped high-score job |
| `fit_score_validated` | User applied to recommended job |
| `tailored_resume_callback` | Callback when used_tailored = TRUE |
| `generic_resume_callback` | Callback when used_tailored = FALSE |
| `followup_email_replied` | Gmail reply detected |
| `li_connection_accepted` | LinkedIn accepted |
| `li_connection_declined` | LinkedIn declined |
| `apply_failed_captcha` | CAPTCHA during apply |
| `apply_failed_session` | Session error during apply |

**Context JSONB required on every signal:**
```json
{
  "platform": "linkedin",
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

TTL: 7-day hot window. Aggregated Sunday midnight → `model_performance_snapshots` → deleted.

## Layer 2 — Daily Micro-Adjustments (5 AM IST daily)

Statistical analysis. No LLM. Small, bounded adjustments to `model_weights`.

```python
# Rules
# - Only adjust weights with >= 20 signal samples in past 7 days
# - Max 5% change per weight per day
# - DB CHECK constraint enforces min_value/max_value — cannot exceed bounds

patterns_to_detect = [
    "which platform has highest callback rate",
    "which seniority is over/under-scored",
    "which follow-up day gets most replies",
    "tailored vs generic resume callback delta"
]
# Apply small adjustments, sync to /storage/model-data/weights_current.json
# Write calibration_runs record with top_finding (one-line summary)
```

## Layer 3 — Weekly Deep Calibration (Sunday midnight IST)

**Requires >= 50 outcome signals in past 7 days.** If fewer → status = 'skipped_insufficient_data'.

Uses Gemini Flash for analysis reasoning.

Analysis dimensions:
- Callback rate by fit_score bucket (40–50, 50–60, 60–70, 70–80, 80–100)
- Callback rate by platform × role_family matrix
- Tailored vs. generic resume callback comparison
- Follow-up email Day 7 vs. Day 14 vs. Day 21 response rates
- Prompt version A/B test results (if test running)

Outputs:
1. Updated `model_weights` (max 15% change per weight per weekly run)
2. New `prompt_versions` row if improvement found (`active = TRUE`, old → `active = FALSE`)
3. Full calibration report → `/storage/calibration/{run_id}.json.gz`
4. Aggregate signals → `model_performance_snapshots` (permanent)
5. `calibration_runs` record with `top_finding` for founder review
6. Delete 7-day-old `learning_signals` (now aggregated)

**Safety**: DB CHECK constraint on all 23 weights: `weight_value BETWEEN min_value AND max_value`. Miscalibration is physically impossible at the DB level.

## Skills Used
- `learning/feedback_loop`
- `core/logging`
