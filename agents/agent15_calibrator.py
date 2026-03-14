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

from db.client import supabase
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
            supabase.table("learning_signals")
            .select("*")
            .gte("created_at", cutoff)
            .execute()
        )
        
        if not signals.data or len(signals.data) < 10:
            msg = f"Insufficient signals for daily calibration ({len(signals.data or [])} < 10)"
            await log_skip(run_id, msg)
            return {"status": "skipped", "duration_ms": int((time.time()-start)*1000), "records_processed": 0, "error": msg}

        # 2. Logic to compute deltas (simplified for stub)
        # In a real implementation, we'd iterate through weights and calculate success rates.
        weights = supabase.table("model_weights").select("*").execute()
        adjusted_count = 0
        
        for w in (weights.data or []):
            current_val = w["weight_value"]
            # Mock success-based shift: ±2%
            # Real logic would correlate w["weight_key"] with signals
            shift = random_shift() # Placeholder
            new_val = current_val * (1 + shift)
            
            # Bound check (max 5% daily)
            max_delta = current_val * 0.05
            new_val = max(current_val - max_delta, min(current_val + max_delta, new_val))
            
            # Clamp to absolute DB bounds
            new_val = max(w.get("min_value", 0), min(w.get("max_value", 100), new_val))
            
            if new_val != current_val:
                supabase.table("model_weights").update({
                    "weight_value": new_val,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", w["id"]).execute()
                adjusted_count += 1

        # 3. Record run
        supabase.table("calibration_runs").insert({
            "run_type":         "daily",
            "signals_used":     len(signals.data),
            "weights_adjusted": adjusted_count,
            "summary":          {"adjusted_keys_count": adjusted_count},
        }).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, adjusted_count, duration_ms)
        return {"status": "success", "duration_ms": duration_ms, "records_processed": adjusted_count, "error": None}

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(e), duration_ms)
        return {"status": "failed", "duration_ms": duration_ms, "records_processed": 0, "error": str(e)}

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
            supabase.table("learning_signals")
            .select("*")
            .gte("created_at", cutoff)
            .limit(1000)
            .execute()
        )
        
        if not signals.data or len(signals.data) < 50:
            msg = f"Insufficient signals for weekly calibration ({len(signals.data or [])} < 50)"
            await log_skip(run_id, msg)
            return {"status": "skipped", "duration_ms": int((time.time()-start)*1000), "records_processed": 0, "error": msg}

        # 2. Fetch current weights and prompts context
        weights = supabase.table("model_weights").select("*").execute().data
        prompts = supabase.table("prompt_versions").select("*").eq("is_active", True).execute().data

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
        analysis = json.loads(raw_analysis)
        
        adjusted_count = 0
        for key, rec in analysis.get("adjustments", {}).items():
            if rec.get("confidence", 0) >= 0.7:
                # Apply with weekly bounds (20%)
                # Search weight by key
                w_row = next((w for w in weights if w["weight_key"] == key), None)
                if w_row:
                    current_val = w_row["weight_value"]
                    new_val = rec["new_value"]
                    
                    max_delta = current_val * 0.20
                    new_val = max(current_val - max_delta, min(current_val + max_delta, new_val))
                    new_val = max(w_row.get("min_value", 0), min(w_row.get("max_value", 100), new_val))
                    
                    if new_val != current_val:
                        supabase.table("model_weights").update({
                            "weight_value": new_val,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }).eq("id", w_row["id"]).execute()
                        adjusted_count += 1

        # 4. Notify founder via S1
        s1_url = os.environ["SERVER1_URL"]
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{s1_url}/internal/notify",
                json={"type": "calibration_complete", "payload": analysis.get("summary")},
                headers={"x-agent-secret": os.environ["AGENT_SECRET"]}
            )

        # 5. Records
        supabase.table("calibration_runs").insert({
            "run_type":         "weekly",
            "signals_used":     len(signals.data),
            "weights_adjusted": adjusted_count,
            "summary":          {"gemini_summary": analysis.get("summary")},
        }).execute()

        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, adjusted_count, duration_ms)
        return {"status": "success", "duration_ms": duration_ms, "records_processed": adjusted_count, "error": None}

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(e), duration_ms)
        return {"status": "failed", "duration_ms": duration_ms, "records_processed": 0, "error": str(e)}

# ─── Utils ───────────────────────────────────────────────────────────────────

def random_shift() -> float:
    """Mock shift for stub. Real code would use statistical models."""
    import random
    return random.uniform(-0.02, 0.02)
