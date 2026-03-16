"""
crew/intelligence_crew.py
S2 Intelligence Crew — wraps Agents 3–8 as CrewAI tasks.

The crew reads the context object, determines which agents to activate,
and dispatches them via the existing agent run() functions.

Execution paths:
  - Onboarding:       Agent 3 → parallel(4, 5, 6)  via flow/career_planner.py
  - Delta scoring:    Agent 6 (delta mode)
  - Nightly coach:    Agent 8
  - JD cleaning:      Agent 7 (triggered post-scrape by Server 1 → Server 2 POST)
  - Weekly refresh:   Agents 4, 5 in parallel (stale flag check)

Server boundary: this crew only dispatches S2 agents. S3 is triggered via Server 1.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from crewai import Agent, Task, Crew
from crewai.process import Process

import agents.agent4_skill_gap   as agent4
import agents.agent5_career      as agent5
import agents.agent6_fit         as agent6
import agents.agent8_coach       as agent8

from flow.career_planner import run_onboarding_flow
from crew.orchestrator_agent import build_orchestrator_agent
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip

logger = logging.getLogger(__name__)


class IntelligenceCrew:
    """
    Routes an orchestration trigger to the correct S2 agent(s).
    Uses existing agent run() functions — no new agent implementations.
    """

    def __init__(self, context: dict, payload: dict) -> None:
        self.context = context
        self.payload = payload
        self.trigger = context.get("trigger", "")
        self.user    = context.get("user") or {}
        self.user_id = self.user.get("id")

    async def run(self) -> dict:
        """
        Dispatch based on trigger. Returns standard status contract dict.
        """
        trigger = self.trigger

        try:
            if trigger == "resume_uploaded":
                return await self._run_onboarding()

            if trigger in {"score_delta", "new_jobs_added"}:
                return await self._run_fit_score_delta()

            if trigger == "full_scan":
                return await self._run_fit_score_full_scan()

            if trigger == "coach_daily":
                return await self._run_daily_coach()

            if trigger in {"skill_gap_refresh", "career_intel_refresh", "weekly_career_refresh"}:
                return await self._run_weekly_refresh()

            # Unknown trigger — log and return skipped
            logger.warning("[intelligence_crew] Unknown trigger=%s", trigger)
            log_skip("intelligence_crew", self.user_id, reason=f"unknown_trigger:{trigger}")
            return {"status": "skipped", "records_processed": 0, "error": f"unknown trigger: {trigger}"}

        except Exception as exc:
            log_fail("intelligence_crew", self.user_id, str(exc))
            return {"status": "failed", "records_processed": None, "error": str(exc)[:500]}

    # ─── EXECUTION PATHS ──────────────────────────────────────────────────────

    async def _run_onboarding(self) -> dict:
        """
        Resume uploaded → full onboarding pipeline via CareerPlannerFlow.
        Agent 3 → parallel(4, 5, 6) → dashboard_ready = TRUE.
        CareerPlannerFlow already implements this correctly.
        """
        file_path = self.payload.get("file_path", "")
        if not file_path:
            return {"status": "failed", "records_processed": 0,
                    "error": "payload.file_path required for resume_uploaded trigger"}

        log_start("intelligence_crew:onboarding", self.user_id)
        result = await run_onboarding_flow(self.user_id, file_path)
        log_end("intelligence_crew:onboarding", self.user_id, records_processed=1)
        return result

    async def _run_fit_score_delta(self) -> dict:
        """Nightly delta scoring — only new jobs since last scrape_run."""
        log_start("intelligence_crew:fit_delta", self.user_id)
        result = await agent6.run(self.user_id, mode="delta")
        log_end("intelligence_crew:fit_delta", self.user_id,
                records_processed=result.get("records_processed"))
        return result

    async def _run_fit_score_full_scan(self) -> dict:
        """Full scan — all active jobs. Triggered by fit_scores_stale=TRUE."""
        log_start("intelligence_crew:fit_full", self.user_id)
        result = await agent6.run(self.user_id, mode="full_scan")
        log_end("intelligence_crew:fit_full", self.user_id,
                records_processed=result.get("records_processed"))
        return result

    async def _run_daily_coach(self) -> dict:
        """7 AM IST daily coach message for paid WA-opted-in users."""
        log_start("intelligence_crew:coach", self.user_id)
        result = await agent8.run(self.user_id)
        log_end("intelligence_crew:coach", self.user_id,
                records_processed=result.get("records_processed"))
        return result

    async def _run_weekly_refresh(self) -> dict:
        """
        Weekly career refresh — Agents 4 and 5 in parallel.
        Agent 6 full scan is handled separately via fit_scores_stale check.
        """
        log_start("intelligence_crew:weekly_refresh", self.user_id)

        results = await asyncio.gather(
            agent4.run(self.user_id),
            agent5.run(self.user_id),
            return_exceptions=True,
        )

        statuses   = [r.get("status", "failed") if isinstance(r, dict) else "failed"
                      for r in results]
        processed  = sum(r.get("records_processed", 0) if isinstance(r, dict) else 0
                         for r in results)
        errors     = [str(r) for r in results if isinstance(r, Exception)]

        overall = "success" if all(s == "success" for s in statuses) else (
            "skipped" if all(s == "skipped" for s in statuses) else "failed"
        )

        log_end("intelligence_crew:weekly_refresh", self.user_id, records_processed=processed)
        return {
            "status":            overall,
            "records_processed": processed,
            "error":             "; ".join(errors) if errors else None,
        }
