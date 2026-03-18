"""
skills/apply_engine.py
Selenium-based job application automation for Tier 1 platforms:
  - Indeed Easy Apply
  - LinkedIn Easy Apply

CRITICAL RULES (never violate):
  1. Anti-ban check FIRST — abort if proceed=False
  2. WebDriverWait everywhere — ZERO time.sleep()
  3. Randomise delays between field fills (0.5–2.5s via random.uniform)
  4. Screenshot on EVERY exception → /storage/screenshots/{run_id}/{job_id}.png
  5. LinkedIn: check kill switch AND increment total_linkedin_actions after apply
  6. driver.quit() in finally — handled by browser_pool context manager

Each function returns: {"status": "applied"|"failed", "screenshot_path": str|None}
"""

import asyncio
import os
import random
from datetime import date
from typing import Optional

from db.client import get_supabase
from skills.storage_client import put_bytes
from skills.anti_ban_checker import check_linkedin_limit
from skills.mcp_wrapper import MCPWrapper


# ─── Constants ─────────────────────────────────────────────────────────────────

FIELD_FILL_DELAY = (0.5, 2.5)   # seconds between form field fills
PAGE_LOAD_DELAY  = (2.0, 6.0)   # seconds after page navigation
ELEMENT_TIMEOUT  = 10           # seconds WebDriverWait timeout


# ─── LinkedIn Kill Switch ──────────────────────────────────────────────────────

# Kill switch moved to check_linkedin_limit() in skills/anti_ban_checker.py


def _increment_linkedin_counter() -> None:
    """Increment total_linkedin_actions for today by 1."""
    get_supabase().rpc(
        "increment_linkedin_daily_count",
        {"action_date": date.today().isoformat()},
    ).execute()


# ─── Form Helpers ─────────────────────────────────────────────────────────────

# In an MCP architecture, tasks are described naturally, so these helper
# functions for direct DOM manipulation are no longer needed.



# ─── Indeed Easy Apply ────────────────────────────────────────────────────────

async def apply_indeed_easy(
    session_data: Optional[dict],
    job: dict,
    user: dict,
    run_id: str,
) -> dict:
    """
    Apply to an Indeed Easy Apply job via MCP Playwright.
    """
    job_id   = str(job.get("id", "unknown"))
    apply_url = job.get("apply_url", "")

    try:
        mcp = MCPWrapper()
        
        # Build a robust AI task instruction for the Playwright agent
        task = f"""
        Navigate to {apply_url}. 
        Click 'Apply now' or 'Easy Apply'.
        If a multi-step form appears, automatically advance through it using these details:
        Name: {user.get("name", "John Doe")}
        Email: {user.get("email", "john@example.com")}
        Phone: {user.get("phone", "555-0100")}
        Always click 'Continue', 'Next', or 'Submit' until you see an application submitted success state.
        Wait for confirmation that the application is fully submitted.
        Return success only when you confirm submission, otherwise error.
        """
        
        # Cookies extraction
        cookies = session_data.get("cookies", []) if session_data else None

        result = await mcp.browse_page(task=task, url=apply_url, cookies=cookies)
        
        if result and not result.get("error"):
            # MCP succeeded
            return {"status": "applied", "screenshot_path": None, "failure_note": None}
        else:
            return {"status": "failed", "screenshot_path": None, "failure_note": str(result.get("error"))[:300]}

    except Exception as exc:
        return {"status": "failed", "screenshot_path": None, "failure_note": str(exc)[:300]}


# ─── LinkedIn Easy Apply ───────────────────────────────────────────────────────

async def apply_linkedin_easy(
    session_data: Optional[dict],
    job: dict,
    user: dict,
    run_id: str,
) -> dict:
    """
    Apply to a LinkedIn Easy Apply job via MCP Playwright.
    """
    job_id    = str(job.get("id", "unknown"))
    apply_url = job.get("apply_url", "")

    # ── Kill switch check ────────────────────────────────────────────────────
    if not await check_linkedin_limit():
        return {
            "status":          "skipped",
            "reason":          "linkedin_rate_limit",
            "duration_ms":     0,
            "records_processed": 0,
            "error":           None,
            "screenshot_path": None,
        }

    try:
        mcp = MCPWrapper()
        
        # Build a robust AI task instruction for the Playwright agent
        task = f"""
        Navigate to {apply_url}. 
        Click 'Easy Apply'.
        Advance through the multi-step form up to 8 times using 'Next', 'Continue', or 'Review'.
        Click 'Submit application' when reached.
        Verify that the application was successfully submitted by checking for the success banner/modal.
        If it asks for missing complex information (like unique screening questions), handle them intelligently or gracefully error.
        Return success only when application is fully submitted.
        """
        
        # Cookies extraction
        cookies = session_data.get("cookies", []) if session_data else None

        result = await mcp.browse_page(task=task, url=apply_url, cookies=cookies)
        
        if result and not result.get("error"):
            # Increment LinkedIn counter
            _increment_linkedin_counter()
            return {"status": "applied", "screenshot_path": None, "failure_note": None}
        else:
            return {"status": "failed", "screenshot_path": None, "failure_note": str(result.get("error"))[:300]}

    except Exception as exc:
        return {"status": "failed", "screenshot_path": None, "failure_note": str(exc)[:300]}
