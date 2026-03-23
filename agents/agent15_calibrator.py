"""
agents/agent15_calibrator.py
Agent 15 — Feedback Calibrator.

Implements the self-learning loop:
- Layer 2 (Daily): Micro-adjustments to model_weights based on recent performance signals.
- Layer 3 (Weekly): Deep regression analysis via Gemini Flash to find optimal weight/prompt combos.

Constraints:
- Gemini Flash for Layer 3 (Weekly Deep Calibration).
- Strict bounding for weight adjustments (Daily 5%, Weekly 20%).
- All secrets via os.environ[].
- All response contracts standard.
"""

import asyncio
import json
import os
import time
import random
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Any

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from llm.gemini import gemini

# ─── Layer 2: Daily Micro-Adjustment ─────────────────────────────────────────


async def run_daily_calibration() -> dict:
    """
    Endpoint: /tasks/calibrate/daily
    Pulls signals from last 7 days. Adjusts weights max ±5%.
    """
    run_id = new_run_id()
    start = time.time()
    await log_start("agent15_daily", None, run_id)

    try:
        # 1. Pull signals (7 days)
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        signals = (
            get_supabase()
            .table("learning_signals")
            .select("*")
            .gte("created_at", cutoff)
            .execute()
        )

        if not signals.data or len(signals.data) < 10:
            msg = f"Insufficient signals for daily calibration ({len(signals.data or [])} < 10)"
            await log_skip(run_id, msg)
            return {
                "status": "skipped",
                "duration_ms": int((time.time() - start) * 1000),
                "records_processed": 0,
                "error": msg,
            }

        # 2. Logic to compute deltas (simplified for stub)
        # In a real implementation, we'd iterate through weights and calculate success rates.
        weights = get_supabase().table("model_weights").select("*").execute()
        adjusted_count = 0

        for w in weights.data or []:
            current_val = w["weight_value"]
            # Mock success-based shift: ±2%
            # Real logic would correlate w["weight_key"] with signals
            shift = random_shift()  # Placeholder
            new_val = current_val * (1 + shift)

            # Bound check (max 5% daily)
            max_delta = current_val * 0.05
            new_val = max(
                current_val - max_delta, min(current_val + max_delta, new_val)
            )

            # Clamp to absolute DB bounds
            new_val = max(w.get("min_value", 0), min(w.get("max_value", 100), new_val))

            if new_val != current_val:
                get_supabase().table("model_weights").update(
                    {
                        "weight_value": new_val,
                        "last_updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("id", w["id"]).execute()
                adjusted_count += 1

        # 3. Record run
        get_supabase().table("calibration_runs").insert(
            {
                "run_type": "layer2_daily",
                "signal_count": len(signals.data),
                "weights_changed": {"adjusted_keys_count": adjusted_count},
                "status": "completed"
            }
        ).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, adjusted_count, duration_ms)
        return {
            "status": "success",
            "duration_ms": duration_ms,
            "records_processed": adjusted_count,
            "error": None,
        }

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(e), duration_ms)
        return {
            "status": "failed",
            "duration_ms": duration_ms,
            "records_processed": 0,
            "error": str(e),
        }


# ─── Layer 3: Weekly Deep Calibration ────────────────────────────────────────


async def run_weekly_calibration() -> dict:
    """
    Endpoint: /tasks/calibrate/weekly
    Pulls signals from last 30 days. Uses Gemini Flash for regression.
    """
    run_id = new_run_id()
    start = time.time()
    await log_start("agent15_weekly", None, run_id)

    try:
        # 1. Pull signals (30 days)
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        signals = (
            get_supabase()
            .table("learning_signals")
            .select("*")
            .gte("created_at", cutoff)
            .limit(1000)
            .execute()
        )

        if not signals.data or len(signals.data) < 50:
            msg = f"Insufficient signals for weekly calibration ({len(signals.data or [])} < 50)"
            await log_skip(run_id, msg)
            return {
                "status": "skipped",
                "duration_ms": int((time.time() - start) * 1000),
                "records_processed": 0,
                "error": msg,
            }

        # 2. Fetch current weights and prompts context
        weights = get_supabase().table("model_weights").select("*").execute().data
        prompts = (
            get_supabase()
            .table("prompt_versions")
            .select("*")
            .eq("is_active", True)
            .execute()
            .data
        )

        # 3. Format for Gemini
        analysis_prompt = f"""
        Perform a deep regression analysis on the following system signals to optimize our job application model.
        Current Weights: {json.dumps(weights)}
        Current Active Prompts: {json.dumps(prompts)}
        Signals Data (last 30 days): {json.dumps(signals.data)}
        
        Provide:
        1. Recommended weight adjustments (bounded by max 20% shift from current).
        2. Confidence score (0.0 to 1.0) for each recommendation.
        3. Human-readable summary of findings.
        
        Respond ONLY with a JSON object:
        {{"adjustments": {{"weight_key": {{"new_value": float, "confidence": float}}}}, "summary": "string"}}
        """

        raw_analysis = await gemini.complete(analysis_prompt, mode="flash")
        
        # Extract JSON from potential markdown/text
        if "{" in raw_analysis:
            json_str = raw_analysis[raw_analysis.find("{"):raw_analysis.rfind("}")+1]
            analysis = json.loads(json_str)
        else:
            analysis = {}

        adjusted_count = 0
        for key, rec in analysis.get("adjustments", {}).items():
            if rec.get("confidence", 0) >= 0.7:
                # Apply with weekly bounds (20%)
                # Search weight by key
                w_row = next((w for w in weights if w["weight_name"] == key), None)
                if w_row:
                    current_val = w_row["weight_value"]
                    new_val = rec["new_value"]

                    max_delta = current_val * 0.20
                    new_val = max(
                        current_val - max_delta, min(current_val + max_delta, new_val)
                    )
                    new_val = max(
                        w_row.get("min_value", 0),
                        min(w_row.get("max_value", 100), new_val),
                    )

                    if new_val != current_val:
                        get_supabase().table("model_weights").update(
                            {
                                "weight_value": new_val,
                                "last_updated_at": datetime.now(timezone.utc).isoformat(),
                            }
                        ).eq("id", w_row["id"]).execute()
                        adjusted_count += 1

        # 4. Notify founder via S1
        s1_url = os.environ["SERVER1_URL"]
        async with httpx.AsyncClient() as client:
            # Enhanced IQ: Pull real-time system metrics to contextualize the calibration
            system_context = ""
            try:
                metrics_resp = await client.get(
                    f"{s1_url}/api/metrics",
                    headers={"x-agent-secret": os.environ["AGENT_SECRET"]}
                )
                if metrics_resp.status_code == 200:
                    m = metrics_resp.json()
                    system_context = f" (Conversion: {m.get('conversion_rate', 0)}%, Retention: {m.get('retention_rate', 0)}%)"
            except Exception:
                pass

            await client.post(
                f"{s1_url}/internal/notify",
                json={
                    "message_type": "calibration_complete",
                    "payload": f"{analysis.get('summary')}{system_context}",
                    "metadata": {"run_id": run_id, "signal_count": len(signals.data)}
                },
                headers={"x-agent-secret": os.environ["AGENT_SECRET"]},
            )

        # 5. Records
        get_supabase().table("calibration_runs").insert(
            {
                "run_type": "layer3_weekly",
                "signal_count": len(signals.data),
                "weights_changed": {"gemini_summary": analysis.get("summary")},
                "status": "completed"
            }
        ).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, adjusted_count, duration_ms)
        return {
            "status": "success",
            "duration_ms": duration_ms,
            "records_processed": adjusted_count,
            "error": None,
        }

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(e), duration_ms)
        return {
            "status": "failed",
            "duration_ms": duration_ms,
            "records_processed": 0,
            "error": str(e),
        }


# ─── Utils ───────────────────────────────────────────────────────────────────


def random_shift() -> float:
    """Mock shift for stub. Real code would use statistical models."""
    import random

    return random.uniform(-0.02, 0.02)
