"""
flow/career_planner.py
CrewAI CareerPlannerFlow — onboarding pipeline.

Execution order:
  1. @start → Agent 3 (resume_intelligence) — synchronous, must complete first
  2. @listen(agent3) → asyncio.gather(Agent4, Agent5, Agent6) — parallel
  3. @listen(parallel done) → set users.dashboard_ready = TRUE

Uses asyncio.gather(return_exceptions=True) so one parallel agent failing
does NOT block the other two. dashboard_ready fires when all three settle.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional

from crewai.flow.flow import Flow, start, listen

from db.client import supabase
import agents.agent3_resume as agent3
import agents.agent4_skill_gap as agent4
import agents.agent5_career as agent5
import agents.agent6_fit as agent6


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CareerPlannerFlow(Flow):
    """
    Onboarding flow: resume parse → parallel intelligence agents → dashboard ready.
    Usage:
        flow = CareerPlannerFlow()
        flow.user_id = "uuid-here"
        flow.file_path = "/storage/uploads/uuid/resume.pdf"
        await flow.kickoff_async()
    """

    # State: set before kickoff
    user_id:   str = ""
    file_path: str = ""

    # Internal state set by steps
    agent3_result: dict = {}

    @start()
    async def run_resume_intelligence(self) -> dict:
        """
        Step 1: Agent 3 — parse resume and generate personas.
        Synchronous — all downstream agents depend on the parsed resume on FluxShare.
        """
        result = await agent3.run(self.user_id, self.file_path)
        self.agent3_result = result
        return result

    @listen(run_resume_intelligence)
    async def run_parallel_agents(self, agent3_result: dict) -> list:
        """
        Step 2: Agents 4, 5, 6 in parallel.
        return_exceptions=True: one failure doesn't block the others.
        """
        if agent3_result.get("status") == "failed":
            # Agent 3 failed — skip parallel agents
            return [agent3_result, agent3_result, agent3_result]

        results = await asyncio.gather(
            agent4.run(self.user_id),
            agent5.run(self.user_id),
            agent6.run(self.user_id, mode="full_scan"),
            return_exceptions=True,
        )
        return list(results)

    @listen(run_parallel_agents)
    async def mark_dashboard_ready(self, parallel_results: list) -> None:
        """
        Step 3: Set users.dashboard_ready = TRUE.
        Fires regardless of individual parallel agent success/failure.
        Supabase realtime notifies the frontend client.
        """
        supabase.table("users").update({
            "dashboard_ready": True,
            "updated_at":      _now(),
        }).eq("id", self.user_id).execute()


async def run_onboarding_flow(user_id: str, file_path: str) -> dict:
    """
    Convenience wrapper called by the resume router.
    Runs the full CareerPlannerFlow and returns Agent 3's result
    (which contains persona_options and extracted_summary for Server 1).
    """
    flow = CareerPlannerFlow()
    flow.user_id   = user_id
    flow.file_path = file_path
    await flow.kickoff_async()
    return flow.agent3_result
