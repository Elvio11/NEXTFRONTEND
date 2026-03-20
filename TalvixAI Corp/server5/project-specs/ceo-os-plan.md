# Execution Plan: CEO-OS (Commander) Core Logic
## Overview
Based on TALVIX AI CORP ARCHITECTURE v1 3.md, the CEO-OS (Dept 1) is the master orchestration layer, running as the single persistent, stateful agent that interacts with the Founder via Telegram and routes all tasks across 49 stateless Hand departments.

## Phase 1: Stateful Lifecycle & Binding
- **Implement Singleton State**: Ensure `CEOController` acts as the single stateful memory structure for the OS.
- **Telegram Binding Logic**: Add input handlers enforcing the "Single Binding Rule" (Channel: telegram, AccountId: founder-bot, Peer: Elvio's ID).

## Phase 2: Natural Language Routing Engine (Layer 2)
- **Message Analyzer**: Integrate `qwen3-235b` prompts to ingest natural language and map it to `AGENTS.md` rules.
- **Routing Topologies**: Implement pattern matching for the three modes:
  - **Sequential Routing**: Execute one hand, wait for response, pass to next (e.g. `SEO Specialist -> Content Writer`).
  - **Parallel Fan-out**: Execute multiple hands concurrently with `sessions_spawn` (e.g. `Content Writer + Visual Designer`).

## Phase 3: The Morning Briefing Workflow
- Implement `trigger_morning_briefing()` scheduled for 7:00 AM IST.
- Wire a explicit parallel fan-out to 6 specific departments:
  - Data Analyst, Finance & Operations, DevOps / Infra, Retention Manager, Distribution Manager, Growth Researcher.
- Implement the "Proof of Life" aggregation block.

## Phase 4: Security & Constraints
- **Severity Classifier**: Add logic to catch `POST /internal/founder-notify` incidents, identify severity, and route to DevOps/Support.
- **Constraint Enforcement**: Enforce immutable depth limit = 1 (sub-agents cannot spawn agents) within the spawn cycle.
- **Approval Gate**: Send drafts to the founder for approval before execution of any outbound action.

## Phase 5: Testing & QA
- Construct unit test mocks for the `OpenFangRunner.execute_hand` behavior.
- Validate `execute_directive` correctly handles simultaneous Fan-Out requests without state corruption.
