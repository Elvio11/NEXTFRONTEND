import asyncio
import os
import json
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timezone, timedelta

# Import agents
from agents.agent15_calibrator import run_daily_calibration, run_weekly_calibration

async def test_agent15_calibration():
    print("\n--- Testing Agent 15 Calibration ---")
    # Mock log_start to avoid DB errors during logging if table is messy
    # (Actually it should work if DB is synced)
    
    # Daily
    print("Running Daily Calibration...")
    daily_res = await run_daily_calibration()
    print(f"Agent 15 Daily Result: {daily_res}")
    
    # Weekly (will skip if < 50 signals, but we test the function call)
    print("\nRunning Weekly Calibration...")
    weekly_res = await run_weekly_calibration()
    print(f"Agent 15 Weekly Result: {weekly_res}")

if __name__ == "__main__":
    asyncio.run(test_agent15_calibration())
