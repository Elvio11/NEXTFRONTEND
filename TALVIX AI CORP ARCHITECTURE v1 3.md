TALVIX AI CORP  ·  COMPLETE ARCHITECTURE DOCUMENT  ·  MARCH 2026  ·  CONFIDENTIAL

**TALVIX AI CORP**

**COMPLETE ARCHITECTURE DOCUMENT**

*AI-Operated Company Layer · OpenFang · 50 Departments · 4 Skill Libraries*

Version 1.0  ·  March 2026  ·  Founder: Elvio  ·  CONFIDENTIAL

|<p>**50**</p><p>Departments</p>|<p>**11**</p><p>Divisions</p>|<p>**4**</p><p>Skill Libraries</p>|<p>**507+**</p><p>Total Skills</p>|<p>**Server 5**</p><p>New Infra</p>|<p>**~₹150**</p><p>Monthly Cost</p>|
| :-: | :-: | :-: | :-: | :-: | :-: |



**1. WHAT IS TALVIX AI CORP**

Talvix AI Corp is the AI-operated company layer built on top of the Talvix SaaS product. It is not the product itself. The Talvix product — job automation for Indian job seekers at ₹499/month — runs on Servers 1-4 using CrewAI and 15 specialized agents. That system is untouched.

Talvix AI Corp is the company that operates around the product. It handles marketing, engineering, analytics, customer success, finance, legal, BD, and strategy — entirely through AI agents, with no human employees. One founder (Elvio) runs everything through a single Telegram bot.

|<p>**The Core Premise**</p><p>Goal: one founder runs a full-scale SaaS company with zero human hires until revenue justifies it.</p><p>Replaces: ~17.5 human employees worth ₹13-17L/month in salaries.</p><p>Costs: ~₹150/month in API calls. Everything else is free tier or open source.</p><p>Interface: one private Telegram bot (@TalvixFounderBot). 15-30 minutes of founder time per day.</p>|
| :- |

**The Two-System Architecture**

|**System**|**What It Is**|**Status**|
| :- | :- | :- |
|Talvix Product|Servers 1-4, CrewAI, 15 agents, Sarvam-M, Supabase, MinIO. Handles users, job matching, auto-apply.|✅ LIVE|
|Talvix AI Corp|Server 5, OpenFang, 50 departments, 507+ skills. Handles running the business around the product.|⏳ BUILDING|

*These are two separate systems. Talvix AI Corp observes the product through two thin read-only connections. It never modifies the product, touches the database, or interacts with users directly.*



**2. INFRASTRUCTURE — ALL 5 SERVERS**

**Real Server Specifications (Verified March 2026)**

|**Server**|**Specs**|**Role**|**What Runs**|**AI Corp Access**|
| :- | :- | :- | :- | :- |
|Server 1|0\.5 vCore · 1GB · 5GB|Gateway Layer|Node.js 24 + Express · Agents 1+2 · Baileys WhatsApp · JWT/AES vault · stripSensitive middleware|YES — 14 read-only endpoints + MCP server + /founder-notify + TalvixGuard watchdog|
|Server 2|2 vCores · 6GB · 15GB|Intelligence Layer|Python 3.12 + FastAPI + CrewAI · Agents 3-8 · Sarvam-M reasoning|NO DIRECT ACCESS — data flows via Server 1 only|
|Server 3|5 vCores · 9GB · 15GB|Execution Layer|Python 3.12 + FastAPI + Selenium · Agents 9-13 · Browser pool · Agents 14+15 MISSING (P0)|NO DIRECT ACCESS — data flows via Server 1 only|
|Server 4|0\.7 vCore · 2.5GB · 100GB|Storage Layer|MinIO/FluxShare · User resumes, JDs, screenshots, cover letters|ZERO ACCESS EVER — contains user PII|
|Server 5|2 vCores · 6GB · 100GB|Company Layer (NEW)|OpenFang 32MB binary · 50 departments · All company AI agents · @TalvixFounderBot|THIS IS TALVIX AI CORP — self-contained|

**Server 5 — The AI Company Server**

|**CPU**|2 vCores — comfortable for OpenFang + parallel Hands + morning briefing peak (0.5-0.8 vCore)|
| :- | :- |
|**RAM**|6GB — OpenFang base ~100MB. Morning briefing peak ~500MB. Massive headroom vs 4GB initially planned.|
|**Storage**|100GB — OpenFang + skills + logs + generated assets. ~1.5-2.5GB/month growth. Lasts 3-4 years.|
|**OS**|Ubuntu 22.04 LTS|
|**Runtime**|Single 32MB Rust binary. No Docker required. No Node.js runtime. One curl install command.|
|**Cost**|~$8-15/month on FluxCloud — already decided and justified|

**Why NOT Server 4 for OpenFang (Old Decision Corrected)**

|<p>**Corrected Infrastructure Decision**</p><p>Old knowledge doc said: OpenFang on Server 4 (2 vCPU, 4GB RAM).</p><p>Audit revealed reality: Server 4 is 0.7 vCore, 2.5GB RAM — cannot run OpenFang under load.</p><p>Decision: New Server 5 (2 vCore, 6GB, 100GB). Clean separation. Server 4 stays storage only.</p><p>Server 5 is purely the company OS — no MinIO, no product code, no mixed responsibilities.</p>|
| :- |



**3. THE PLATFORM — OPENFANG**

OpenFang is an open-source Agent Operating System built in Rust by RightNow-AI. It is not a chatbot framework. It runs autonomous agents on schedules, 24/7, without waiting for user input. This is the core reason it was chosen over OpenClaw.

**OpenFang vs OpenClaw — Why We Switched**

|**Dimension**|**OpenClaw**|**OpenFang**|
| :- | :- | :- |
|Language|Node.js/TypeScript|Rust|
|Cold Start|5\.98 seconds|180ms (33x faster)|
|RAM Footprint|~600-800MB base|~100MB base (10x lighter)|
|Primary Model|Chat framework (reactive)|Agent OS (autonomous, schedule-driven)|
|Security Systems|~3 basic|16 independent kernel-level layers|
|CVE History|CVE-2026-25253 critical RCE|No equivalent published CVEs|
|Skill Injection Protection|Manual (was our Dept 50)|WASM sandbox + taint tracking (architectural)|
|Autonomous Hands|Not native|7 built-in + unlimited custom HAND.toml|
|agency-agents compat|Native|✅ SKILL.md format supported|
|OpenClaw compat|—|openfang migrate --from openclaw|
|Version|Stable, 270K stars|v0.1.0 — newer but architecturally superior|
|License|MIT|Apache-2.0 + MIT|

**OpenFang Core Architecture**

|**openfang-kernel**|Orchestration, workflows, metering, RBAC, scheduler, budget tracking|
| :- | :- |
|**openfang-runtime**|Agent loop, LLM drivers, 60 tools, WASM sandbox, MCP client+server, A2A protocol|
|**openfang-hands**|7 built-in autonomous Hands, HAND.toml parser, lifecycle management|
|**openfang-security**|16 independent security systems: WASM sandbox, taint tracking, Ed25519 signing, SSRF protection, injection scanner, capability model, Merkle audit trail|
|**Single binary**|32MB. curl -fsSL https://openfang.sh/install | sh — one command, no Docker needed|

**The Three Building Blocks for Talvix AI Corp**

|**Block**|**What It Is**|**Used For**|
| :- | :- | :- |
|HANDS|Autonomous capability packages that run on schedule without being prompted. HAND.toml defines schedule, tools, LLM, system prompt.|49 of 50 departments run as Hands. Fires at cron time, reports to dashboard, sends approvals to Commander.|
|AGENTS|Interactive components that respond to messages AND run on schedule. Commander is an agent.|1 Commander agent. Your Telegram interface. Receives your messages, compiles Hand outputs, sends you approvals.|
|WORKFLOWS|Pipelines chaining multiple Hands. Three modes: fan-out (parallel), conditional (branch), loop (repeat).|Morning briefing (fan-out 6 Hands), incident response, content pipeline, churn prevention, conversion funnel.|



**4. COMPUTE REALITY — WHAT ACTUALLY COSTS MONEY**

Every decision here was made to minimize cost to near-zero until revenue justifies upgrades. This section is the honest truth about what runs free and what does not.

**LLM API Stack — Real Free Tier Numbers**

|**Model**|**Provider**|**Free Limit**|**Your Daily Usage**|**Cost**|
| :- | :- | :- | :- | :- |
|Qwen3-235B|Cerebras|24M tokens/day|~12,000 tokens (0.05% of limit)|₹0|
|Llama 3.3 70B|Groq|~14,400 req/day|~600 req (4% of limit)|₹0|
|Llama 4 Scout|Groq|10M context window|Weekly research only|₹0|
|Gemini 2.5 Flash|Google AI Studio|250 req/day|~26 req (10%)|₹0|
|Qwen3-Coder-480B|OpenRouter free|Shared pool|Engineering on-demand|₹0|
|DeepSeek-V3|OpenRouter free|Shared pool|Scraper engineer|₹0|
|Codestral|Mistral free|Free tier|Test & Release|₹0|
|Claude Sonnet 4.6|Anthropic|PAID|5 security/eng agents|~₹150/month|

|<p>**The Honest Numbers**</p><p>Cerebras handles Commander — 24M tokens/day free. Your entire company uses 0.05% of this. Never a concern.</p><p>Gemini's 250 req/day (cut from 1000 in Dec 2025 without notice) is the real risk. Mitigation: Gemini Flash-Lite fallback (1000 req/day) configured as automatic fallback.</p><p>Claude Sonnet ~₹150/month is the ONLY paid cost. Used only for: Security Engineer, AI/ML Engineer, Engineering Commander, Skill Auditor. These agents fire on-demand, not on cron.</p><p>At first ₹50K MRR: upgrade Gemini to paid Tier 1 (~$15/month). Everything else stays free.</p><p>When self-hosting LLM: one config line change switches ALL Hands to your own model. Rate limits gone forever.</p>|
| :- |

**Free Generation Stack**

|**Purpose**|**Tool**|**Cost**|**Notes**|
| :- | :- | :- | :- |
|Image Generation|Pixazo free API (FLUX.1 Schnell)|₹0|No auth needed, no watermark, ~1.2s per image|
|Image Fallback|HuggingFace FLUX.1-schnell|₹0|Free HF token, queued inference|
|Video Generation|HuggingFace Wan2.2 T2V|₹0|Cinematic quality, queued, 5-15 seconds output|
|Audio/TTS|Kokoro TTS (Apache 2.0)|₹0|Self-hosted, 40-70ms latency, Hindi supported|
|Voice Cloning|Chatterbox (MIT)|₹0|Beats ElevenLabs blind tests, 17 languages|
|Browser Debug|Playwright MCP + Skyvern|₹0|Open source, vision-based UI automation|

**Free Tools Stack**

|**Tool**|**Free Limit**|**Your Usage**|**Purpose**|
| :- | :- | :- | :- |
|Composio|20,000 calls/month|~630 calls (3.1%)|Remaining integrations not yet on MCP|
|Tavily|1,000 credits/month|~520 credits (52%)|Web search for research, competitive intel|
|UptimeRobot|50 monitors forever|1 monitor|External Server 5 heartbeat monitoring|
|GitHub API|5,000 req/hour|~50 req/day|Engineering workflows, PR management|
|Buffer|3 channels, 10 posts|3 channels|Social scheduling for Distribution Manager|
|OpenFang|MIT/Apache 2.0|—|The entire company OS — ₹0|
|agency-agents|MIT license|147 agents|All agent personas — ₹0|
|Ruflo v3.5|MIT license|Engineering only|Code swarms — ₹0|
|antigravityskills.org|Free directory|245 skills|Operational playbooks — ₹0|

**When MCP Replaces Composio**

Server 1 will be made MCP-compatible (P1 task). This turns all 14 Talvix data endpoints into MCP tools. Every Hand in OpenFang can then call them directly via MCPorter — no Composio call consumed, no rate limit, faster response. This also applies to Razorpay, Notion, GitHub, and Google Workspace when their MCP servers are configured. Composio handles the gaps where no MCP server exists yet.



**5. THE TWO CONNECTIONS — HOW AI CORP READS TALVIX**

Talvix AI Corp connects to the Talvix product through exactly two endpoints on Server 1. Nothing else. Server 2, Server 3, and Server 4 are never touched.

**Connection A — OpenFang Pulls Data (Read-Only)**

|**Method**|GET /mcp (MCP tools) OR GET /api/\* (REST fallback)|
| :- | :- |
|**Auth**|JWT — Elvio's personal token. Same middleware as all Server 1 routes.|
|**Security**|stripSensitive middleware strips session\_encrypted, oauth\_\* automatically. Zod schemas validate inputs on MCP tools.|
|**Returns**|Aggregated metrics only. No PII. No per-user data. Server 1 enforces this before responding.|
|**14 Endpoints**|/api/metrics · /api/agent-performance · /api/scraper-health · /api/conversion-data · /api/retention-data · /api/bd-intelligence · /api/product-intelligence · /api/engineering-metrics · /api/db-health · /api/infra-metrics · /api/behavior-analytics · /api/user-status · /api/support-themes · /api/geo-distribution|
|**MCP Server**|/mcp wraps all 14 endpoints as typed MCP tools. Any Hand auto-discovers via MCPorter skill. No skill files needed for data access.|

**Connection B — Server 1 Pushes Events (Webhook)**

|**Method**|POST /internal/founder-notify on Server 5|
| :- | :- |
|**Auth**|X-Agent-Secret header — same pattern as all Server 1 internal routes|
|**Trigger Events**|new\_paid\_signup · subscription\_cancelled · agent\_failure · server\_error · whatsapp\_disconnect · payment\_failed · payment\_captured|
|**Payload**|{ event\_type, severity: low|medium|high|critical, details: object, timestamp }|
|**No PII**|User IDs never included. Severity + system event details only. stripSensitive enforces this.|
|**Result**|OpenFang Commander receives event, routes to correct department Hand, drafts action, sends to Elvio for approval.|

|<p>**What AI Corp NEVER Touches**</p><p>Server 2 — ZERO ACCESS. All Server 2 data comes via Server 1 /api/\* aggregates.</p><p>Server 3 — ZERO ACCESS. All Server 3 data comes via Server 1 /api/\* aggregates.</p><p>Server 4 — ZERO ACCESS. MinIO contains user PII. AI Corp never touches it.</p><p>Supabase — ZERO DIRECT ACCESS. Never. Read-only via Server 1 endpoints only.</p><p>service\_role key — NEVER in any Server 5 env var, config file, or skill.</p><p>All user-facing actions — require Elvio approval before any message is sent to users.</p>|
| :- |



**6. RELIABILITY — TALVIXGUARD + WATCHDOG**

OpenFang is a single point of failure if nothing watches it. If Server 5 crashes, the company layer goes dark. The company OS cannot alert you that it is dead because it IS dead. TalvixGuard solves this.

**Three-Layer Reliability (Approach A + B Combined)**

|**Layer**|**What It Is**|**What It Catches**|
| :- | :- | :- |
|Layer 1 — TalvixGuard|Node.js PM2 process on Server 1. ~400 lines. Completely independent of OpenFang.|OpenFang crash, OOM kill, Docker exit, process hang, silent degradation (stale heartbeat file)|
|Layer 2 — UptimeRobot|External service pings Server 5 /health/heartbeat every 5 minutes from multiple regions.|Server 5 total death, FluxCloud network partition, infrastructure failure — when Server 1 is also unreachable|
|Layer 3 — Proof of Life|Every morning brief contains a live data block: Razorpay balance, active users, Server 1 ping, last agent run.|Silent degradation — OpenFang running but not actually working. Stale numbers = broken system.|

**TalvixGuard — Built by Bolt AI (P1 Task)**

|**Lives on**|Server 1 — the most independent server from OpenFang|
| :- | :- |
|**@TalvixWatchdogBot**|Alert-only Telegram bot. Independent of @TalvixFounderBot. Alerts when Server 5 dies.|
|**Heartbeat check**|Receives heartbeat from Server 5 every 2 minutes. If stale >10 min → fires alert.|
|**Message queue**|Receives ALL @TalvixFounderBot Telegram messages first. Forwards to Server 5 when alive. Queues when dead. Replays on recovery. No message ever lost.|
|**Direct commands**|/status /ping /metrics /restart — work even when OpenFang is completely dead|
|**UptimeRobot hook**|Receives UptimeRobot webhook when Server 5 unreachable. Forwards to @TalvixWatchdogBot.|
|**Auto-restart**|On Server 5 failure: attempts Docker restart via API. Logs attempt. Alerts Elvio either way.|

**The Two Telegram Bots**

|**Bot**|**Lives On**|**Purpose**|**Dies When**|
| :- | :- | :- | :- |
|@TalvixFounderBot|Server 5 (OpenFang native)|Your interface to run the company. All department interactions, briefings, approvals. Full OpenClaw capabilities.|Server 5 goes down — expected, @TalvixWatchdogBot tells you|
|@TalvixWatchdogBot|Server 1 (TalvixGuard, ~40MB)|Alert-only. Sends you messages when Server 5 is dead. Never dies with OpenFang.|Server 1 goes down — UptimeRobot emails you|



**7. THE FOUR SKILL LIBRARIES**

All 50 departments are powered by four skill libraries. Each library has a different purpose. All are MIT/Apache licensed. All load into OpenFang as SKILL.md files and pass through the WASM injection scanner automatically.

|**Library**|**Stars**|**Purpose**|**What It Provides**|
| :- | :- | :- | :- |
|agency-agents (msitarzewski)|31,000★|WHO each Hand is|147 specialist agent personas: marketing copywriter, backend architect, security engineer, sales coach, UX researcher. Personality, expertise, communication style, deliverable formats.|
|antigravityskills.org (sickn33)|22,900★|HOW each Hand works|245 curated operational playbooks: systematic debugging, API design, programmatic SEO, CRO specialist, compliance auditing, ethical hacking methodology, Supabase optimization.|
|OpenFang built-in|Official|WHAT tools are available|60 native tools: web\_search, browser\_automation, http\_get, memory\_read, memory\_write, notify, scheduler, write\_file, read\_file. Always available to all Hands.|
|Ruflo v3.5 (Elvio11/claude-flow)|20,100★ upstream|HOW Engineering executes code|Engineering Division ONLY. 60+ swarm agents, 215 MCP tools, 84.8% SWE-Bench solve rate, SPARC modes (architect/coder/tester/reviewer), neural training on Talvix codebase, 3-tier model routing saves 75% API cost.|

**Top Picks by Category**

**Highest-Rated for Talvix (from antigravityskills.org)**

|**Stars**|**Skill**|**Departments**|
| :- | :- | :- |
|⭐3,000|UI/UX Pro Max|Frontend Engineer, Visual Designer|
|⭐2,000|Ethical Hacking Methodology|Security Engineer|
|⭐2,000|Browser Automation (Playwright)|Frontend Eng, Scraper Eng, QA Monitor|
|⭐1,000|Agent Manager|Commander|
|⭐980|Systematic Debugging|ALL Engineering departments|
|⭐547|Compliance Auditing|Legal & Compliance|
|⭐535|Kaizen Review|Founder OS|
|⭐528|Agent Memory MCP|Commander, Knowledge Manager|
|⭐524|Autonomous Agents|ALL 50 departments|
|⭐524|Supabase|Database Engineer — DIRECTLY relevant|
|⭐519|Pricing Strategy|Pricing & Monetization|
|⭐512|Programmatic SEO|SEO Specialist|
|⭐510|Task Decomposition|Commander, Product Manager|
|⭐485|Marketing Mode (23 playbooks)|Marketing Director, Conversion Specialist|
|⭐480|Secrets Management|Security Officer, DevOps|
|⭐450|Frontend Design|Frontend Engineer|
|⭐431|CRO Specialist|Conversion Specialist|
|⭐429|Apollo.io|BD & Partnerships|



**8. THE 50 DEPARTMENTS — COMPLETE LIST**

Every department is an autonomous Hand on Server 5. Each fires on its own schedule, uses the right LLM, loads the relevant skill files, reads data from Server 1 MCP tools, and reports to Commander. Commander is the only department you ever interact with directly.

|**#**|**Department**|**Division**|**LLM**|**Status**|**Schedule**|**Core Responsibility**|
| :- | :- | :- | :- | :- | :- | :- |
|**1**|**Commander / CEO-OS**|**Executive**|Cerebras Qwen3-235B|**CORE**|*Always on*|Routes all tasks. Morning briefing 7AM. Escalates alerts. Your Telegram interface.|
|**2**|**Chief of Staff**|**Executive**|Cerebras Qwen3-235B|**CORE**|*Daily 8AM*|Tracks open tasks, flags delays, weekly ops review, Notion task board.|
|**3**|**Strategy & Intelligence**|**Executive**|Cerebras Qwen3-235B|**ACTIVE**|*Monthly*|Quarterly strategy, market sizing, investor narrative, expansion opportunities.|
|**39**|**Engineering Commander**|**Engineering**|Claude Sonnet 4.6|**CORE**|*Event + 9AM*|Triages bugs, creates GitHub issues, spawns Ruflo swarms for all code tasks.|
|**40**|**Backend Engineer**|**Engineering**|Qwen3-Coder-480B (free)|**CORE**|*Event-driven*|Architecture specs for Ruflo swarms. Server 1 endpoint design. Node.js patterns.|
|**41**|**AI/ML Engineer**|**Engineering**|Claude Sonnet 4.6|**CORE**|*Daily 6AM*|Monitors 15 product agents. Fit score drift. Ruflo neural training on Talvix patterns.|
|**42**|**Scraper Engineer**|**Engineering**|DeepSeek-V3 (free)|**CORE**|*Daily 5AM*|Agent 9 health. Source breakage detection. Job pool monitoring.|
|**43**|**Frontend Engineer**|**Engineering**|Qwen3-Coder-480B (free)|**CORE**|*Event + weekly*|Next.js 15.5 debugging. React Profiler. Hydration errors. Tier gate verification.|
|**44**|**Database Engineer**|**Engineering**|Qwen3-Coder-480B (free)|**ACTIVE**|*Weekly*|Supabase schema optimization. Ruflo-generated migration scripts. Query performance.|
|**45**|**Security Engineer**|**Engineering**|Claude Sonnet 4.6|**ACTIVE**|*Daily + weekly*|CVE monitoring. ruflo security scan --depth full. API security. Pen test simulation.|
|**46**|**Test & Release Engineer**|**Engineering**|Codestral (free)|**ACTIVE**|*Pre/post-deploy*|Ruflo SPARC TDD for Agent 14+15. CI/CD pipeline. Release verification.|
|**4**|**Marketing Director**|**Marketing**|Cerebras Qwen3-235B|**CORE**|*Monday 8AM*|Campaign strategy. Competitor monitoring. Content approval gate.|
|**5**|**Content Writer**|**Marketing**|Gemini 2.5 Flash|**CORE**|*Daily 9AM*|Blog, social, email, WhatsApp, video scripts. Humanizer skill on all output.|
|**6**|**SEO Specialist**|**Marketing**|Gemini 2.5 Flash|**CORE**|*Daily + weekly*|Keyword research. Content optimization. Rankings for Indian job search terms.|
|**7**|**Visual Designer**|**Marketing**|Gemini 2.5 Flash|**CORE**|*On content brief*|Pixazo FLUX image generation. Brand consistency. Thumbnail creation.|
|**8**|**Video & Reels Producer**|**Marketing**|Gemini 2.5 Flash|**ACTIVE**|*Weekly 2 videos*|Reels scripts. Wan2.2 video generation. Kokoro Hindi/English voiceover.|
|**9**|**Paid Ads Manager**|**Marketing**|Cerebras Qwen3-235B|**ACTIVE**|*Monday + campaign*|Google/Meta ad copy. Budget recommendations. 200-point monthly audit.|
|**10**|**Community Manager**|**Marketing**|Groq Llama 3.3|**ACTIVE**|*Daily scan*|Reddit/LinkedIn/Quora/Twitter monitoring. Pain point collection. Authentic engagement drafts.|
|**11**|**PR & Communications**|**Marketing**|Groq Llama 4 Scout|**ACTIVE**|*Milestone-driven*|Press releases. Journalist outreach. Product Hunt. Elvio LinkedIn ghostwriting.|
|**12**|**Distribution Manager**|**Marketing**|Groq Llama 3.3|**CORE**|*Per content calendar*|Buffer scheduling 9AM/12PM/6PM. Mailchimp Tuesday 10AM. UTM tracking.|
|**13**|**Conversion Specialist**|**Revenue**|Groq Llama 3.3|**CORE**|*Daily 10AM*|Free→Paid nudges. Engagement segment scoring. A/B test tracking.|
|**14**|**Retention Manager**|**Revenue**|Groq Llama 3.3|**CORE**|*Daily 10PM*|Churn prevention. Re-engagement for users with 0 matches 5+ days. Exit surveys.|
|**15**|**BD & Partnerships**|**Revenue**|Cerebras Qwen3-235B|**CORE**|*Monday 5 drafts*|College placement cell outreach. 5 cold emails/week for Elvio approval. Pipeline in Notion.|
|**16**|**Enterprise Sales**|**Revenue**|Cerebras Qwen3-235B|**ACTIVE**|*On BD handoff*|MEDDPICC qualification. B2B proposals. Bulk licensing deals.|
|**17**|**Affiliate & Influencer**|**Revenue**|Groq Llama 4 Scout|**ACTIVE**|*Monday outreach*|10 Indian career influencers/week. UTM source tracking. Commission management.|
|**18**|**Pricing & Monetization**|**Revenue**|Gemini 2.5 Flash|**ACTIVE**|*Monthly*|WTP analysis. Free tier limit hit rate. Plan structure recommendations.|
|**19**|**Product Manager**|**Prod & Eng Ops**|Cerebras Qwen3-235B|**CORE**|*Monday brief*|Support ticket clustering. Feature specs in Notion. Roadmap maintenance.|
|**20**|**QA Monitor**|**Prod & Eng Ops**|Groq Llama 3.3|**CORE**|*Every 5 min*|Health pings S1-S5. Agent failure rate. Gate block monitoring. WhatsApp status.|
|**21**|**DevOps / Infra**|**Prod & Eng Ops**|Groq Llama 3.3|**CORE**|*Every 5 min*|CPU/RAM/Disk all 5 servers. Docker status. FluxCloud cost monitoring.|
|**22**|**Security Officer (Product)**|**Prod & Eng Ops**|Claude Sonnet 4.6|**ACTIVE**|*Daily + weekly*|stripSensitive coverage. New endpoint security. Auth pattern monitoring.|
|**23**|**AI Agent QA**|**Prod & Eng Ops**|Groq Llama 3.3|**ACTIVE**|*Daily 6AM*|15 product agent quality scores. Fit score drift. Sarvam-M latency trends.|
|**24**|**Data Analyst**|**Analytics**|Gemini 2.5 Flash|**CORE**|*7AM + hourly*|Daily metrics dashboard. Anomaly detection. Cohort analysis. P&L estimate.|
|**25**|**Growth Researcher**|**Analytics**|Groq Llama 4 Scout|**CORE**|*Monday + demand*|Full competitor teardowns. 10M context window reads entire competitor sites.|
|**26**|**BI & Reporting**|**Analytics**|Groq Llama 4 Scout|**ACTIVE**|*Sunday 9AM + 1st*|Weekly P&L. Monthly financials. 90-day trends. GST summary for CA.|
|**27**|**User Behavior Analyst**|**Analytics**|Gemini 2.5 Flash|**ACTIVE**|*Weekly*|Session patterns. Feature usage by tier. Time-to-first-value measurement.|
|**28**|**Customer Support L1**|**Customer Success**|Groq Llama 3.3|**CORE**|*Always on*|First-line support. 70%+ resolution. Billing, how-to, account status via /api/user-status.|
|**29**|**Customer Support L2**|**Customer Success**|Groq Llama 3.3|**CORE**|*On L1 escalation*|Complex bugs. Compensation drafts (Elvio approval). Angry user recovery.|
|**30**|**Onboarding Specialist**|**Customer Success**|Gemini 2.5 Flash|**CORE**|*On new signup*|Day 1/3/7/14 touchpoints. Hindi variants for tier-2 cities. Setup completion nudges.|
|**31**|**Success Manager**|**Customer Success**|Gemini 2.5 Flash|**ACTIVE**|*Weekly*|High-value user health checks. Monthly NPS campaigns. Expansion opportunity detection.|
|**32**|**Voice of Customer**|**Customer Success**|Groq Llama 4 Scout|**ACTIVE**|*Friday synthesis*|Support themes + app reviews + Twitter mentions → weekly top 5 pain points.|
|**33**|**Finance & Operations**|**Finance & Legal**|Gemini 2.5 Flash|**CORE**|*Daily + 1st of month*|Razorpay reconciliation. P&L. GST summary. API cost tracking.|
|**34**|**Legal & Compliance**|**Finance & Legal**|Cerebras Qwen3-235B|**ACTIVE**|*Weekly*|LinkedIn/Indeed ToS monitoring. DPDP Act. Kill switch value recommendations.|
|**35**|**Fundraising Prep**|**Finance & Legal**|Cerebras Qwen3-235B|**ACTIVE**|*Monthly*|Data room. Investor metrics package. Funding scenario modeling.|
|**36**|**Founder OS**|**Founder Layer**|Cerebras Qwen3-235B|**CORE**|*7AM + Sunday 9AM*|Aggregates all Hand outputs into morning brief. Decision capture. Weekly review.|
|**37**|**Knowledge Manager**|**Founder Layer**|Gemini 2.5 Flash|**ACTIVE**|*Weekly*|Checks for new skills. Updates SOUL.md. Runs Skills Audit on every new skill.|
|**38**|**Hiring Intelligence**|**Founder Layer**|Cerebras Qwen3-235B|**STANDBY**|*Manual only*|JD writing, candidate research. Activates when Elvio decides to hire.|
|**47**|**Localization Manager**|**New Divisions**|Gemini 2.5 Flash|**ACTIVE**|*Weekly*|Hindi/Tamil/Telugu content variants. Tier-2 city targeting. Kokoro TTS.|
|**48**|**Platform Reliability Eng**|**New Divisions**|Claude Sonnet 4.6|**ACTIVE**|*Daily upstream*|LinkedIn/Indeed/Naukri scrape health. Razorpay/Supabase/Baileys API changes.|
|**49**|**Competitive Intelligence**|**New Divisions**|Groq Llama 4 Scout|**ACTIVE**|*Daily monitoring*|24/7 competitor pricing, feature launches, funding rounds, user complaints.|
|**50**|**TalvixGuard Watchdog**|**Reliability Infra**|No LLM — Node.js|**CORE**|*Every 60 sec*|Server 1 resident. Heartbeat monitor. @TalvixWatchdogBot. Message queue. Auto-restart.|



**9. HOW OPENFANG ROUTES AND DECIDES**

This is the most important thing to understand about how the system works. OpenFang does not use AI to decide which department handles a message. Routing is deterministic. AI reasoning only happens inside a department after it has been routed.

**Layer 1 — Bindings (Deterministic, No AI)**

Every inbound message has a (channel, accountId, peer) tuple. OpenFang matches it against the bindings config — most specific wins. For Talvix AI Corp there is exactly one binding:

|<p>**The Single Binding Rule**</p><p>Channel: telegram · AccountId: founder-bot · Peer: Elvio's Telegram ID</p><p>→ ALWAYS routes to Commander agent.</p><p>Elvio sends a message → Commander. No other routing possible.</p><p>dmPolicy: allowlist — anyone else who messages the bot gets no response.</p>|
| :- |

**Layer 2 — Commander AI Reasoning (Routing Decision)**

Once Commander receives a message, the LLM reads it and decides which Hand to spawn. Commander's AGENTS.md contains explicit routing rules:

|**You Say / Event**|**Commander Routes To**|**Parallel?**|
| :- | :- | :- |
|Build an Instagram post|Content Writer + Visual Designer|YES — both spawn simultaneously|
|Run an ad campaign|Marketing Director → Content Writer + Visual Designer → Distribution|YES fan-out|
|What's our MRR today?|Data Analyst + Finance|YES parallel|
|Server is down|DevOps Monitor + QA Monitor → Commander alert|YES parallel|
|User complaint received|Support L1 → if escalated → Support L2 → Elvio approval|Sequential|
|Partnership opportunity|BD & Partnerships → Elvio approval|Sequential|
|Write a blog post|SEO Specialist (keywords) → Content Writer → Elvio approval → Distribution|Sequential|
|Razorpay: payment.captured|Finance logs → Commander notifies Elvio|Sequential|
|New user signup|Onboarding Specialist Day 1 sequence → Elvio approval|Sequential|
|User cancellation|Retention Manager → exit survey → Voice of Customer|Sequential|
|Server 1 /founder-notify|Commander classifies severity → routes to correct Hand|Depends on severity|

**Layer 3 — sessions\_spawn (How Hands Execute)**

|**sessions\_spawn**|Fires a sub-agent session in parallel. Always non-blocking. Returns immediately. Result announced to Commander when complete. Used for: morning briefing 6 Hands, campaign content + visual simultaneously.|
| :- | :- |
|**sessions\_send**|Sends message to another session and waits for reply. Sequential. Used when one Hand's output is needed before the next step. Max wait: 120 seconds before timeout.|
|**Sub-agent rules**|Sub-agents CANNOT spawn further sub-agents (depth limit = 1). Sub-agents have NO persistent memory — completely stateless. They complete their task, return structured output, and terminate. Commander is the ONLY stateful agent.|
|**Parallel ceiling**|Morning briefing = 6 simultaneous spawns. RAM usage: ~300-500MB peak on Server 5 6GB = always comfortable. No rate limit conflict because each Hand uses a different LLM API.|



**10. RUFLO — ENGINEERING SWARM EXECUTION**

Ruflo v3.5 (formerly Claude Flow) is a multi-agent software engineering orchestration platform. Elvio has a personal fork at github.com/Elvio11/claude-flow. The upstream project (ruvnet/ruflo) has 20,100 stars and 5,800+ commits. MIT licensed.

Ruflo does NOT replace OpenFang. It is the execution engine for the Engineering Division only. When Engineering Commander needs code written, it spawns a Ruflo swarm — not a single agent.

**How Ruflo Works Inside Talvix AI Corp**

|**Trigger**|Engineering Commander receives a coding task (bug fix, new feature, Agent 14 implementation).|
| :- | :- |
|**Swarm spawned**|Commander calls: ruflo sparc <mode> "<task description>"|
|**SPARC modes**|architect (system design) → coder (implementation) → tester (write tests first via TDD) → reviewer (code review) → optimizer (performance) → documenter (API docs)|
|**Auto-coordination**|Each specialist agent passes its output directly to the next via stream-JSON chaining. No manual routing.|
|**Result**|Ruflo produces: working code + test suite + documentation + PR ready for review. Engineering Commander receives it, creates GitHub PR via talvix-github.md skill.|
|**Neural learning**|ruflo neural train --pattern-type coordination teaches Ruflo about Talvix codebase patterns over time. Gets smarter with each build.|
|**Cost saving**|3-tier model routing: WASM (<1ms, free) for simple edits. Cheaper models for medium tasks. Claude only for complex architecture. Saves up to 75% on API costs vs single-model approach.|
|**SWE-Bench**|84\.8% solve rate for software engineering tasks.|

**Priority Engineering Tasks (When AI Corp Launches)**

|**Priority**|**Task**|**Ruflo Command**|
| :- | :- | :- |
|P0|Initialize Agent 14 (Follow-Up Sender)|ruflo sparc tdd "Agent 14 follow-up sender FastAPI async"|
|P0|Initialize Agent 15 (Feedback Calibrator)|ruflo sparc tdd "Agent 15 feedback calibrator pipeline"|
|P1|Externalize LinkedIn kill switch|ruflo sparc coder "os.environ LINKEDIN\_KILL\_SWITCH in anti\_ban\_checker.py and apply\_engine.py"|
|P1|Implement WhatsApp outbound|ruflo sparc coder "waClient.js sendMessage via Baileys connection"|
|P1|Build 14 Server 1 API endpoints|ruflo sparc architect → coder → tester (14 Express routes)|
|P1|Build Talvix MCP server|ruflo sparc coder "@modelcontextprotocol/sdk wrapper for 14 endpoints"|
|P2|CI/CD GitHub Actions pipeline|ruflo sparc devops "GitHub Actions deploy workflow per server"|
|P2|Frontend tier gate verification|ruflo sparc tester "Playwright tests for free vs paid feature gates"|



**11. MCP — MODEL CONTEXT PROTOCOL STRATEGY**

MCP is a universal protocol for AI agents to call tools and APIs. OpenFang is both an MCP client and server. Every Hand in OpenFang can call any MCP server via the MCPorter skill (⭐462). This is the foundation of future-proofing.

**Making Server 1 MCP-Compatible (P1 Task)**

|**What it is**|Adding @modelcontextprotocol/sdk Express middleware to Server 1. Creates a /mcp route alongside existing REST endpoints.|
| :- | :- |
|**Effort**|~210 lines of Node.js. Half a day. All 14 existing API functions wrapped as typed MCP tools. Built by Bolt AI or Backend Engineer.|
|**Security**|Same JWT middleware. Same stripSensitive. Zod input validation. RBAC in OpenFang enforces which Hands can call which tools.|
|**What it replaces**|The talvix-readonly.md custom skill file. No more URL management, JWT handling, or JSON parsing in skill files.|
|**Speed gain**|Direct tool call vs HTTP round-trip with auth overhead. Sub-second vs 2-5 seconds.|
|**Composio relief**|Most frequent calls (Talvix data) move off Composio. 20K free call limit pressure drops significantly.|

**MCP Access Across All 50 Departments**

Ruflo's 215 MCP tools are Engineering Division only. But MCP as a protocol is universal — every Hand can call any configured MCP server via MCPorter.

|**Division**|**MCP Servers Used**|
| :- | :- |
|Executive + Founder|Notion MCP (task management), Google Calendar MCP (scheduling)|
|Engineering|GitHub MCP, Ruflo 215 tools (code-specific), Terminal MCP, Docker MCP|
|Marketing|Buffer MCP (social scheduling), Google Analytics MCP, Twitter/X MCP|
|Revenue|Razorpay MCP (read-only payments), HubSpot MCP, Apollo.io MCP|
|Analytics|Google Sheets MCP (reporting), Supabase MCP (if ever needed, scoped read-only)|
|Customer Success|Talvix MCP /api/user-status tool (account health lookups)|
|Finance & Legal|Razorpay MCP, Google Workspace MCP|
|ALL Departments|Talvix MCP server (Server 1 /mcp) — 14 data tools available to every Hand|

**Future-Proofing via MCP**

1,500+ MCP servers exist today and growing. Every new SaaS that ships an MCP server becomes instantly available to all 50 departments via MCPorter — no integration code, no Composio call consumed, no middleware. When Talvix self-hosts its own LLM, direct MCP calls from the model to the MCP server means near-zero latency and complete control.



**12. SECURITY ARCHITECTURE**

**OpenFang's 16 Security Layers (Kernel-Level, Automatic)**

|**Layer**|**What It Does**|**Why It Matters for Talvix**|
| :- | :- | :- |
|WASM Sandbox|Skills execute in isolated WebAssembly sandbox. Cannot escape to host OS.|Eliminates risk of malicious ClawHub-equivalent skill doing RCE like CVE-2026-25253|
|Taint Tracking|Content from external sources carries a taint label. Tainted content cannot trigger tool calls.|Prompt injection via competitor websites or user emails cannot trigger Server 1 API calls|
|Ed25519 Signing|Every skill file is cryptographically signed. Unsigned skills rejected.|No unsigned skill can be loaded even if injected into Server 5 filesystem|
|Injection Scanner|SKILL.md files scanned before loading. Detects override attempts, exfiltration patterns.|Eliminates need for Dept 50 (Skill Security Auditor) as a separate department|
|SSRF Protection|Built-in server-side request forgery protection.|Prevents Hands from being tricked into calling internal Talvix server endpoints|
|RBAC|Role-based access control. Each Hand declares exactly which tools it can use.|Retention Manager cannot call Engineering MCP tools. Enforced at kernel, not application level|
|Capability Model|Capabilities declared at Hand creation, immutable after. Cannot escalate privileges.|Even if a Hand's LLM is manipulated, it cannot use undeclared tools|
|Merkle Audit Trail|Tamper-evident execution log for every tool call.|Complete audit history of what every Hand did and when. Immutable.|

**Non-Negotiable Security Rules**

|**Rule**|**Detail**|
| :- | :- |
|Never Supabase direct|Zero direct Supabase connection from Server 5. Read-only via Server 1 /mcp only.|
|Never service\_role|Not in any env var, config, or skill on Server 5. Server 1 ANON key only confirmed by audit.|
|Never user PII|No user names, emails, phones, resume content, or application data ever reaches Server 5.|
|Human-in-the-loop|All user-facing messages (WhatsApp, email, support responses) require Elvio approval before send.|
|Never SSH into servers|OpenFang cannot SSH into Servers 1-4. Engineering fixes happen via GitHub issues + human deploy.|
|No S2/S3/S4 direct calls|Zero API calls from Server 5 to Servers 2, 3, or 4 directly.|
|Telegram allowlist|@TalvixFounderBot: only Elvio's Telegram ID. dmPolicy: allowlist. Nobody else can prompt the company OS.|
|FluxCloud env vars|All secrets injected at runtime via FluxCloud UI. No .env files committed. No hardcoded values.|



**13. THE DAILY OPERATING SYSTEM**

This is what actually happens every day, automatically, without you doing anything until the morning brief arrives.

|**Time (IST)**|**What Fires**|**What You Receive**|
| :- | :- | :- |
|2:00 AM|researcher Hand scans Arya/LoopCV/Naukri/Internshala|Queued for morning brief|
|5:00 AM|collector Hand pings all 5 servers. browser Hand checks scraper health.|Queued for morning brief|
|6:00 AM|AI/ML Engineer checks agent performance. Scraper Engineer checks job pool.|GitHub issues created if problems found|
|7:00 AM|morning\_briefing workflow fires — 6 Hands in parallel: Data Analyst, Finance, DevOps, Retention, Content Scheduler, Growth Researcher|Morning brief on @TalvixFounderBot at 7:02 AM|
|7:02 AM|You receive morning brief|Approve/reject 2-3 content items. Review alerts. Takes 5 minutes.|
|9:00 AM|Distribution Manager posts approved LinkedIn content via Buffer|Content live on LinkedIn|
|10:00 AM|Conversion Specialist scans free user engagement buckets|Nudge drafts queued for your approval|
|10:00 AM|Retention Manager scans paid users for at-risk signals|Re-engagement drafts queued for approval|
|12:00 PM|Distribution Manager posts approved Twitter content|Content live on Twitter|
|6:00 PM|Distribution Manager posts approved Instagram content|Content live on Instagram|
|10:00 PM|Retention Manager second scan. Finance logs day's Razorpay transactions.|Logged silently|
|Any time|Server 1 /founder-notify fires (signup, cancel, failure, alert)|Immediate Telegram message with severity badge|
|Sunday 9AM|weekly\_reports workflow: BI Report, P&L, Engineering health, VoC synthesis|Weekly review package on @TalvixFounderBot|

**Your Daily Time Investment**

|<p>**What You Actually Do**</p><p>7:02 AM — Read morning brief, approve/reject content queue (5 minutes)</p><p>Throughout day — Tap APPROVE/REJECT on drafts as they arrive. Each takes 5-10 seconds.</p><p>As needed — Type natural language commands to Commander via Telegram.</p><p>Sunday — Read weekly review and engineering report (15 minutes).</p><p>Monthly — Approve Finance P&L for CA, review pricing recommendations (10 minutes).</p><p>TOTAL: 15-30 minutes active time per day. Company runs itself the rest of the time.</p>|
| :- |



**14. BUILD ORDER — PHASE BY PHASE**

**Phase 1 — Server 1 Additions (Build with Bolt AI)**

Everything OpenFang needs to read Talvix data. Built as a standalone Node.js addition to Server 1.

|**Task**|**Tool**|**Est. Time**|
| :- | :- | :- |
|14 read-only REST endpoints (/api/metrics etc.)|Bolt AI|4 hours|
|Talvix MCP server (/mcp wrapping 14 endpoints)|Bolt AI|3 hours|
|POST /internal/founder-notify endpoint|Bolt AI|1 hour|
|TalvixGuard watchdog app (~400 lines Node.js)|Bolt AI|3 hours|
|Deploy all additions to Server 1|FluxCloud + existing CI/CD|1 hour|

**Phase 2 — Server 5 Setup**

|**Task**|**Command**|**Est. Time**|
| :- | :- | :- |
|Provision Server 5 on FluxCloud|FluxCloud UI|15 min|
|Install OpenFang|curl -fsSL https://openfang.sh/install | sh|5 min|
|Register @TalvixFounderBot|BotFather on Telegram → add token to config.toml|15 min|
|Set all env vars|FluxCloud UI → all API keys, JWT secrets, tokens|30 min|
|Configure Talvix MCP server URL in OpenFang|config.toml mcp\_servers section|10 min|
|Configure UptimeRobot monitor|UptimeRobot free account → add Server 5 /health|10 min|

**Phase 3 — Load Skill Libraries**

|**Library**|**Command**|**Notes**|
| :- | :- | :- |
|agency-agents (147 agents)|git submodule add https://github.com/msitarzewski/agency-agents|Auto-scanned by WASM injection scanner on load|
|antigravityskills.org (245 skills)|npx antigravity-awesome-skills|Installs to ~/.agent/skills/ — auto-discovered|
|Ruflo v3.5 (Engineering)|npm install -g @ruflo/cli then ruflo init|Configure with Talvix codebase context|
|Verify all loaded|openfang skills list|Should show 507+ skills available|

**Phase 4 — SOUL.md and Commander System Prompt**

|<p>**Most Critical Files**</p><p>SOUL.md: Master constraints injected into every agent. Contains: absolute rules (no Supabase direct, no service\_role, no user PII, human-in-the-loop), Talvix context (product overview, server architecture, 15 agents, Hybrid Orchestrator 4-gate system, 26-table DB), LLM assignments per department.</p><p>AGENTS.md: Commander routing rules. Contains: all 50 departments and what triggers them, skill mappings, Hand spawn patterns, approval queue behavior.</p><p>These two files are the most important things you write. They define the entire system behavior. Write them carefully.</p>|
| :- |

**Phase 5-8 — Hands, Workflows, Testing**

|**Phase**|**Task**|**Priority Hands / Items**|
| :- | :- | :- |
|Phase 5|Activate 7 built-in Hands|researcher, lead, collector, predictor, twitter, browser, clip — 18 departments live in 7 commands|
|Phase 6|Write 32 custom HAND.toml files|Start with: retention\_manager, support\_l1, data\_analyst, devops\_monitor, finance\_ops, content\_writer|
|Phase 7|Import 8 workflow .toml files|morning\_briefing first, then incident\_response, then all others|
|Phase 8|End-to-end test|Morning briefing fires at 7AM. Proof of Life block has real data. You receive it on Telegram. System is live.|



**15. ALL LOCKED DECISIONS**

These decisions were made after full analysis and are not to be re-evaluated without a specific reason.

|**#**|**Decision**|**Reason Locked**|
| :- | :- | :- |
|1|OpenFang over OpenClaw|Rust performance (33x faster start, 10x less RAM), 16 kernel-level security layers, autonomous Hands architecture, no CVE-equivalent|
|2|Server 5: 2 vCore / 6GB / 100GB|Server 4 confirmed too small (0.7vCore / 2.5GB). Clean separation of company OS from product storage.|
|3|Single OpenFang instance|Multi-instance = coordination overhead, session conflicts (confirmed by OpenFang docs). One instance handles all 50 departments.|
|4|Commander is only channel-bound agent|All 49 other departments are internal Hands. They never receive Telegram messages directly.|
|5|Free LLMs for all except security/eng|Cerebras/Groq/Gemini handle 45 of 50 departments for ₹0. Claude Sonnet only for 5 critical security/engineering agents (~₹150/mo).|
|6|Sarvam-M NEVER for AI Corp|It is Talvix product's cost moat. Reserved exclusively for Servers 2/3 product agents.|
|7|Server 1 as the only data gateway|stripSensitive middleware already enforces PII protection. All 14 endpoints inherit it automatically.|
|8|MCP over custom skill files for data|Direct MCP tool calls: faster, no URL management, no JWT handling per skill, auto-discovered by MCPorter.|
|9|@TalvixWatchdogBot lives on Server 1|Must survive Server 5 dying. Cannot live with OpenFang. Server 1 is most stable server.|
|10|agency-agents as SKILL.md (not native Hand configs)|147 personas available as injectable knowledge. Works with OpenFang's SKILL.md format natively.|
|11|Ruflo Engineering Division only|Ruflo is a software development tool. It has no application to marketing, finance, support, or any non-engineering department.|
|12|FluxCloud env vars for all secrets|Confirmed by audit: Doppler was reference-only. Runtime injection via FluxCloud UI across all servers.|
|13|Human-in-the-loop on all user comms|Every message to users (WhatsApp, email, support, outreach) requires Elvio approval. Company cannot communicate with users autonomously.|
|14|Zero direct access to S2, S3, S4|Server 2 (intelligence), Server 3 (execution), Server 4 (storage/PII) — OpenFang never touches these.|
|15|Ruflo fork at Elvio11/claude-flow|Personal fork for Talvix-specific neural training, custom SPARC modes, and Talvix codebase context. Upstream ruvnet/ruflo is the source.|



**16. WHAT TALVIX AI CORP REPLACES**

|**Division**|**Human Equivalent**|**Monthly Salary Saved**|**AI Corp Cost**|
| :- | :- | :- | :- |
|Executive (3 depts)|2 people — CEO ops, strategy, chief of staff|₹2-3L|₹0 (Cerebras free)|
|Engineering (8 depts)|4 people — fullstack, security, DevOps, QA|₹4-6L|~₹100/mo (Claude for 3 eng agents)|
|Marketing (9 depts)|4 people — content, design, paid, community, SEO|₹3-4L|₹0 (Gemini/Groq free)|
|Revenue (6 depts)|3 people — sales, BD, retention, conversion|₹2.5-3.5L|₹0 (Groq free)|
|Product & Eng Ops (5 depts)|2 people — PM, QA, DevOps, security monitor|₹2-3L|~₹50/mo (Claude for 1 agent)|
|Analytics (4 depts)|2 people — data analyst, researcher, BI|₹1.5-2L|₹0 (Gemini/Groq free)|
|Customer Success (5 depts)|3 people — support, onboarding, success|₹1-1.5L|₹0 (Groq free)|
|Finance & Legal (3 depts)|1\.5 people — finance, legal, fundraising|₹1-1.5L|₹0 (Gemini free)|
|Founder Layer (3 depts)|1 EA + knowledge manager|₹80K-1.2L|₹0 (Cerebras free)|
|New Divisions (3 depts)|1 person — localization, platform, competitive|₹80K-1L|₹0 (Groq free)|
|TOTAL|~26 people|₹18-26L/month|~₹150/month|

|<p>**Honest Limitations**</p><p>What it genuinely cannot replace: A human who picks up the phone and closes a deal with a college placement officer.</p><p>What it genuinely cannot replace: Emergency engineering decisions requiring deep Talvix product codebase knowledge.</p><p>What it genuinely cannot replace: Regulatory filings (GST return, RoC compliance) — AI Corp prepares everything, CA files.</p><p>What it genuinely cannot replace: Anything requiring physical presence, legal standing, or personal relationships.</p>|
| :- |



**17. THE UPGRADE PATH**

The entire architecture is designed to start at near-zero cost and upgrade precisely where and when revenue justifies it.

|**Revenue Milestone**|**What to Upgrade**|**Cost Impact**|
| :- | :- | :- |
|Day 1 (₹0 MRR)|Run everything as designed. All free tiers. ~₹150/month total.|₹150/month|
|₹10K MRR (20 users)|Nothing changes. Still well within all free tier limits.|₹150/month|
|₹50K MRR (100 users)|Upgrade Gemini to paid Tier 1 if approaching 250 req/day limit. Buffer to paid for more channels/posts.|₹1,500-2,500/month|
|₹2L MRR (400 users)|Claude Sonnet usage increases as engineering velocity picks up. Add monitoring tooling.|₹3,000-5,000/month|
|₹5L MRR (1000 users)|Self-host open source LLM (Llama 3.3 70B or Qwen3-235B). One config line change. All Hands switch to self-hosted model. Rate limits gone forever.|Server cost ~₹15-30K/month, API costs ₹0|
|₹10L MRR|Self-hosted LLM serves BOTH Talvix product AND AI Corp. Sarvam-M still for product agents. All company agents on self-hosted.|Near-zero AI costs at scale|
|Revenue justifies hire|Hiring Intelligence Hand (Dept 38) activates from STANDBY. First human hire managed autonomously.|Human salary + reduced AI overhead|



**18. SUMMARY — TALVIX AI CORP IN ONE PAGE**

|<p>**THE COMPANY**</p><p>- Name: Talvix AI Corp</p><p>- Founder: Elvio (solo)</p><p>- Product: Talvix SaaS (₹499/month, Indian job automation)</p><p>- Departments: 50 across 11 divisions</p><p>- Human employees: 0</p><p>- Monthly AI cost: ~₹150</p><p>- Daily founder time: 15-30 minutes</p>|<p>**THE PLATFORM**</p><p>- OS: OpenFang (Rust, 32MB binary, Server 5)</p><p>- Framework: OpenFang Hands (autonomous, schedule-driven)</p><p>- Interface: @TalvixFounderBot (Telegram, Elvio only)</p><p>- Watchdog: @TalvixWatchdogBot (Server 1, independent)</p><p>- Skills: 507+ across 4 libraries</p><p>- Engineering swarms: Ruflo v3.5 (Elvio11/claude-flow)</p><p>- Data access: Talvix MCP server (Server 1 /mcp)</p>|
| :-: | :-: |
|<p>**THE FOUR LIBRARIES**</p><p>- agency-agents (31K★): WHO each Hand is — 147 personas</p><p>- antigravityskills.org (22.9K★): HOW each Hand works — 245 skills</p><p>- OpenFang built-in: WHAT tools are available — 60 native tools</p><p>- Ruflo v3.5 (20.1K★): HOW Engineering executes — 60+ swarm agents</p>|<p>**THE CONNECTIONS**</p><p>- S5→S1: GET /mcp (14 data tools, JWT protected)</p><p>- S1→S5: POST /internal/founder-notify (product events)</p><p>- S2, S3, S4: ZERO ACCESS from S5, ever</p><p>- Supabase: NEVER direct, only via S1 aggregates</p><p>- All user comms: Elvio approval required before send</p><p>- PII: Never reaches Server 5 (stripSensitive enforces)</p>|

*Talvix AI Corp v1.0  ·  March 2026  ·  Confidential — Elvio*
Talvix AI Corp Architecture v1.0  ·  All decisions finalized  ·  Page 
