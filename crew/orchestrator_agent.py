"""
crew/orchestrator_agent.py
CrewAI Manager Agent — the brain that gets handed the context object.

Process.hierarchical: this agent manages sub-tasks, delegates to Intelligence
or Execution crews, decides order and parallelism, handles exceptions dynamically.

LLM: Sarvam-M Think mode — only used AFTER all Python gates have cleared.
Python is the bouncer, CrewAI is the brain. They never switch roles.
"""

from __future__ import annotations

from crewai import Agent
from crewai.process import Process

from llm.sarvam import SarvamClient

# Lazy-init Sarvam (never at module level — consistent with existing pattern)
_sarvam: SarvamClient | None = None


def _get_sarvam() -> SarvamClient:
    global _sarvam
    if _sarvam is None:
        _sarvam = SarvamClient()
    return _sarvam


def build_orchestrator_agent() -> Agent:
    """
    Build and return the CrewAI Manager Agent.
    Called once per orchestration request — not a singleton,
    because CrewAI agents are stateful per-run.
    """
    sarvam = _get_sarvam()
    llm    = sarvam.get_crewai_llm(mode="think")

    return Agent(
        role="Talvix Orchestrator",

        goal=(
            "Read the full system context object and decide which intelligence agents "
            "to activate, in what order, and with what parallelism. "
            "Never perform work directly — always delegate to sub-agents. "
            "Handle failures gracefully without blocking unrelated agents."
        ),

        backstory=(
            "You are the central coordinator of Talvix's intelligence pipeline. "
            "You receive a structured JSON context containing the trigger event, "
            "user state, job pool state, application state, and system health signals. "
            "Your role is to interpret this context and plan the optimal agent execution "
            "sequence, respecting all business rules that were already enforced by the "
            "Python gate layer before you were invoked. "
            "You trust that all safety and eligibility checks have passed — your job "
            "is intelligent orchestration, not gating."
        ),

        verbose=False,
        allow_delegation=True,
        process=Process.hierarchical,
        llm=llm,
    )
