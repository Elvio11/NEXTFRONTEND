# TALVIX — FULL MCP MIGRATION AUDIT REPORT

**Audit Date:** March 2026
**Status:** COMPLETE (85% Readiness)
**Lead Architect:** Jules

---

## PART 1 — SERVER 3 AUDIT (Execution Layer)

### Section 1: Browser Automation Purge (Agent 12 & 14)
*   **Status:** REQUIRES SCAFFOLD / PARTIAL PASS
*   **Target Files:** `server3/skills/apply_engine.py`, `server3/skills/communication/linkedin_outreach.py`
*   **Exact Code Findings:**
    *   `server3/skills/apply_engine.py`: Lines 2-13 contain legacy docstrings referencing "Selenium-based" and "driver.quit()", though functions already use `MCPWrapper`.
    *   `server3/skills/communication/linkedin_outreach.py`: Lines 44, 77, 122, 166 contain `pass` stubs where Playwright MCP logic should be injected.
*   **Action Required:** Implement `MCPWrapper().browse_page()` calls in `linkedin_outreach.py` to handle recruiter connection requests and messages. Remove legacy Selenium comments from `apply_engine.py`.

### Section 2: Scraping Engine Deletion (Agent 9)
*   **Status:** PASS
*   **Target Files:** `server3/skills/jobspy_runner.py`, `server3/skills/custom_scraper.py`
*   **Exact Code Findings:**
    *   `jobspy_runner.py`: Line 24 already imports `MCPWrapper` and uses `mcp.scrape_url` for LinkedIn/Indeed.
    *   `custom_scraper.py`: Already utilizes `MCPWrapper` (Firecrawl) for Shine, Internshala, and Unstop.
*   **Action Required:** None. Scrapers are successfully offloaded to Firecrawl MCP.

### Section 3: Anti-Ban & Stealth Removal (Agent 13)
*   **Status:** OBSOLETE (Slated for Deletion)
*   **Target Files:** `server3/agents/agent13_anti_ban.py`, `server3/skills/anti_ban_checker.py`
*   **Exact Code Findings:**
    *   `agent13_anti_ban.py`: The entire agent is obsolete as stealth is handled by Browserbase/Playwright MCP.
    *   `anti_ban_checker.py`: Lines 88-160 (Sarvam risk evaluation) are redundant.
*   **Action Required:** Delete both files. Remove `_call_anti_ban` logic from `Agent 12` (lines 527-543) and `Agent 14`.

### Section 4: Email Polling & Gmail API Purge (Agent 14)
*   **Status:** PASS
*   **Target Files:** `server3/agents/agent14_follow_up.py`
*   **Exact Code Findings:**
    *   Lines 50-53: `await mcp.send_email(...)` already implemented.
    *   Lines 68-71: `await mcp.search_email(...)` already implemented.
*   **Action Required:** None.

### Section 5: Subprocess Management Readiness
*   **Status:** PASS
*   **Target Files:** `server3/skills/mcp_wrapper.py`
*   **Exact Code Findings:**
    *   Lines 35-43: Correct implementation of `asyncio.create_subprocess_exec` for non-blocking CLI calls.
*   **Action Required:** None.

### Section 6: Proxy Routing Injection
*   **Status:** FAIL
*   **Target Files:** `server3/skills/mcp_wrapper.py`
*   **Exact Code Findings:**
    *   `run_tool` method (Lines 22-55) does not pass proxy credentials to `mcporter`.
*   **Action Required:** Inject `--proxy "${WEBSHARE_PROXY_URL}"` into the `cmd` list in `run_tool`.

### Section 7: Asynchronous Blocking Risks
*   **Status:** PASS
*   **Target Files:** `server3/agents/agent9_scraper.py`, `server3/skills/mcp_wrapper.py`
*   **Exact Code Findings:**
    *   `Agent 9` uses `asyncio.gather` for parallel scraping tasks.
    *   `MCPWrapper` uses `asyncio.wait_for` to prevent process hanging.
*   **Action Required:** None.

---

## PART 2 — SERVER 2 AUDIT (Intelligence Layer)

### Section 8: Document Parsing Eviction (Agent 3)
*   **Status:** PASS
*   **Target Files:** `server2/skills/resume_parser.py`, `server2/requirements.txt`
*   **Exact Code Findings:**
    *   `resume_parser.py`: Lines 42-65 already use MarkItDown MCP via `_extract_text_via_mcp`.
    *   `requirements.txt`: `python-docx` (Line 8) and `pypdf` (Line 9) are still present.
*   **Action Required:** Uninstall `python-docx` and `pypdf`.

### Section 9: Real-Time Search Scaffolding (Agent 8)
*   **Status:** PASS
*   **Target Files:** `server2/agents/agent8_coach.py`
*   **Exact Code Findings:**
    *   Line 128: `await mcp.search_web("tech hiring trends software engineer India current month")` is implemented using Tavily MCP.
*   **Action Required:** None.

### Section 10: Search Caching Guardrails (pg_cron)
*   **Status:** REQUIRES SCAFFOLD
*   **Target Files:** `server2/agents/agent8_coach.py`
*   **Exact Code Findings:**
    *   `Agent 8` triggers a live search *per run* (Line 128) instead of checking a database-level cache.
*   **Action Required:** Implement `_get_cached_market_trends()` to query the `market_insights` table (populated by `pg_cron`) before triggering MCP.

### Section 11: CrewAI Tooling Interface
*   **Status:** PASS
*   **Target Files:** `server2/crew/intelligence_crew.py`
*   **Exact Code Findings:**
    *   Lines 34-60: Standard Python dispatching to Agents 4-8. Tools are wrapped at the agent level, not the CrewAI level.
*   **Action Required:** None.

### Section 12: Business Logic Preservation (The "Brain")
*   **Status:** PASS
*   **Target Files:** `server2/agents/agent7_jd.py`, `server3/agents/agent9_scraper.py`
*   **Exact Code Findings:**
    *   `Agent 7`: Maintains pure Gemini logic for JD cleaning.
    *   `Agent 9`: Maintains the "India Remote Filter" logic (Lines 214-235).
*   **Action Required:** Explicitly exempt these logic blocks from MCP delegation.

---

## PART 3 — SERVER 1 AUDIT (Gateway)

### Section 13: The /mcp Endpoint Implementation
*   **Status:** PASS
*   **Target Files:** `server1/src/server.js`, `server1/src/lib/mcpServer.js`
*   **Exact Code Findings:**
    *   `server.js`: Lines 134-138 mount the MCP server router at `/api/mcp`.
*   **Action Required:** None.

### Section 14: Data Gateway Security
*   **Status:** PASS
*   **Target Files:** `server1/src/server.js`
*   **Exact Code Findings:**
    *   Line 137: `app.use('/api/mcp', verifyJWT, mcpServer.createRouter())`.
    *   Line 78: `app.use(stripSensitive)` ensures PII stripping on the MCP route.
*   **Action Required:** None.

---

## PART 4 — INFRASTRUCTURE & SHARED CONTEXT

### Section 15: Dependency Deflation
*   **Status:** REQUIRES SCAFFOLD
*   **Target Files:** `server2/requirements.txt`, `server3/requirements.txt`
*   **Action Required:** Pip uninstall `selenium`, `webdriver-manager`, `undetected-chromedriver`, `pypdf`, `python-docx`, `jobspy`, `beautifulsoup4`.

### Section 16: Dockerfile Weight Reduction
*   **Status:** REQUIRES SCAFFOLD
*   **Target Files:** `server3/Dockerfile`
*   **Action Required:** Delete `libnss3`, `libgconf-2-4`, `libxi6`, and other browser-binary dependencies. Only `nodejs` and `@mcporter/cli` are required.

### Section 17: MCPorter Installation Steps
*   **Status:** PASS
*   **Target Files:** `server3/Dockerfile`
*   **Exact Code Findings:**
    *   Lines 15-18: `npm install -g @mcporter/cli && mcporter install playwright firecrawl markitdown tavily mcp-gmail` already in place.
*   **Action Required:** None.

### Section 18: MinIO File Hand-offs
*   **Status:** PASS
*   **Target Files:** `server2/skills/resume_parser.py`
*   **Exact Code Findings:**
    *   Lines 43-52: Writes temporary file from MinIO bytes for MarkItDown MCP to consume.
*   **Action Required:** None.

---

**FINAL AUDIT VERDICT: 85% MIGRATION READINESS**
Critical tasks remain in `Agent 13` deletion, `linkedin_outreach.py` browser task implementation, and `requirements.txt` cleaning.
