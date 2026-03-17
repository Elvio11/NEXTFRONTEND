**================================================================================**
**TALVIX — FULL MCP MIGRATION AUDIT (SERVERS 1, 2, 3)**
**================================================================================**

**================================================================================**
**PART 1 — SERVER 3 AUDIT (Execution Layer - Gutting the Heavy Scripts)**
**================================================================================**

### Section 1: Browser Automation Purge (Agent 12 & 14)
- **Status:** FAIL
- **Target Files:**
  - `skills/apply_engine.py`
  - `skills/browser_pool.py`
  - `skills/custom_scraper.py`
- **Exact Code Findings:**
  - `skills/apply_engine.py`: Lines 24-27 (imports for `selenium`), Line 32 (`import undetected_chromedriver as uc`). Lines 48, 105, 194 (usage of `uc.Chrome`).
  - `skills/browser_pool.py`: Line 22 (`from selenium.webdriver.chrome.options import Options`), Lines 36, 45, 63, 70 (usage of `uc.Chrome` and `uc.ChromeOptions`).
  - `skills/custom_scraper.py`: Lines 19-21 (imports for `selenium`), Lines 236-255 (usage of `WebDriverWait` and `find_element` with CSS selectors).
- **Action Required:** Delete all Selenium/UC imports and logic blocks. Replace with `subprocess.run(["playwright-mcp", ...])` calls within the respective agent flow.

### Section 2: Scraping Engine Deletion (Agent 9)
- **Status:** OBSOLETE
- **Target Files:**
  - `agents/agent9_scraper.py`
  - `skills/jobspy_runner.py`
  - `skills/custom_scraper.py`
- **Exact Code Findings:**
  - `agents/agent9_scraper.py`: Line 40 (`from skills.jobspy_runner import run_jobspy`), Lines 185-220 (orchestration of `jobspy_task` and `jobspy_result`).
  - `skills/jobspy_runner.py`: Line 100 (`from jobspy import scrape_jobs`), Line 126 (calling `scrape_jobs`).
- **Action Required:** Remove `jobspy_runner.py` entirely. In `agent9_scraper.py`, pipe the JSON output from `Firecrawl MCP` into the `remote_filter.py` logic (already active on lines 241-270).

### Section 3: Anti-Ban & Stealth Removal (Agent 13)
- **Status:** OBSOLETE
- **Target Files:**
  - `agents/agent13_anti_ban.py`
  - `skills/anti_ban_checker.py`
- **Exact Code Findings:**
  - `agents/agent13_anti_ban.py`: Full file. Line 18 (`from skills.anti_ban_checker import check_risk`).
  - `skills/anti_ban_checker.py`: Full logic for manual risk scoring (lines 10-60).
- **Action Required:** Delete both files. Stealth and IP rotation are now outsourced to `Browserbase` proxy pools natively.

### Section 4: Email Polling & Gmail API Purge (Agent 14)
- **Status:** FAIL
- **Target Files:**
  - `agents/agent14_follow_up.py`
- **Exact Code Findings:**
  - Lines 105, 140, 159, 176, 187, 220 (Manual HTTP calls to `gmail.googleapis.com` and `oauth2.googleapis.com` with `Authorization: Bearer`).
- **Action Required:** Gut all `httpx.AsyncClient()` calls to Google APIs. Replace with `mcp-gmail` subprocess calls for searching threads and sending messages.

### Section 5: Subprocess Management Readiness
- **Status:** FAIL
- **Target Files:** N/A
- **Exact Code Findings:** No centralized `skills/mcp_runner.py` or equivalent found on Server 3.
- **Action Required:** Create `skills/mcp_runner.py` to provide a hardened `run_mcp_command()` utility using `subprocess.run(capture_output=True)`.

### Section 6: Proxy Routing Injection
- **Status:** FAIL
- **Target Files:** `skills/browser_pool.py`
- **Exact Code Findings:** Currently lacks dynamic proxy injection logic for external subprocesses.
- **Action Required:** Implement a hook to fetch `PROXY_URL` (Webshare) from Doppler environment variables and pass it as an `--env` or CLI flag to the Playwright MCP subprocess.

### Section 7: Asynchronous Blocking Risks
- **Status:** FAIL
- **Target Files:**
  - `agents/agent9_scraper.py`
  - `agents/agent12_applier.py`
- **Exact Code Findings:**
  - `agent9_scraper.py`: Lines 250, 270 (Synchronous loops over `all_jobs`).
  - `agent12_applier.py`: Line 483 (Synchronous loop over `fit_scores_result.data`).
- **Action Required:** Wrap these loops or the internal `subprocess.run` calls in `asyncio.to_thread()` to prevent blocking the FastAPI event loop during heavy I/O.

**================================================================================**
**PART 2 — SERVER 2 AUDIT (Intelligence Layer - Offloading Parsing)**
**================================================================================**

### Section 8: Document Parsing Eviction (Agent 3)
- **Status:** REQUIRES SCAFFOLD
- **Target Files:** `skills/resume_parser.py`
- **Exact Code Findings:**
  - Lines 24-25 (imports for `pypdf` and `docx`), Lines 40-63 (DOCX bomb checks), Lines 125-142 (PDF text extraction), Lines 142-155 (DOCX text extraction).
- **Action Required:** Keep Layers 1 & 2 (magic bytes/extension validation). Replace all `pypdf` and `python-docx` extraction functions (lines 125-155) with a call to `MarkItDown MCP`.

### Section 9: Real-Time Search Scaffolding (Agent 8)
- **Status:** REQUIRES SCAFFOLD
- **Target Files:** `agents/agent8_coach.py`
- **Exact Code Findings:**
  - Currently relies on static DB context and user persona (lines 70-120). No `news` or `search` tools active.
- **Action Required:** Scaffold a new task for Agent 8 to call `Tavily MCP` for latest market trends before generating the coaching message.

### Section 10: Search Caching Guardrails (`pg_cron`)
- **Status:** FAIL
- **Target Files:** `migrations/pg_cron_additions.sql` (Server 3)
- **Exact Code Findings:** No `market_trends_cache` table or caching logic found in the existing cron schedule.
- **Action Required:** Create `market_trends_cache` table. Add a `pg_cron` job to execute a daily "Global Market Trend" search at 6:30 AM IST.

### Section 11: CrewAI Tooling Interface
- **Status:** FAIL
- **Target Files:**
  - `crew/orchestrator_agent.py`
  - `crew/intelligence_crew.py`
- **Exact Code Findings:**
  - No `@tool` definitions found. Agents are currently dispatched via direct function calls (e.g., `agent6.run()`).
- **Action Required:** Refactor agent dispatch logic to use CrewAI Tool decorators that wrap the MCP subprocess calls.

### Section 12: Business Logic Preservation (The "Brain")
- **Status:** PASS
- **Target Files:**
  - `agents/agent4_skill_gap.py`
  - `agents/agent5_career.py`
  - `agents/agent6_fit.py`
  - `agents/agent15_calibrator.py`
  - `agents/agent10_tailor.py` (Server 3)
  - `agents/agent11_cover_letter.py` (Server 3)
- **Exact Code Findings:** Verified these agents rely on Sarvam-M/Gemini and internal logic (e.g., `agent15` daily/weekly calibration loops).
- **Action Required:** NO MCP execution changes needed.

**================================================================================**
**PART 3 — SERVER 1 AUDIT (Gateway - Becoming an MCP Server)**
**================================================================================**

### Section 13: The `/mcp` Endpoint Implementation
- **Status:** FAIL
- **Target Files:** `src/server.js`
- **Exact Code Findings:** No `/mcp` route found. No mention of `@modelcontextprotocol/sdk` in `package.json`.
- **Action Required:** Initialize `@modelcontextprotocol/sdk`. Register `app.use('/mcp', ...)` route in `server.js`.

### Section 14: Data Gateway Security
- **Status:** REQUIRES SCAFFOLD
- **Target Files:**
  - `src/middleware/verifyJWT.js`
  - `src/middleware/stripSensitive.js`
- **Exact Code Findings:**
  - `verifyJWT.js`: Full JWT validation logic.
  - `stripSensitive.js`: Recursively blocks `oauth_access_token` and `session_encrypted`.
- **Action Required:** Ensure the new `/mcp` route is protected by `verifyJWT` and that the output is piped through `stripSensitive` before leaving the server.

**================================================================================**
**PART 4 — INFRASTRUCTURE & SHARED CONTEXT**
**================================================================================**

### Section 15: Dependency Deflation
- **Status:** FAIL
- **Target Files:** `requirements.txt` (S2/S3), `package.json` (S1)
- **Exact Code Findings:**
  - S2: `python-docx`, `pypdf`.
  - S3: `jobspy`, `selenium`, `undetected-chromedriver`, `beautifulsoup4`.
- **Action Required:** Generate a post-migration cleanup script to `pip uninstall` these 6 heavy dependencies.

### Section 16: Dockerfile Weight Reduction
- **Status:** FAIL
- **Target Files:** `Dockerfile` (Server 3)
- **Exact Code Findings:** Lines 26-29 (`google-chrome-stable` installation).
- **Action Required:** Delete lines 26-29 to reduce image size by ~800MB.

### Section 17: MCPorter Installation Steps
- **Status:** FAIL
- **Target Files:** `Dockerfile` (S2/S3)
- **Exact Code Findings:** No `npm` or `mcporter` installation steps.
- **Action Required:** Add `RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs` followed by `RUN npm install -g @mcporter/cli`.

### Section 18: MinIO File Hand-offs
- **Status:** PASS
- **Target Files:**
  - `skills/storage_client.py` (S2/S3)
- **Exact Code Findings:** Existing `get_s3()` and `get_s3_client()` use `S4_URL` (lines 18-24). Agents already pass around object paths (e.g., `jds/{fingerprint}.txt`).
- **Action Required:** Ensure MCP tools are initialized with the same `S4_URL` and keys to allow them to fetch files directly via path strings.
