import asyncio
import os
import json
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()

# Import agents
from agents.agent12_applier import run_applier
from agents.agent14_follow_up import run_follow_up

async def test_agent12_gating():
    print("\n--- Testing Agent 12 Gating ---")
    user_id = "11111111-1111-1111-1111-111111111111"
    
    # Mock time window to be open
    with patch("agents.agent12_applier._is_in_apply_window", return_value=True):
        # Mock apply functions to avoid real browser
        with patch("agents.agent12_applier.apply_linkedin_easy", new_callable=AsyncMock) as mock_li:
            mock_li.return_value = {"status": "applied", "screenshot_path": None}
            with patch("agents.agent12_applier.apply_indeed_easy", new_callable=AsyncMock) as mock_ind:
                mock_ind.return_value = {"status": "applied", "screenshot_path": None}
            
                # Mock session decryption
                with patch("agents.agent12_applier.decrypt_session", return_value={"cookies": []}):
                    # Mock anti-ban
                    with patch("agents.agent12_applier._call_anti_ban", new_callable=AsyncMock) as mock_anti:
                        mock_anti.return_value = {"proceed": True, "risk_level": "low"}
                        
                        # Mock notification to avoid real HTTP call
                        with patch("agents.agent12_applier._send_wa_notification", new_callable=AsyncMock):
                            result = await run_applier(user_id, apply_tier=1, max_applies=1)
                            print(f"Agent 12 Gated Result: {result}")

async def test_agent14_logic():
    print("\n--- Testing Agent 14 Logic ---")
    # Mock refresh token and detected interview
    with patch("agents.agent14_follow_up._refresh_google_token", new_callable=AsyncMock) as mock_token:
        mock_token.return_value = "mock_token"
        with patch("agents.agent14_follow_up._detect_interview_and_notify", new_callable=AsyncMock) as mock_detect:
            with patch("agents.agent14_follow_up._send_gmail", new_callable=AsyncMock) as mock_send:
                result = await run_follow_up()
                print(f"Agent 14 Result: {result}")

async def main():
    try:
        await test_agent12_gating()
    except Exception as e:
        print(f"Agent 12 Test Failed: {e}")
        import traceback
        traceback.print_exc()
        
    try:
        await test_agent14_logic()
    except Exception as e:
        print(f"Agent 14 Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
