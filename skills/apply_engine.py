"""
skills/apply_engine.py
V4 Reactive Apply Engine (MCP + Playwright).

Automates 'Easy Apply' flows on Tier 1 platforms:
  - Indeed Easy Apply
  - LinkedIn Easy Apply

Logic now features a reactive human-in-the-loop (via Sarvam-M) Q&A system
integrated directly into the Playwright MCP interaction layer.
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
from llm.sarvam import sarvam


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
        from llm.sarvam import sarvam
        
        # Initial standard info
        user_info = f"Name: {user.get('name')}, Email: {user.get('email')}, Phone: {user.get('phone')}"
        resume_content = user.get("resume_text", "No resume provided.")
        
        # Reactive Q&A Loop
        max_steps = 10
        current_step = 0
        while current_step < max_steps:
            task = f"""
            Navigate to {apply_url} (if not already there).
            Advance the application. If you hit a question you can't answer with standard info ({user_info}), 
            stop immediately and return 'NEED_ANSWER: [Question Text]'.
            Otherwise, click 'Continue', 'Next', or 'Submit' until finished.
            Return 'SUCCESS' if fully submitted.
            """
            
            cookies = session_data.get("cookies", []) if session_data else None
            result = await mcp.browse_page(task=task, url=apply_url, cookies=cookies)
            
            output = str(result.get("content") or result.get("text") or result)
            
            if "SUCCESS" in output:
                return {"status": "applied", "screenshot_path": None, "failure_note": None}
            
            if "NEED_ANSWER:" in output:
                parts = output.split("NEED_ANSWER:")
                if len(parts) > 1:
                    question = parts[1].strip()
                    # Ask Sarvam for the answer based on resume
                    ans_prompt = f"Using this resume: {resume_content}\n\nAnswer this job application question as concisely as possible: {question}"
                    answer = await sarvam.complete(ans_prompt, mode="precise")
                    
                    # Update user_info with the new answer for the next iteration
                    user_info += f", {question}: {answer}"
                    current_step += 1
                    continue
            
            if result.get("error"):
                error_val = result.get("error")
                error_str = str(error_val) if error_val else "Unknown error"
                return {"status": "failed", "screenshot_path": None, "failure_note": error_str[:300]}
                
            break # Finished or stuck without explicit NEED_ANSWER

        return {"status": "failed", "screenshot_path": None, "failure_note": "Application timed out or stalled."}

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
        from llm.sarvam import sarvam

        user_info = f"Full Name: {user.get('name')}, Email: {user.get('email')}, Phone: {user.get('phone')}"
        resume_content = user.get("resume_text", "No resume provided.")

        max_steps = 12
        current_step = 0
        while current_step < max_steps:
            task = f"""
            Navigate to {apply_url} (if not already there).
            Click 'Easy Apply'.
            Advance through the form. If you hit a question requiring complex info beyond {user_info}, 
            stop and return 'NEED_ANSWER: [Question text]'.
            Otherwise, click 'Next', 'Continue', or 'Review' and then 'Submit application'.
            Return 'SUCCESS' if fully submitted and you see the confirmation.
            """
            
            cookies = session_data.get("cookies", []) if session_data else None
            result = await mcp.browse_page(task=task, url=apply_url, cookies=cookies)
            
            output = str(result.get("content") or result.get("text") or result)

            if "SUCCESS" in output:
                _increment_linkedin_counter()
                return {"status": "applied", "screenshot_path": None, "failure_note": None}

            if "NEED_ANSWER:" in output:
                parts = output.split("NEED_ANSWER:")
                if len(parts) > 1:
                    question = parts[1].strip()
                    ans_prompt = f"Using this resume: {resume_content}\n\nAnswer this job application question for LinkedIn: {question}"
                    answer = await sarvam.complete(ans_prompt, mode="precise")
                    
                    user_info += f", {question}: {answer}"
                    current_step += 1
                    continue

            if result.get("error"):
                error_val = result.get("error")
                error_str = str(error_val) if error_val else "Unknown error"
                return {"status": "failed", "screenshot_path": None, "failure_note": error_str[:300]}

            break # Finished or stuck

        return {"status": "failed", "screenshot_path": None, "failure_note": "LinkedIn application timed out or stalled."}

    except Exception as exc:
        return {"status": "failed", "screenshot_path": None, "failure_note": str(exc)[:300]}
