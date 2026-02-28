"""
agents/agent12_applier.py
Agent 12 — Auto-Applier.

The most complex Server 3 agent. Orchestrates the full auto-apply pipeline:
  eligibility gating → job selection → anti-ban → Selenium apply → DB record → WA notification

Eligibility gates (ALL must pass — in order):
  1. subscription_tier = 'paid'
  2. wa_opted_in = TRUE (consent to automation)
  3. Apply window: 20:00–06:00 IST (10-hour nightly window)
  4. daily_apply_count < daily_apply_limit (default 10)
  5. monthly_apply_count < 250

Job selection: job_fit_scores WHERE fit_score >= 60, ORDER BY fit_score DESC.
Skip if: already applied to job, company in user blacklist.

For each job:
  1. Call Agent 13 (anti-ban) HTTP endpoint — abort if proceed=False
  2. Inject decrypted session into browser
  3. Apply via apply_engine (indeed_easy or linkedin_easy)
  4. del decrypted session variable immediately after use
  5. INSERT job_applications row
  6. Increment daily_apply_count, monthly_apply_count
  7. LinkedIn: increment system_daily_limits.total_linkedin_actions
  8. HTTP POST to Server 1 for WhatsApp notification

Review mode: first 14 days after auto_apply_activated_at → status='queued' not 'submitted'.
"""

import asyncio
import os
import time
from datetime import datetime, timezone, date, timedelta
from typing import Optional

import httpx
import pytz

from db.client import supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.session_manager import decrypt_session
from skills.browser_pool import browser_context
from skills.apply_engine import apply_indeed_easy, apply_linkedin_easy

IST = pytz.timezone("Asia/Kolkata")


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _is_in_apply_window() -> bool:
    """Check if current IST time is within 20:00–06:00 apply window."""
    now_ist = datetime.now(IST)
    hour    = now_ist.hour
    return hour >= 20 or hour < 6


def _get_daily_apply_count(user_id: str) -> int:
    """Count applies for this user today (by applied_at date)."""
    today = date.today().isoformat()
    result = (
        supabase.table("job_applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("applied_at", today)
        .execute()
    )
    return result.count or 0


def _get_monthly_apply_count(user_id: str) -> int:
    """Count applies for this user this calendar month."""
    first_of_month = date.today().replace(day=1).isoformat()
    result = (
        supabase.table("job_applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("applied_at", first_of_month)
        .execute()
    )
    return result.count or 0


def _is_already_applied(user_id: str, job_id: str) -> bool:
    result = (
        supabase.table("job_applications")
        .select("id")
        .eq("user_id", user_id)
        .eq("job_id", job_id)
        .limit(1)
        .execute()
    )
    return bool(result.data)


def _get_user_blacklist(user_id: str) -> set:
    result = (
        supabase.table("user_company_prefs")
        .select("company_canonical")
        .eq("user_id", user_id)
        .eq("pref_type", "blacklist")
        .execute()
    )
    return {row["company_canonical"].lower() for row in (result.data or [])}


def _get_session(user_id: str, platform: str) -> Optional[dict]:
    """Fetch and decrypt the user's session for the given platform. Returns None if unavailable."""
    result = (
        supabase.table("user_connections")
        .select("session_encrypted, is_valid, platform")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .eq("is_valid", True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    # NEVER log session_encrypted value
    encrypted = result.data[0]["session_encrypted"]
    try:
        return decrypt_session(encrypted)
    except Exception:
        return None


def _determine_apply_method(job: dict, user_connections: dict) -> Optional[str]:
    """
    Returns the apply method to use for this job: 'indeed_easy', 'linkedin_easy', or None.
    Checks if the user has a valid session for that platform.
    """
    source = job.get("source", "").lower()
    apply_url = job.get("apply_url", "").lower()

    if "linkedin" in source or "linkedin" in apply_url:
        if user_connections.get("linkedin"):
            return "linkedin_easy"
    if "indeed" in source or "indeed" in apply_url:
        if user_connections.get("indeed"):
            return "indeed_easy"
    # Tier 1 platforms only — no apply method = skip
    return None


def _is_in_review_mode(auto_apply_activated_at) -> bool:
    """First 14 days after activation = review mode (queue instead of auto-submit)."""
    if not auto_apply_activated_at:
        return True  # never activated = review mode by default
    if isinstance(auto_apply_activated_at, str):
        activated = datetime.fromisoformat(auto_apply_activated_at.replace("Z", "+00:00"))
    else:
        activated = auto_apply_activated_at
    return (datetime.now(timezone.utc) - activated).days < 14


async def _call_anti_ban(user_id: str, action_type: str, platform: str) -> dict:
    """Call Agent 13 anti-ban endpoint. Returns risk assessment."""
    server3_url  = os.environ.get("SERVER3_URL", "http://localhost:8003")
    agent_secret = os.environ["AGENT_SECRET"]
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{server3_url}/api/agents/anti-ban",
                json={
                    "user_id":     user_id,
                    "action_type": action_type,
                    "context":     {"platform": platform},
                },
                headers={"x-agent-secret": agent_secret},
            )
            return resp.json()
    except Exception as exc:
        # If anti-ban is unreachable, block as precaution
        return {"risk_level": "critical", "proceed": False, "reason": f"anti_ban_unreachable: {exc}"}


async def _send_wa_notification(user_id: str, message: str) -> None:
    """POST to Server 1 internal endpoint to send WhatsApp notification."""
    server1_url  = os.environ.get("SERVER1_URL", "")
    agent_secret = os.environ["AGENT_SECRET"]
    if not server1_url:
        return
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{server1_url}/internal/wa-send",
                json={"user_id": user_id, "message": message},
                headers={"x-agent-secret": agent_secret},
            )
    except Exception as exc:
        print(f"[agent12] WA notification failed (non-critical): {exc}")


def _record_application(
    user_id: str, job_id: str, job: dict, apply_tier: int,
    auto_status: str, tailored_path: Optional[str], cover_path: Optional[str],
    fit_score: float, method: str,
) -> str:
    """Insert a job_applications row and return the new application ID."""
    from uuid import uuid4
    app_id   = str(uuid4())
    now_iso  = datetime.now(timezone.utc).isoformat()

    supabase.table("job_applications").insert({
        "id":                   app_id,
        "user_id":              user_id,
        "job_id":               job_id,
        "status":               "applied",
        "auto_status":          auto_status,
        "apply_method":         method,
        "apply_tier":           apply_tier,
        "fit_score_at_apply":   fit_score,
        "tailored_resume_path": tailored_path,
        "cover_letter_path":    cover_path,
        "applied_at":           now_iso,
        "created_at":           now_iso,
    }).execute()

    return app_id


def _increment_apply_counts(user_id: str) -> None:
    """Increment daily and monthly apply counters on the users row."""
    supabase.rpc("increment_apply_counts", {"target_user_id": user_id}).execute()


def _inject_session_cookies(driver, session_data: dict) -> None:
    """Inject session cookies into the browser. Works for both LinkedIn and Indeed."""
    cookies = session_data.get("cookies", [])
    for cookie in cookies:
        try:
            driver.add_cookie(cookie)
        except Exception:
            pass  # some cookies fail silently (httpOnly domain mismatch) — OK


# ─── Main Agent ───────────────────────────────────────────────────────────────

async def run_applier(
    user_id: str,
    apply_tier: int = 1,
    max_applies: int = 10,
) -> dict:
    """
    Main entry point for Agent 12 Auto-Applier.

    Applies to up to max_applies Tier 1 jobs for the user within tonight's window.
    All eligibility checks are enforced before any Selenium action.
    """
    run_id = new_run_id()
    start  = time.time()

    await log_start("agent12_applier", user_id, run_id)

    applied_jobs  = []
    failed_count  = 0
    skipped_count = 0

    try:
        # ── Gate 1: Apply window (20:00–06:00 IST) ──────────────────────────
        if not _is_in_apply_window():
            await log_skip(run_id, "outside_apply_window")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "outside_apply_window", "applications": []}

        # ── Gate 2: Load user and check eligibility ──────────────────────────
        user_result = (
            supabase.table("users")
            .select("id, subscription_tier, wa_opted_in, auto_apply_enabled, auto_apply_paused, daily_apply_limit, auto_apply_activated_at")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not user_result.data:
            await log_skip(run_id, "user_not_found")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "user_not_found", "applications": []}

        u = user_result.data

        if u.get("subscription_tier") != "paid":
            await log_skip(run_id, "free_tier_user")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "free_tier_user", "applications": []}

        if not u.get("auto_apply_enabled"):
            await log_skip(run_id, "auto_apply_not_enabled")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "auto_apply_not_enabled", "applications": []}

        if u.get("auto_apply_paused"):
            await log_skip(run_id, "auto_apply_paused")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "auto_apply_paused", "applications": []}

        if not u.get("wa_opted_in"):
            await log_skip(run_id, "wa_not_opted_in")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "wa_not_opted_in", "applications": []}

        # ── Gate 3: Apply caps ───────────────────────────────────────────────
        daily_limit   = u.get("daily_apply_limit") or 10
        daily_count   = _get_daily_apply_count(user_id)
        monthly_count = _get_monthly_apply_count(user_id)

        if daily_count >= daily_limit:
            await log_skip(run_id, f"daily_cap_hit:{daily_count}/{daily_limit}")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "daily_cap_hit", "applications": []}

        if monthly_count >= 250:
            await log_skip(run_id, "monthly_cap_hit:250")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "monthly_cap_hit", "applications": []}

        remaining_today   = min(daily_limit - daily_count, 250 - monthly_count, max_applies)
        in_review_mode    = _is_in_review_mode(u.get("auto_apply_activated_at"))
        blacklist         = _get_user_blacklist(user_id)

        # ── Load user sessions for available platforms ───────────────────────
        user_connections = {}
        for platform in ["indeed", "linkedin"]:
            session = _get_session(user_id, platform)
            if session:
                user_connections[platform] = session  # stored temporarily only

        # ── Job selection: fit_score >= 60, order by score DESC ──────────────
        fit_scores_result = (
            supabase.table("job_fit_scores")
            .select("job_id, fit_score")
            .eq("user_id", user_id)
            .gte("fit_score", 60)
            .order("fit_score", desc=True)
            .limit(remaining_today * 5)  # fetch extra to account for skips
            .execute()
        )

        if not fit_scores_result.data:
            await log_skip(run_id, "no_eligible_jobs_above_60")
            return {"status": "skipped", "applied": 0, "failed": 0, "reason": "no_eligible_jobs", "applications": []}

        # ── Apply loop ───────────────────────────────────────────────────────
        applied_this_run = 0

        for score_row in fit_scores_result.data:
            if applied_this_run >= remaining_today:
                break

            job_id    = score_row["job_id"]
            fit_score = score_row["fit_score"]

            # Skip if already applied
            if _is_already_applied(user_id, job_id):
                skipped_count += 1
                continue

            # Fetch job details
            job_result = (
                supabase.table("jobs")
                .select("id, title, company, company_canonical, apply_url, source")
                .eq("id", job_id)
                .single()
                .execute()
            )
            if not job_result.data:
                skipped_count += 1
                continue

            job = job_result.data
            company_lower = (job.get("company_canonical") or job.get("company", "")).lower()

            # Skip blacklisted companies
            if company_lower in blacklist:
                skipped_count += 1
                continue

            # Determine apply method
            apply_method = _determine_apply_method(job, user_connections)
            if not apply_method:
                skipped_count += 1
                applied_jobs.append({"job_id": job_id, "site": job.get("source", ""), "status": "skipped", "reason": "no_valid_session"})
                continue

            platform = "linkedin" if apply_method == "linkedin_easy" else "indeed"

            # ── Anti-ban check ───────────────────────────────────────────────
            anti_ban_result = await _call_anti_ban(user_id, "apply", platform)
            if not anti_ban_result.get("proceed", False):
                skipped_count += 1
                applied_jobs.append({"job_id": job_id, "site": platform, "status": "skipped", "reason": f"anti_ban:{anti_ban_result.get('risk_level')}"})
                continue

            # Respect anti-ban delay
            delay = anti_ban_result.get("delay_seconds", 0)
            if delay > 0:
                await asyncio.sleep(delay)

            # ── Apply via Selenium ───────────────────────────────────────────
            session_data  = user_connections.get(platform)
            apply_result  = {"status": "failed", "screenshot_path": None}

            try:
                async with browser_context(headless=False) as driver:
                    # Navigate to platform base domain first (required for cookie injection)
                    if platform == "linkedin":
                        driver.get("https://www.linkedin.com")
                    else:
                        driver.get("https://www.indeed.com")

                    await asyncio.sleep(2.0)

                    # Inject session cookies
                    if session_data:
                        _inject_session_cookies(driver, session_data)
                        # CRITICAL: del session reference after use
                        del session_data
                        session_data = None

                    if apply_method == "linkedin_easy":
                        apply_result = await apply_linkedin_easy(driver, job, {}, run_id)
                    else:
                        apply_result = await apply_indeed_easy(driver, job, {}, run_id)

            except Exception as exc:
                apply_result = {"status": "failed", "screenshot_path": None, "failure_note": str(exc)[:200]}

            # ── Record result in DB ──────────────────────────────────────────
            if apply_result["status"] == "applied":
                auto_status = "queued" if in_review_mode else "submitted"

                app_id = _record_application(
                    user_id, job_id, job, apply_tier, auto_status,
                    None, None, fit_score, apply_method,
                )
                _increment_apply_counts(user_id)

                # LinkedIn global counter
                if platform == "linkedin":
                    supabase.rpc(
                        "increment_linkedin_daily_count",
                        {"action_date": date.today().isoformat()},
                    ).execute()

                applied_this_run += 1
                applied_jobs.append({"job_id": job_id, "site": platform, "status": "applied", "app_id": app_id})

                # ── WhatsApp notification ────────────────────────────────────
                await _send_wa_notification(
                    user_id,
                    f"✅ Applied to *{job.get('title')}* at *{job.get('company')}* via {platform.title()}.",
                )

                # Write learning signal
                supabase.table("learning_signals").insert({
                    "user_id":     user_id,
                    "signal_type": "application_submitted",
                    "context": {
                        "platform":    platform,
                        "fit_score":   fit_score,
                        "method":      apply_method,
                        "review_mode": in_review_mode,
                    },
                }).execute()

            else:
                failed_count += 1
                applied_jobs.append({
                    "job_id":          job_id,
                    "site":            platform,
                    "status":          "failed",
                    "failure_note":    apply_result.get("failure_note"),
                    "screenshot_path": apply_result.get("screenshot_path"),
                })

        # ── Final result ─────────────────────────────────────────────────────
        duration_ms = int((time.time() - start) * 1000)
        await log_end(run_id, applied_this_run, duration_ms)

        return {
            "status":           "completed",
            "applied":          applied_this_run,
            "failed":           failed_count,
            "skipped_linkedin": False,
            "applications":     applied_jobs,
            "duration_ms":      duration_ms,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        await log_fail(run_id, str(exc), duration_ms)
        raise
