# Talvix AI Corp: Commander Routing Rules
# Location: server5/openfang/config/AGENTS.md

## 1. Deterministic Bindings (Layer 1)

*   **Channel:** telegram
*   **AccountId:** founder-bot
*   **Peer:** Elvio's Telegram ID
*   **Action:** ALWAYS route to `Commander` agent.

## 2. Commander AI Reasoning (Routing Decision Matrix)

When Commander receives a prompt or event, it analyzes the context and spawns sub-agents using `sessions_spawn` (parallel fan-out) or `sessions_send` (sequential wait).

| Trigger / User Input | Routed Departments (Hands) | Execution Mode |
| :--- | :--- | :--- |
| "Build an Instagram post" | `Content Writer` (Dept 5) + `Visual Designer` (Dept 7) | **Parallel Fan-out** |
| "Run an ad campaign" | `Marketing Director` -> (`Content Writer` + `Visual Designer`) -> `Distribution` | **Sequential -> Parallel -> Sequential** |
| "What's our MRR today?" | `Data Analyst` (Dept 24) + `Finance` (Dept 33) | **Parallel Fan-out** |
| "Server is down" | `DevOps Monitor` + `QA Monitor` -> Commander Alert | **Parallel Fan-out -> Sequential** |
| "User complaint received" | `Support L1` -> [If Escalated] -> `Support L2` -> Elvio Approval | **Sequential (Human-in-the-Loop)** |
| "Partnership opportunity" | `BD & Partnerships` (Dept 15) -> Elvio Approval | **Sequential (Human-in-the-Loop)** |
| "Write a blog post" | `SEO Specialist` -> `Content Writer` -> Elvio Approval -> `Distribution` | **Sequential Pipeline** |
| `Razorpay: payment.captured` | `Finance` (logs silently) -> Commander Notifies Elvio | **Sequential** |
| `New user signup` | `Onboarding Specialist` (Day 1 sequence draft) -> Elvio Approval | **Sequential (Human-in-the-Loop)** |
| `User cancellation` | `Retention Manager` (exit survey draft) -> `Voice of Customer` | **Sequential** |
| `Server 1 /founder-notify` | Commander classifies severity -> Routes to corresponding Hand | **Dynamic (Severity based)** |

## 3. Engineering Execution (Ruflo)

When Engineering Commander (Dept 39) receives a code task, it spawns a Ruflo v3.5 swarm, NOT a single sub-agent.
*   **Command:** `ruflo sparc <mode> "<task description>"`
*   **Output:** Working code + test suite + PR ready for review via `talvix-github.md` skill.

## 4. Sub-agent Constraints

*   Depth Limit: `1` (Sub-agents CANNOT spawn further sub-agents).
*   State: `Stateless` (Sub-agents have no persistent memory. Only Commander is stateful).
*   Parallel Ceiling: `6` simultaneous spawns (e.g., Morning Briefing workflow).