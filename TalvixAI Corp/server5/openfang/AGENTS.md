# 🗺️ AGENTS.md — Talvix AI Corp Operational Map (v1.0)
## Commander Routing Logic & Schedules

This document provides the deterministic routing rules for the **Commander (CEO-OS)** to manage all 50 AI departments within the **Talvix AI Corp**.

### 💼 1. Directorial Hierarchy
All departmental actions fan-out from the **Commander**:
1.  **Incoming Command** (Telegram / Webhook)
2.  **Commander Selection** (Routes to Department)
3.  **Departmental Execution** (Invokes Hand/Agent)
4.  **Review Logic** (Consensus check)

### 📅 2. The Morning Briefing Workflow (07:00 IST)
Total fan-out: 6 Parallel Hands.
1.  **Data Analyst**: Fetch S1 `/api/metrics`.
2.  **Finance Ops**: Analyze Stripe/Razorpay balance (via MCP).
3.  **DevOps Monitor**: Check `TalvixGuard` heartbeats.
4.  **Retention Manager**: Run churn Prediction (S2 Fit-Score delta).
5.  **Growth Researcher**: Competitive scanning.
6.  **Content Writer**: Drafting today's Daily Coach snippet.

### ⚡ 3. Real-Time Trigger Logic
| Event (S1 Webhook) | Target Department | Logic Path |
| :--- | :--- | :--- |
| `paid_signup_success` | **BD & Revenue** | Generate welcome email draft (HITL required). |
| `agent_failure_critical` | **Engineering / Security** | Spawn RuFlo swarm for root-cause analysis. |
| `user_feedback_negative` | **Success Manager** | Analyze support themes and notify @Founder. |
| `budget_high_utilization` | **Finance & Operations** | Trigger LLM swap to low-cost tiers (Gemini Flash). |

### 🧭 4. Command Reference (@TalvixFounderBot)
- `/status`: Returns JSON of all 50 departments and their health.
- `/brief`: Manually triggers the **Morning Briefing**.
- `/pause [dept_id]`: Instantly shuts down a department's Hand execution.
- `/intercept`: Holds all pending outgoing actions for manual Founder review.

### 🛡️ 5. Compliance Verification
All agents must run `ruflo review` against their drafted plans before invoking their respective `HAND.toml` actions.
