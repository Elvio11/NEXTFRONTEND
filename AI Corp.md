# TALVIX AI CORP
## COMPLETE ARCHITECTURE DOCUMENT
**AI-Operated Company Layer · OpenFang · 50 Departments · 4 Skill Libraries** *Version 1.0 · March 2026 · Founder: Elvio · CONFIDENTIAL*

| Metric | Value |
| :--- | :--- |
| **Departments** | 50 |
| **Divisions** | 11 |
| **Skill Libraries** | 4 |
| **Total Skills** | 507+ |
| **New Infra** | Server 5 |
| **Monthly Cost** | ~₹150 |

---

## 1. WHAT IS TALVIX AI CORP
Talvix AI Corp is the AI-operated company layer built on top of the Talvix SaaS product. It is not the product itself. The Talvix product — job automation for Indian job seekers at ₹499/month — runs on Servers 1-4 using CrewAI and 15 specialized agents. That system is untouched.

Talvix AI Corp is the company that operates around the product. It handles marketing, engineering, analytics, customer success, finance, legal, BD, and strategy — entirely through AI agents, with no human employees. One founder (Elvio) runs everything through a single Telegram bot.

### The Core Premise
| Category | Detail |
| :--- | :--- |
| **Goal** | One founder runs a full-scale SaaS company with zero human hires until revenue justifies it. |
| **Replaces** | ~17.5 human employees worth ₹13-17L/month in salaries. |
| **Costs** | ~₹150/month in API calls. Everything else is free tier or open source. |
| **Interface** | One private Telegram bot (@TalvixFounderBot). 15-30 minutes of founder time per day. |

### The Two-System Architecture
| System | What It Is | Status |
| :--- | :--- | :--- |
| **Talvix Product** | Servers 1-4, CrewAI, 15 agents, Sarvam-M, Supabase, MinIO. Handles users, job matching, auto-apply. | ✅ LIVE |
| **Talvix AI Corp** | Server 5, OpenFang, 50 departments, 507+ skills. Handles running the business around the product. | ⏳ BUILDING |

These are two separate systems. Talvix AI Corp observes the product through two thin read-only connections. It never modifies the product, touches the database, or interacts with users directly.

---

## 2. INFRASTRUCTURE — ALL 5 SERVERS

### Real Server Specifications (Verified March 2026)
| Server | Specs | Role | What Runs | AI Corp Access |
| :--- | :--- | :--- | :--- | :--- |
| **Server 1** | 0.5 vCore · 1GB · 5GB | Gateway Layer | Node.js 24 + Express · Agents 1+2 · Baileys WhatsApp · JWT/AES vault · stripSensitive middleware | YES — 14 read-only endpoints + MCP server + /founder-notify + TalvixGuard watchdog |
| **Server 2** | 2 vCores · 6GB · 15GB | Intelligence Layer | Python 3.12 + FastAPI + CrewAI · Agents 3-8 · Sarvam-M reasoning | NO DIRECT ACCESS — data flows via Server 1 only |
| **Server 3** | 5 vCores · 9GB · 15GB | Execution Layer | Python 3.12 + FastAPI + MCP Subprocesses · Agents 9-13 | NO DIRECT ACCESS — data flows via Server 1 only |
| **Server 4** | 0.7 vCore · 2.5GB · 100GB | Storage Layer | MinIO/FluxShare · User resumes, JDs, screenshots, cover letters | ZERO ACCESS EVER — contains user PII |
| **Server 5** | 2 vCores · 6GB · 100GB | Company Layer (NEW) | OpenFang 32MB binary · 50 departments · All company AI agents · @TalvixFounderBot | THIS IS TALVIX AI CORP — self-contained |

### Server 5 — The AI Company Server
| Spec | Detail |
| :--- | :--- |
| **CPU** | 2 vCores — comfortable for OpenFang + parallel Hands + morning briefing peak (0.5-0.8 vCore) |
| **RAM** | 6GB — OpenFang base ~100MB. Morning briefing peak ~500MB. Massive headroom vs 4GB initially planned. |
| **Storage** | 100GB — OpenFang + skills + logs + generated assets. ~1.5-2.5GB/month growth. Lasts 3-4 years. |
| **OS** | Ubuntu 22.04 LTS |
| **Runtime** | Single 32MB Rust binary. No Docker required. No Node.js runtime. One curl install command. |
| **Cost** | ~$8-15/month on FluxCloud — already decided and justified |

### Corrected Infrastructure Decision
* **Old knowledge doc said:** OpenFang on Server 4 (2 vCPU, 4GB RAM).
* **Audit revealed reality:** Server 4 is 0.7 vCore, 2.5GB RAM — cannot run OpenFang under load.
* **Decision:** New Server 5 (2 vCore, 6GB, 100GB). Clean separation. Server 4 stays storage only. Server 5 is purely the company OS — no MinIO, no product code, no mixed responsibilities.

---

## 3. THE PLATFORM — OPENFANG
OpenFang is an open-source Agent Operating System built in Rust by RightNow-AI. It is not a chatbot framework. It runs autonomous agents on schedules, 24/7, without waiting for user input.

### OpenFang vs OpenClaw — Why We Switched
| Dimension | OpenClaw | OpenFang |
| :--- | :--- | :--- |
| **Language** | Node.js/TypeScript | Rust |
| **Cold Start** | 5.98 seconds | 180ms (33x faster) |
| **RAM Footprint** | ~600-800MB base | ~100MB base (10x lighter) |
| **Primary Model** | Chat framework (reactive) | Agent OS (autonomous, schedule-driven) |
| **Security Systems** | ~3 basic | 16 independent kernel-level layers |
| **CVE History** | CVE-2026-25253 critical RCE | No equivalent published CVEs |
| **Skill Injection Protection** | Manual (was our Dept 50) | WASM sandbox + taint tracking (architectural) |
| **Autonomous Hands** | Not native | 7 built-in + unlimited custom HAND.toml |

### OpenFang Core Architecture
| Component | Detail |
| :--- | :--- |
| **openfang-kernel** | Orchestration, workflows, metering, RBAC, scheduler, budget tracking |
| **openfang-runtime** | Agent loop, LLM drivers, 60 tools, WASM sandbox, MCP client+server, A2A protocol |
| **openfang-hands** | 7 built-in autonomous Hands, HAND.toml parser, lifecycle management |
| **openfang-security** | 16 independent security systems: WASM sandbox, taint tracking, Ed25519 signing, SSRF protection, injection scanner, capability model, Merkle audit trail |
| **Single binary** | 32MB. `curl -fsSL https://openfang.sh/install | sh` — one command, no Docker needed |

### The Three Building Blocks for Talvix AI Corp
| Block | What It Is | Used For |
| :--- | :--- | :--- |
| **HANDS** | Autonomous capability packages that run on schedule without being prompted. HAND.toml defines schedule, tools, LLM, system prompt. | 49 of 50 departments run as Hands. Fires at cron time, reports to dashboard, sends approvals to Commander. |
| **AGENTS** | Interactive components that respond to messages AND run on schedule. Commander is an agent. | 1 Commander agent. Your Telegram interface. Receives your messages, compiles Hand outputs, sends you approvals. |
| **WORKFLOWS** | Pipelines chaining multiple Hands. Three modes: fan-out (parallel), conditional (branch), loop (repeat). | Morning briefing (fan-out 6 Hands), incident response, content pipeline, churn prevention, conversion funnel. |

---

## 4. COMPUTE REALITY — WHAT ACTUALLY COSTS MONEY
Every decision here was made to minimize cost to near-zero until revenue justifies upgrades. 

### LLM API Stack — Real Free Tier Numbers
| Model | Provider | Free Limit | Your Daily Usage | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen3-235B** | Cerebras | 24M tokens/day | ~12,000 tokens (0.05% of limit) | ₹0 |
| **Llama 3.3 70B** | Groq | ~14,400 req/day | ~600 req (4% of limit) | ₹0 |
| **Llama 4 Scout** | Groq | 10M context window | Weekly research only | ₹0 |
| **Gemini 2.5 Flash** | Google AI Studio | 250 req/day | ~26 req (10%) | ₹0 |
| **Qwen3-Coder-480B** | OpenRouter free | Shared pool | Engineering on-demand | ₹0 |
| **DeepSeek-V3** | OpenRouter free | Shared pool | Scraper engineer | ₹0 |
| **Codestral** | Mistral free | Free tier | Test & Release | ₹0 |
| **Claude Sonnet 4.6** | Anthropic | PAID | 5 security/eng agents | ~₹150/month |

### The Honest Numbers
* **Cerebras** handles Commander — 24M tokens/day free. Your entire company uses 0.05% of this. Never a concern.
* **Gemini's** 250 req/day is the real risk. Mitigation: Gemini Flash-Lite fallback (1000 req/day) configured as automatic fallback.
* **Claude Sonnet (~₹150/month)** is the ONLY paid cost. Used only for: Security Engineer, AI/ML Engineer, Engineering Commander, Skill Auditor. These agents fire on-demand, not on cron.
* **At first ₹50K MRR:** upgrade Gemini to paid Tier 1 (~$15/month). Everything else stays free.
* **When self-hosting LLM:** one config line change switches ALL Hands to your own model. Rate limits gone forever.

---

## 5. THE TWO CONNECTIONS — HOW AI CORP READS TALVIX
Talvix AI Corp connects to the Talvix product through exactly two endpoints on Server 1. Nothing else. Server 2, Server 3, and Server 4 are never touched.

### Connection A — OpenFang Pulls Data (Read-Only)
| Attribute | Detail |
| :--- | :--- |
| **Method** | `GET /mcp` (MCP tools) OR `GET /api/*` (REST fallback) |
| **Auth** | JWT — Elvio's personal token. Same middleware as all Server 1 routes. |
| **Security** | `stripSensitive` middleware strips session_encrypted, oauth_* automatically. Zod schemas validate inputs on MCP tools. |
| **Returns** | Aggregated metrics only. No PII. No per-user data. Server 1 enforces this before responding. |
| **MCP Server** | `/mcp` wraps all 14 read-only endpoints as typed MCP tools. Any Hand auto-discovers via MCPorter skill. |

### Connection B — Server 1 Pushes Events (Webhook)
| Attribute | Detail |
| :--- | :--- |
| **Method** | `POST /internal/founder-notify` on Server 5 |
| **Auth** | `X-Agent-Secret` header — same pattern as all Server 1 internal routes |
| **Payload** | `{ event_type, severity: low\|medium\|high\|critical, details: object, timestamp }` |
| **No PII** | User IDs never included. Severity + system event details only. `stripSensitive` enforces this. |

### What AI Corp NEVER Touches
* **Server 2 & 3:** ZERO DIRECT ACCESS. Data comes via S1 aggregates.
* **Server 4 (MinIO):** ZERO ACCESS. Contains user PII.
* **Supabase:** ZERO DIRECT ACCESS. Read-only via S1 only. Never use `service_role` key.
* **User Comms:** All user-facing actions require Elvio approval before any message is sent to users.

---

## 6. RELIABILITY — TALVIXGUARD + WATCHDOG
If Server 5 crashes, the company layer goes dark. The company OS cannot alert you that it is dead because it IS dead. TalvixGuard solves this.

### Three-Layer Reliability
| Layer | What It Is | What It Catches |
| :--- | :--- | :--- |
| **Layer 1 — TalvixGuard** | Node.js PM2 process on Server 1. ~400 lines. Independent of OpenFang. | OpenFang crash, OOM kill, Docker exit, process hang. |
| **Layer 2 — UptimeRobot** | External service pings Server 5 `/health/heartbeat` every 5 minutes. | Server 5 total death, FluxCloud network partition. |
| **Layer 3 — Proof of Life** | Morning brief contains live data (Razorpay balance, S1 ping, active users). | Silent degradation. Stale numbers = broken system. |

### The Two Telegram Bots
| Bot | Lives On | Purpose | Dies When |
| :--- | :--- | :--- | :--- |
| **@TalvixFounderBot** | Server 5 (OpenFang native) | Your interface to run the company. All approvals. | Server 5 goes down — expected, Watchdog tells you. |
| **@TalvixWatchdogBot** | Server 1 (TalvixGuard) | Alert-only. Sends you messages when Server 5 is dead. | Server 1 goes down — UptimeRobot emails you. |

---

## 7. THE FOUR SKILL LIBRARIES
All 50 departments are powered by four skill libraries. All load into OpenFang as SKILL.md files and pass through the WASM injection scanner.

| Library | Stars | Purpose | What It Provides |
| :--- | :--- | :--- | :--- |
| **agency-agents** | 31,000★ | WHO each Hand is | 147 specialist agent personas: marketing copywriter, security engineer, sales coach. |
| **antigravityskills.org** | 22,900★ | HOW each Hand works | 245 curated operational playbooks: programmatic SEO, CRO specialist, compliance auditing. |
| **OpenFang built-in** | Official | WHAT tools are available | 60 native tools: web_search, browser_automation, http_get, memory_read, notify. |
| **Ruflo v3.5 (Elvio fork)** | 20,100★ | HOW Engineering executes | 60+ swarm agents, 215 MCP tools, SPARC modes (architect/coder/tester/reviewer). |

---

## 8. THE 50 DEPARTMENTS — COMPLETE LIST
*Selected high-priority departments shown below based on document analysis.*

| # | Department | Division | LLM | Schedule | Core Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Commander / CEO-OS | Executive | Cerebras Qwen3-235B | Always on | Routes all tasks. Morning briefing 7AM. Escalates alerts. |
| 4 | Marketing Director | Marketing | Cerebras Qwen3-235B | Monday 8AM | Campaign strategy. Competitor monitoring. Content approval gate. |
| 12 | Distribution Manager | Marketing | Groq Llama 3.3 | Content calendar | Buffer scheduling 9AM/12PM/6PM. Mailchimp Tuesday 10AM. |
| 13 | Conversion Specialist | Revenue | Groq Llama 3.3 | Daily 10AM | Free→Paid nudges. Engagement segment scoring. A/B test tracking. |
| 14 | Retention Manager | Revenue | Groq Llama 3.3 | Daily 10PM | Churn prevention. Re-engagement for users with 0 matches 5+ days. |
| 36 | Founder OS | Founder Layer | Cerebras Qwen3-235B | 7AM + Sunday 9AM | Aggregates all Hand outputs into morning brief. Decision capture. |
| 39 | Engineering Commander | Engineering | Claude Sonnet 4.6 | Event + 9AM | Triages bugs, creates GitHub issues, spawns Ruflo swarms. |

---

## 9. HOW OPENFANG ROUTES AND DECIDES
OpenFang does not use AI to decide which department handles a message. Routing is deterministic. AI reasoning only happens inside a department after it has been routed.

* **Layer 1 — The Single Binding Rule:** Channel: telegram · AccountId: founder-bot · Peer: Elvio's Telegram ID → ALWAYS routes to Commander agent. `dmPolicy: allowlist`.
* **Layer 2 — Commander AI Reasoning:** Commander's `AGENTS.md` contains explicit routing rules (e.g., "Build an Instagram post" → Content Writer + Visual Designer in parallel).
* **Layer 3 — sessions_spawn:** Sub-agents CANNOT spawn further sub-agents (depth limit = 1). They have NO persistent memory — completely stateless. 

---

## 10. RUFLO — ENGINEERING SWARM EXECUTION
Ruflo v3.5 is the execution engine for the Engineering Division only. When Engineering Commander needs code written, it spawns a Ruflo swarm using SPARC modes.

**Ruflo Command Flow:** `architect` (system design) → `coder` (implementation) → `tester` (write tests first via TDD) → `reviewer` (code review) → `optimizer` (performance) → `documenter` (API docs).

---

## 11. MCP — MODEL CONTEXT PROTOCOL STRATEGY
MCP is a universal protocol for AI agents to call tools and APIs. 

### Making Server 1 MCP-Compatible (P1 Task)
* **What it is:** Adding `@modelcontextprotocol/sdk` Express middleware to Server 1. Creates a `/mcp` route alongside existing REST endpoints.
* **Security:** Same JWT middleware. Same `stripSensitive`. Zod input validation. RBAC in OpenFang enforces which Hands can call which tools.
* **What it replaces:** The `talvix-readonly.md` custom skill file. Direct tool call vs HTTP round-trip with auth overhead.

---

## 12. SECURITY ARCHITECTURE
OpenFang's 16 Security Layers (Kernel-Level, Automatic):
1. **WASM Sandbox:** Skills execute in isolated WebAssembly sandbox. Cannot escape to host OS.
2. **Taint Tracking:** Tainted content cannot trigger tool calls (prevents prompt injection).
3. **Ed25519 Signing:** Every skill file is cryptographically signed.
4. **Injection Scanner:** `SKILL.md` files scanned before loading.
5. **RBAC & Capability Model:** Immutable privileges declared at Hand creation.

### Non-Negotiable Rules
* Never Supabase direct.
* Never `service_role`.
* Never user PII.
* Human-in-the-loop for user comms.
* Zero direct access to S2, S3, S4 from Server 5.

---

## 13. WHAT TALVIX AI CORP REPLACES
| Division | Human Equivalent | Monthly Salary Saved | AI Corp Cost |
| :--- | :--- | :--- | :--- |
| **All 11 Divisions** | ~26 people | ₹18-26L/month | ~₹150/month |

**Honest Limitations:** It cannot replace physical presence, legal standing, emergency code fixes requiring deep proprietary logic context, or closing enterprise deals on a phone call.

---
*Talvix AI Corp v1.0 · March 2026 · Confidential — Elvio*