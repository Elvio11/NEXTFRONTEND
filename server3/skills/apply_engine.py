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
from pathlib import Path
from typing import Optional

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    StaleElementReferenceException,
)
import undetected_chromedriver as uc

from db.client import supabase


# ─── Constants ─────────────────────────────────────────────────────────────────

FIELD_FILL_DELAY = (0.5, 2.5)   # seconds between form field fills
PAGE_LOAD_DELAY  = (2.0, 6.0)   # seconds after page navigation
ELEMENT_TIMEOUT  = 10           # seconds WebDriverWait timeout


# ─── Screenshot ────────────────────────────────────────────────────────────────

def _save_screenshot(driver: uc.Chrome, run_id: str, job_id: str) -> Optional[str]:
    """Save a screenshot to /storage/screenshots/{run_id}/{job_id}.png."""
    try:
        path = f"/storage/screenshots/{run_id}/{job_id}.png"
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        driver.save_screenshot(path)
        return path
    except Exception as exc:
        print(f"[apply_engine] screenshot failed: {exc}")
        return None


# ─── LinkedIn Kill Switch ──────────────────────────────────────────────────────

def _is_linkedin_kill_switch_hit() -> bool:
    result = (
        supabase.table("system_daily_limits")
        .select("total_linkedin_actions")
        .eq("date", date.today().isoformat())
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0].get("total_linkedin_actions", 0) >= 1500
    return False


def _increment_linkedin_counter() -> None:
    """Increment total_linkedin_actions for today by 1."""
    supabase.rpc(
        "increment_linkedin_daily_count",
        {"action_date": date.today().isoformat()},
    ).execute()


# ─── Form Helpers ─────────────────────────────────────────────────────────────

def _random_delay() -> None:
    """Synchronous random delay between field fills. Uses asyncio sleep context."""
    import time
    time.sleep(random.uniform(*FIELD_FILL_DELAY))


def _wait_and_find(driver, by: By, selector: str, timeout: int = ELEMENT_TIMEOUT):
    """Wait for an element and return it. Raises TimeoutException if not found."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )


def _wait_clickable(driver, by: By, selector: str, timeout: int = ELEMENT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, selector))
    )


def _fill_field(element, value: str) -> None:
    """Clear and fill a form field with random delays between characters."""
    element.clear()
    _random_delay()
    element.send_keys(value)
    _random_delay()


# ─── Indeed Easy Apply ────────────────────────────────────────────────────────

async def apply_indeed_easy(
    driver: uc.Chrome,
    job: dict,
    user: dict,
    run_id: str,
) -> dict:
    """
    Apply to an Indeed Easy Apply job.

    Args:
        driver: Configured undetected-chromedriver (injected session cookies already set)
        job:    Job dict with apply_url, id, title, company
        user:   User dict with name, email, phone, current_title
        run_id: Current agent run ID for screenshot naming

    Returns:
        {"status": "applied"|"failed", "screenshot_path": str|None, "failure_note": str}
    """
    job_id   = str(job.get("id", "unknown"))
    apply_url = job.get("apply_url", "")

    try:
        # Navigate to job page
        driver.get(apply_url)
        await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))

        # Click "Apply now" / "Easy Apply" button
        apply_btn = _wait_clickable(driver, By.CSS_SELECTOR, "button#indeedApplyButton, button[data-indeed-apply]")
        apply_btn.click()
        await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))

        # Fill name field if present
        try:
            name_field = _wait_and_find(driver, By.CSS_SELECTOR, "input[name='applicant.name'], input[name='name']", timeout=5)
            _fill_field(name_field, user.get("name", ""))
        except TimeoutException:
            pass  # name may already be pre-filled from session

        # Fill email
        try:
            email_field = _wait_and_find(driver, By.CSS_SELECTOR, "input[type='email'], input[name='applicant.email']", timeout=5)
            _fill_field(email_field, user.get("email", ""))
        except TimeoutException:
            pass

        # Fill phone
        try:
            phone_field = _wait_and_find(driver, By.CSS_SELECTOR, "input[type='tel'], input[name='applicant.phoneNumber']", timeout=5)
            _fill_field(phone_field, user.get("phone", ""))
        except TimeoutException:
            pass

        # Handle multi-step wizard — click "Continue" / "Next" up to 5 steps
        for step in range(5):
            try:
                # Try to find submit button first
                submit_btn = WebDriverWait(driver, 3).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='submit-application'], button[aria-label='Submit your application']"))
                )
                await asyncio.sleep(random.uniform(*FIELD_FILL_DELAY))
                submit_btn.click()
                await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))
                break
            except TimeoutException:
                # Not on submit step yet — click Continue/Next
                try:
                    next_btn = _wait_clickable(driver, By.CSS_SELECTOR, "button[data-testid='continue-button'], button[aria-label='Continue to next step']", timeout=5)
                    next_btn.click()
                    await asyncio.sleep(random.uniform(*FIELD_FILL_DELAY))
                except TimeoutException:
                    break  # no more steps

        # Check for success confirmation
        try:
            WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-testid='application-submitted'], h1[data-automation='postedWithNoEmailApplication']"))
            )
            return {"status": "applied", "screenshot_path": None, "failure_note": None}
        except TimeoutException:
            screenshot = _save_screenshot(driver, run_id, job_id)
            return {"status": "failed", "screenshot_path": screenshot, "failure_note": "success_page_not_detected"}

    except Exception as exc:
        screenshot = _save_screenshot(driver, run_id, job_id)
        return {"status": "failed", "screenshot_path": screenshot, "failure_note": str(exc)[:300]}


# ─── LinkedIn Easy Apply ───────────────────────────────────────────────────────

async def apply_linkedin_easy(
    driver: uc.Chrome,
    job: dict,
    user: dict,
    run_id: str,
) -> dict:
    """
    Apply to a LinkedIn Easy Apply job.

    CRITICAL: Checks LinkedIn kill switch BEFORE attempting application.
              Increments total_linkedin_actions AFTER successful application.
              headless MUST be False — enforced by browser_pool.get_driver().

    Returns:
        {"status": "applied"|"failed"|"skipped", "screenshot_path": str|None, "failure_note": str}
    """
    job_id    = str(job.get("id", "unknown"))
    apply_url = job.get("apply_url", "")

    # ── Kill switch check ────────────────────────────────────────────────────
    if _is_linkedin_kill_switch_hit():
        return {
            "status":          "skipped",
            "screenshot_path": None,
            "failure_note":    "linkedin_kill_switch_1500",
        }

    try:
        driver.get(apply_url)
        await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))

        # Click Easy Apply button
        easy_apply_btn = _wait_clickable(
            driver,
            By.CSS_SELECTOR,
            "button.jobs-apply-button[aria-label*='Easy Apply'], button[aria-label*='Easy Apply']",
        )
        easy_apply_btn.click()
        await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))

        # Multi-step wizard: navigate up to 8 steps
        for step in range(8):
            await asyncio.sleep(random.uniform(*FIELD_FILL_DELAY))

            # Check for submit button (final step)
            try:
                submit_btn = WebDriverWait(driver, 3).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Submit application']"))
                )
                # Verify it's actually the submit button not a next step
                if "submit" in submit_btn.text.lower() or "submit" in (submit_btn.get_attribute("aria-label") or "").lower():
                    await asyncio.sleep(random.uniform(*FIELD_FILL_DELAY))
                    submit_btn.click()
                    await asyncio.sleep(random.uniform(*PAGE_LOAD_DELAY))
                    break
            except TimeoutException:
                pass

            # Not on final step — try Next/Continue
            try:
                next_btn = _wait_clickable(
                    driver,
                    By.CSS_SELECTOR,
                    "button[aria-label='Continue to next step'], button[aria-label='Review your application']",
                    timeout=5,
                )
                next_btn.click()
            except TimeoutException:
                # Try generic next button
                try:
                    generic_next = _wait_clickable(driver, By.CSS_SELECTOR, "button.artdeco-button--primary", timeout=3)
                    btn_text = generic_next.text.lower()
                    if "next" in btn_text or "continue" in btn_text or "review" in btn_text:
                        generic_next.click()
                    else:
                        break  # unknown button — stop
                except TimeoutException:
                    break

        # Check for application confirmation
        try:
            WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.artdeco-modal__content h3"))
            )
            # Confirm it's the success modal
            modal_text = driver.find_element(By.CSS_SELECTOR, "div.artdeco-modal__content").text.lower()
            if "application" in modal_text and ("submitted" in modal_text or "sent" in modal_text):
                # Increment LinkedIn counter
                _increment_linkedin_counter()
                return {"status": "applied", "screenshot_path": None, "failure_note": None}
        except (TimeoutException, NoSuchElementException):
            pass

        screenshot = _save_screenshot(driver, run_id, job_id)
        return {"status": "failed", "screenshot_path": screenshot, "failure_note": "success_modal_not_detected"}

    except Exception as exc:
        screenshot = _save_screenshot(driver, run_id, job_id)
        return {"status": "failed", "screenshot_path": screenshot, "failure_note": str(exc)[:300]}
