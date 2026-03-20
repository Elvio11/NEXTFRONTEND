# Talvix AI Corp Implementation Plan

This document outlines the complete implementation plan for building Talvix AI Corp, the AI-operated company layer built on top of the Talvix AaaS product. It adheres strictly to the architectural constraints, infrastructure layout, and building phases outlined in the `TALVIX AI CORP ARCHITECTURE v1 3.md` document.

## Infrastructure Architecture Strategy

**Talvix AI Corp observes the product through two thin read-only connections. It never modifies the product, touches the database, or interacts with users directly.**

*   **Server 1 (Gateway Layer):** Receives 14 read-only API endpoints + an MCP server wrapper, the POST `/internal/founder-notify` webhook, and the standalone `TalvixGuard` Node.js watchdog app.
*   **Server 2 (Intelligence Layer) & Server 3 (Execution Layer):** Zero direct access from AI Corp. Data flows through Server 1 aggregates only.
*   **Server 4 (Storage Layer):** Zero access ever. Contains user PII (MinIO).
*   **Server 5 (Company Layer - NEW):** Provisioned on FluxCloud (2 vCores, 6GB RAM, 100GB Storage). Because there is no SSH access to FluxCloud, the entire company layer (OpenFang Rust binary, all 50 department agents, and the Telegram bots like `@TalvixFounderBot`) must be containerized and run entirely inside a Docker container.

---

## Phase 1: Server 1 Additions (Gateway Layer Setup)

In this phase, we make the Talvix AaaS product readable by the AI Corp by injecting safe, read-only connections into Server 1. All user-facing communications and internal Talvix AaaS DB access are enforced by standard JWT/`stripSensitive` middleware.

1.  **Implement 14 Read-Only REST Endpoints:**
    *   `/api/metrics`
    *   `/api/agent-performance`
    *   `/api/scraper-health`
    *   `/api/conversion-data`
    *   `/api/retention-data`
    *   `/api/bd-intelligence`
    *   `/api/product-intelligence`
    *   `/api/engineering-metrics`
    *   `/api/db-health`
    *   `/api/infra-metrics`
    *   `/api/behavior-analytics`
    *   `/api/user-status`
    *   `/api/support-themes`
    *   `/api/geo-distribution`
2.  **Build the Talvix MCP Server:** Wrap the 14 endpoints above using the `@modelcontextprotocol/sdk` into a single `/mcp` route on Server 1.
3.  **Implement POST `/internal/founder-notify` Endpoint:** An authenticated webhook handler using `X-Agent-Secret` to route critical AaaS events (e.g., paid signups, agent failures) from Server 1 to Server 5.
4.  **Build TalvixGuard Watchdog App:** A ~400 line standalone Node.js app on Server 1. Acts as a heartbeat monitor for Server 5, running `@TalvixWatchdogBot` on Telegram to alert the founder if Server 5 crashes.
5.  **Deploy:** Deploy all additions to Server 1 using the existing FluxCloud CI/CD pipeline.

---

## Phase 2: Server 5 Provisioning & Configuration

We establish the foundational company OS on a brand new, isolated server. **Crucially, because there is no SSH access to FluxCloud, the entire Server 5 environment must be packaged as a Docker container.**

1.  **Provision Infrastructure:** Spin up Server 5 (2 vCores, 6GB RAM, 100GB Storage) on FluxCloud via UI.
2.  **Containerize OpenFang:** Create a Dockerfile that installs the OpenFang Rust binary (`curl -fsSL https://openfang.sh/install | sh`) and sets up the working environment. The entire company layer must run within this container.
3.  **Register Telegram Interface:** Create `@TalvixFounderBot` via BotFather and ensure the token is injected into the container's `config.toml` during build or runtime via FluxCloud environment variables. Ensure `dmPolicy` is set to `allowlist` for the Founder's Telegram ID only.
4.  **Configure Environment Variables:** Inject all necessary API keys, JWT secrets, tokens, and UptimeRobot hooks directly via the FluxCloud UI (no `.env` files committed). These will be passed into the Docker container.
5.  **Configure MCP & Monitoring:**
    *   Add the Server 1 `/mcp` URL to the container's `config.toml`.
    *   Configure the free UptimeRobot monitor to ping the Dockerized Server 5's `/health/heartbeat` every 5 minutes.

---

## Phase 3: Skill Library Injection

We load the knowledge base, operational playbooks, and engineering swarms into the OpenFang OS. All loaded skills pass through the OpenFang WASM injection scanner.

1.  **Load `agency-agents`:** Run `git submodule add https://github.com/msitarzewski/agency-agents` (147 personas).
2.  **Load `antigravityskills`:** Run `npx antigravity-awesome-skills` to install 245 curated operational playbooks into `~/.agent/skills/`.
3.  **Initialize Ruflo v3.5:** For the Engineering Division ONLY. Install via `npm install -g @ruflo/cli` and run `ruflo init`, configuring it with the Talvix codebase context.
4.  **Verification:** Execute `openfang skills list` to confirm 507+ skills are loaded and validated.

---

## Phase 4: Foundational Directives (`SOUL.md` and `AGENTS.md`)

This is the most critical logic phase. We define the constraints, routing logic, and overarching rules for the entire company.

1.  **Draft `SOUL.md` (Master Constraints):**
    *   Define absolute rules: NO direct Supabase access, NO `service_role` keys, NO user PII on Server 5, and mandatory human-in-the-loop for user communication.
    *   Inject Talvix context: architecture details, agent overviews, DB structure.
    *   Define LLM mapping per department (prioritize Cerebras, Groq, Gemini free tiers; limit Claude to Engineering/Security).
2.  **Draft `AGENTS.md` (Commander Routing Logic):**
    *   Define the deterministic routing rules for the Commander agent.
    *   Map incoming Telegram commands and Server 1 webhooks to specific sub-departments.
    *   Configure fan-out (parallel) or sequential workflow paths (e.g., Morning Briefing triggers 6 departments simultaneously).

---

## Phase 5: Activating Built-in Hands

Activate OpenFang's native autonomous capabilities.

1.  Activate `researcher`, `lead`, `collector`, `predictor`, `twitter`, `browser`, and `clip`. This immediately covers 18 operational departments.

---

## Phase 6: Writing Custom `HAND.toml` Files

Draft the remaining departmental logic schedules.

1.  Create 32 custom `HAND.toml` files mapping to the rest of the 50 departments.
2.  Prioritize initial `HAND.toml` setups: `retention_manager`, `support_l1`, `data_analyst`, `devops_monitor`, `finance_ops`, and `content_writer`. Set their respective execution schedules (cron) and LLM assignments.

---

## Phase 7: Building Workflows

Construct the pipelines chaining multiple Hands together.

1.  **`morning_briefing.toml`:** The P0 fan-out workflow triggering at 7:00 AM IST (Data Analyst, Finance, DevOps, Retention, Content Scheduler, Growth Researcher).
2.  **Secondary Workflows:** Draft the remaining 7 workflows including `incident_response`, `content_pipeline`, `churn_prevention`, and `conversion_funnel`.

---

## Phase 8: End-to-End Testing & Go-Live

Verify the fully autonomous system.

1.  **Morning Briefing Dry Run:** Force trigger the `morning_briefing` workflow.
2.  **Verify Proof of Life Block:** Ensure real Server 1 data (Razorpay balance, active users, agent status) populates correctly via the MCP server.
3.  **Telegram Verification:** Confirm the formatted morning brief arrives on the founder's Telegram via `@TalvixFounderBot` at exactly 7:02 AM IST.
4.  **Confirm Fallbacks:** Simulate a Server 5 failure to verify `@TalvixWatchdogBot` on Server 1 accurately alerts the founder.

---

## Phase 9: The Master Visual Interfaces (Public & Founder)

While the Founder primarily operates via the `@TalvixFounderBot` Telegram interface, Talvix AI Corp requires a state-of-the-art web presence. This serves two purposes:
1.  **Public Marketing (Cyber-Corp Showcase):** A hyper-futuristic, 3D landing page showcasing the 50 AI departments running the company in real-time. This is for public marketing and investor relations to prove the "AI-Operated Company" concept.
2.  **Mega Hyper Master Control Panel (Founder Visualizer):** A secure, private dashboard working *alongside* Telegram, giving the founder a visual God-mode view of all OpenFang processes. It provides real-time toggles, budget tracking, and kill switches for every agent.

**Hosting Constraint:** Both the public frontend and the private control panel must run *inside the Server 5 Docker container* alongside OpenFang, served via a reverse proxy (e.g., Caddy or Nginx) on separate ports or paths.

### Tech Stack for the Master UI
*   **Framework:** Next.js 15 (App Router) for hybrid SSR/SSG performance.
*   **3D Visualizations:** React Three Fiber (R3F) + Drei. We will render a 3D "neural network" or "cybernetic brain" where each glowing node represents one of the 50 active departments (Hands).
*   **Styling & Animation:** Tailwind CSS + Framer Motion for liquid-smooth, futuristic UI transitions and HUD-style readouts.
*   **State & Connectivity:** Zustand (state) + WebSockets connecting directly to OpenFang's kernel (via the Docker bridge network) to stream live agent logs, API token consumption, and status changes.

### 1. The Public Showcase (Talvix AI Corp Marketing)
*   **Visual:** A dark, minimalist, sci-fi interface. A rotating 3D globe or neural web showing live pulses whenever a department (e.g., "Marketing Director" or "Backend Engineer") fires an action.
*   **Data Feeds:** Streams sanitized, anonymized logs from OpenFang (e.g., "Dept 14: Retention Manager completed churn analysis").
*   **Goal:** To sell the narrative of the fully autonomous AI company layer operating the core AaaS product.

### 2. The Mega Hyper Master Control Panel (Private)
*   **Authentication:** Strictly gated (e.g., Magic Link via the Founder's Telegram bot or a hardware security key).
*   **The Command Matrix:**
    *   **Live Hand Toggles:** A grid of 50 switches to instantly pause, restart, or kill any department (e.g., pausing the `Marketing Director` if budget runs high).
    *   **API Budget Burn-Rate:** Real-time graphs showing token usage across Cerebras, Groq, Gemini, and Claude per department.
    *   **WASM Sandbox Monitor:** Live view of the 16 kernel-level security layers blocking prompt injections or SSRF attempts.
    *   **Workflow Visualizer:** A drag-and-drop or node-based visualizer showing the fan-out connections of workflows (like the Morning Briefing).
    *   **Direct Intercept:** The ability to intercept and manually rewrite an agent's drafted action before it executes.
    *   **Natural Language Chat Interface:** A built-in terminal/chat interface allowing the founder to bypass Telegram and communicate directly with the Commander AI right from the dashboard.

---

## Departmental Coverage Overview

Upon completion of Phase 8, the following 50 departments will be operational:

*   **Executive (3):** Commander / CEO-OS, Chief of Staff, Strategy & Intelligence.
*   **Engineering (8):** Engineering Commander, Backend, AI/ML, Scraper, Frontend, Database, Security, Test & Release.
*   **Marketing (9):** Marketing Director, Content Writer, SEO, Visual Designer, Video/Reels, Paid Ads, Community, PR, Distribution.
*   **Revenue (6):** Conversion, Retention, BD & Partnerships, Enterprise Sales, Affiliate, Pricing.
*   **Product & Eng Ops (5):** Product Manager, QA Monitor, DevOps, Security Officer, AI Agent QA.
*   **Analytics (4):** Data Analyst, Growth Researcher, BI & Reporting, User Behavior Analyst.
*   **Customer Success (5):** Support L1, Support L2, Onboarding, Success Manager, Voice of Customer.
*   **Finance & Legal (3):** Finance & Operations, Legal & Compliance, Fundraising Prep.
*   **Founder Layer (3):** Founder OS, Knowledge Manager, Hiring Intelligence (Standby).
*   **New Divisions (3):** Localization, Platform Reliability, Competitive Intelligence.
*   **Reliability Infra (1):** TalvixGuard Watchdog.