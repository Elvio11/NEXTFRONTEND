# Talvix MCP Migration & Performance Report: Decoupling Brain and Hands

**Date:** March 2026
**Author:** Lead Technical Architect
**Subject:** Full architectural pivot to move the execution layer ("Hands") to MCP.

---

## 1. The "Delete & Deflate" List (Compute Optimization)

To save compute and RAM on our FluxCloud servers, we are removing all "heavy" execution libraries and manual browser-management code.

### Tools for Deletion:
- **`undetected-chromedriver` & `selenium`:** Saves **~1.2GB of RAM per concurrent session**. Eliminates the need for local Chrome binaries and complex headless setup.
- **`pypdf` & `python-docx`:** Prevents CPU spikes caused by local document parsing. Moving to specialized, Go/Rust-backed MCP servers offloads these heavy-duty extraction tasks.
- **`jobspy` & `beautifulsoup4`:** Removes the maintenance overhead of local scrapers and their dependence on brittle DOM selectors.

---

## 2. Agent-by-Agent Reassessment (Servers 1, 2, and 3)

| Agent | Name | Category | Current State (Legacy) | New MCP State (Tool) | Performance Impact (Speed/Reliability/Compute) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **3** | **Resume Parser** | **Hands** | Local `pypdf`/`docx` | **MarkItDown MCP** | **Compute:** Offloads text extraction from Python to a structural-aware Go/Rust parser. |
| **4** | **Skill Gap** | **Brain** | Sarvam-M | **No MCP** | Pure logic. |
| **5** | **Career Planner** | **Brain** | Sarvam-M | **No MCP** | Pure logic. |
| **6** | **Fit Scorer** | **Brain** | Sarvam-M | **No MCP** | Pure logic. |
| **7** | **JD Cleaner** | **Hands** | Gemini Flash | **Firecrawl / MarkItDown** | **Reliability:** Firecrawl handles messy JD structures better than local Regex. |
| **8** | **Guru (Coach)** | **Hands+Brain** | LLM-only | **Tavily / Brave Search** | **Speed:** Real-time news access; **Reliability:** Live search for latest market trends. |
| **9** | **Scraper** | **Hands** | JobSpy | **Firecrawl / Bright Data** | **Reliability:** Bypasses anti-bot at the source; no local IP blocking. |
| **10** | **Tailor** | **Brain** | Sarvam-M Think | **No MCP** | Pure logic. |
| **11** | **Cover Letter** | **Brain** | Gemini Flash | **No MCP** | Pure logic. |
| **12** | **Auto-Applier** | **Hands** | Selenium | **Browserbase / Playwright** | **Reliability:** Self-healing selectors; **Compute:** subprocess vs. 1GB RAM browser. |
| **13** | **Anti-Ban** | **DELETED** | Custom Python | **Natively in MCP** | **Reliability:** IP rotation handled natively by Premium MCP proxy pools. |
| **14** | **Follow-up** | **Hands** | Gmail API (Manual) | **mcp-gmail / Workato** | **Speed:** API-level vs. manual polling; Better thread management. |
| **15** | **Calibrator** | **Brain** | Pure Python | **No MCP** | Pure logic. |

### Note on Agent 8 (Guru): Caching Guardrails
To prevent API token exhaustion during peak hours (7 AM PST), Agent 8 will use **pg_cron caching**:
1.  **Scheduled Fetch:** `pg_cron` triggers a global search for "Software Engineering Market Trends India" daily at 6:30 AM.
2.  **Cache-First Logic:** Agent 8 first queries the `market_trends_cache` table before calling the Search MCP tool.
3.  **Live Fallback:** A live search is only triggered if the cache is older than 12 hours or the user query is highly specific (e.g., recent news for a niche company).

---

## 3. The MCP Mapping (3 Options per Need)

| Capability | Option 1 (Standard) | Option 2 (Managed) | Option 3 (Specialized) | Comparison |
| :--- | :--- | :--- | :--- | :--- |
| **Web Scraping & Discovery** | **Firecrawl MCP** | **Bright Data MCP** | **Browserbase MCP** | **Firecrawl** is best for general crawling; **Bright Data** is enterprise-ready for Indeed/LinkedIn success; **Browserbase** excels in stealth. |
| **Browser Automation & Forms** | **Playwright MCP** | **Browserbase Stagehand** | **MultiOn MCP** | **Playwright** is official/stable; **Stagehand** provides agentic (NL) interaction; **MultiOn** is fully autonomous. |
| **Document Parsing** | **AWS Labs Doc Loader** | **MarkItDown MCP** | **Unstructured.io MCP** | **AWS** is highly reliable for S3/MinIO; **MarkItDown** preserves complex structure; **Unstructured.io** handles multi-column layouts. |
| **Email Operations** | **Workato Gmail MCP** | **LobeHub Gmail MCP** | **Postman MCP** | **Workato** is enterprise-grade; **LobeHub** is LLM-optimized; **Postman** is versatile for any API interaction. |

*Comparison Criteria: Reliability (Uptime/Success rate), Ease of Integration (Standardized tool signatures), and Feature Completeness (Auth, stealth, structuring).*

---

## 4. The Reliability & Stealth Architecture

Moving Agent 12 and 14 to **Browserbase** or **Playwright MCP** increases reliability:
- **Stealth:** Native spoofing of WebGL, canvas, and mouse movements.
- **IP Safety:** All actions originate from Browserbase's residential proxy pool, keeping our Server 3 static IP clean.
- **Reliability:** No more brittle CSS maintenance; MCP tools use accessibility snapshots or agentic vision to find elements.

---

## 5. Implementation Strategy via MCPorter & MinIO

### Phase 1: Context Flow (MinIO to MCP)
For tasks like document parsing (Agent 3) or resume tailoring (Agent 10), the agent will pass the **MinIO object path** to the MCP tool. The `mcp_gateway.py` utility will ensure the MCP tool (like `awslabs-document-loader`) has the necessary S4 credentials to fetch and extract the document directly, avoiding heavy file passing in memory.

### Phase 2: Generating CLIs
We will use `mcporter generate-cli --server-config path/to/mcp_config.json` to create standalone binaries for our MCP tools.

### Phase 3: Lean Subprocess Interaction
Our Python FastAPI backends will call these CLIs via the `subprocess` module.
- **Speed:** Zero-latency tool invocation.
- **Compute:** Only the specific MCP tool's lightweight subprocess occupies RAM during execution, rather than maintaining a persistent browser session in Python.
- **Logic:** Allows the "Brain" to remain purely logic-focused while delegating the "Hands" work via clean, stateless shell commands.
