# Talvix MCP Migration Report: Decoupling Brain and Hands

**Date:** March 2026
**Author:** Lead Technical Architect
**Subject:** Strategy for migrating Server 2 and Server 3 execution layers to the Model Context Protocol (MCP).

---

## 1. The "Delete" List (Unnecessary Tools)

Based on our assessment of the `deploy-server2` and `deploy-server3` branches, the following libraries, scripts, and custom logic blocks are now obsolete and should be removed.

### Server 3 (Execution Layer)
- **Scraping Engine:**
    - `jobspy` (Library)
    - `beautifulsoup4` (Library)
    - `skills/jobspy_runner.py` (Full file)
    - `skills/custom_scraper.py` (Full file)
    - `skills/free_api_scrapers.py` (Full file)
- **Browser Automation:**
    - `selenium` & `undetected-chromedriver` (Libraries)
    - `webdriver-manager` (Library)
    - `skills/browser_pool.py` (Full file)
    - `skills/session_manager.py` (Full file)
    - `skills/apply_engine.py` (Manual Selenium logic blocks)
- **Email Operations:**
    - Manual Gmail API polling and message construction in `agents/agent14_follow_up.py` and `_send_gmail`.
- **Anti-Ban:**
    - `skills/anti_ban_checker.py` and `agents/agent13_anti_ban.py` (Logic for IP rotation and fingerprinting is now handled by MCP infrastructure).

### Server 2 (Intelligence Layer)
- **Document Parsing:**
    - `pypdf` (Library)
    - `python-docx` (Library)
    - `skills/resume_parser.py` (Extraction and sanitization logic; replaced by MCP tool calls).

---

## 2. The MCP Mapping (3 Options per Need)

For each execution capability, we have identified three publicly available MCP server options.

### A. Web Scraping & Job Discovery (Replacing JobSpy)
1.  **Firecrawl MCP Server (Official):**
    - *Reliability:* High. Best for general crawling and converting HTML to LLM-ready Markdown.
    - *Integration:* Native support for Cursor/Claude/CrewAI.
    - *Feature:* Handles site mapping and deep crawling automatically.
2.  **Bright Data Indeed/LinkedIn MCP:**
    - *Reliability:* Enterprise-grade. Highest success rates for scraping authenticated job boards.
    - *Integration:* Standardized API; requires Bright Data proxy credentials.
    - *Feature:* Specialized for job listings, company profiles, and salary data.
3.  **Browserbase MCP:**
    - *Reliability:* High. Best for "stealth" browsing on high-security job platforms.
    - *Integration:* Cloud-based browser sessions with agent-browser automation.
    - *Feature:* Automatic retries and rate limiting.

### B. Complex Browser Automation (Replacing Selenium for Auto-Apply)
1.  **Microsoft Playwright MCP:**
    - *Reliability:* Exceptional. Official Microsoft implementation.
    - *Integration:* Direct Playwright interaction via structured accessibility snapshots.
    - *Feature:* LLM-friendly navigation without needing vision models.
2.  **Browserbase Stagehand:**
    - *Reliability:* High. An "Agentic" browser wrapper.
    - *Integration:* Allows agents to interact with web pages using natural language commands.
    - *Feature:* Intelligent element detection (no more brittle CSS selectors).
3.  **MultiOn MCP:**
    - *Reliability:* High. Autonomous agent-driven browser.
    - *Integration:* Handles multi-step workflows (e.g., login -> search -> fill form -> submit) with minimal input.
    - *Feature:* Self-healing; adapts to UI changes automatically.

### C. Document Parsing (Replacing PyPDF/python-docx)
1.  **AWS Labs Document Loader:**
    - *Reliability:* High. Stable and battle-tested in AWS environments.
    - *Integration:* Native support for parsing PDF/DOCX and extracting structured content.
    - *Feature:* Directly integrates with S3/MinIO for storage-to-tool processing.
2.  **Microsoft MarkItDown MCP:**
    - *Reliability:* High. Best-in-class for preserving structural integrity (tables, lists).
    - *Integration:* Python-based; converts various formats to clean Markdown.
    - *Feature:* Excellent for resume extraction where structure is critical.
3.  **Unstructured.io MCP:**
    - *Reliability:* Medium-High. Best for messy or multi-column documents.
    - *Integration:* Specialized API for document "partitioning".
    - *Feature:* Extracts metadata and text from images/scanned PDFs.

### D. Email Operations (Replacing custom Gmail API polling)
1.  **Workato Gmail MCP:**
    - *Reliability:* Enterprise. Comprehensive toolset (search, read, draft, send).
    - *Integration:* Stable authentication flow; standard MCP tool signatures.
    - *Feature:* Advanced thread management and label organization.
2.  **LobeHub Gmail MCP:**
    - *Reliability:* High. Optimized for agentic loops.
    - *Integration:* Built for easy integration with Node/Python backends.
    - *Feature:* Simplifies complex Gmail search queries into natural language.
3.  **Postman MCP:**
    - *Reliability:* High. Versatile for any Google Workspace interaction.
    - *Integration:* Uses Postman collections to bridge LLMs to APIs.
    - *Feature:* Highly customizable for specific Talvix outreach workflows.

---

## 3. Implementation Strategy

### Phase 1: The MCP Gateway Utility
We will implement a unified `skills/mcp_gateway.py` on both Server 2 and Server 3. This utility will use the `mcp` Python SDK to manage sessions with our chosen MCP servers (e.g., Firecrawl, Playwright).

### Phase 2: Context Injection (MinIO Integration)
Instead of agents reading files from storage, they will pass the **MinIO file path** as an argument to the MCP tool. The MCP gateway will be configured with S3-compatible credentials, allowing the "Hands" (the MCP server) to fetch and process documents (like resumes) directly.

### Phase 3: Brain Preservation (The India Filter)
The "India Remote Filter" in Agent 9 will remain a **Pure Python Skill**.
- **The Flow:** Agent 9 calls **Firecrawl MCP** to get jobs -> Firecrawl returns JSON -> Agent 9 passes JSON through `skills/remote_filter.py` (untouched) -> Agent 9 decides what to save to Supabase.
- This ensures the business logic remains under our direct control while the execution is outsourced.

### Phase 4: Authentication and Session Management
For LinkedIn and Gmail, the existing `user_sessions` from Supabase will be retrieved by the Agent and passed into the MCP Tool's `environment` or `args` (e.g., injecting an `access_token`). This allows standardized MCP servers to act as authenticated users without us maintaining manual cookie injection logic.

### Phase 5: Deployment Sidecars
MCP servers will be deployed as sidecar processes (Node.js or Python) within our Docker environment, communicating with our FastAPI backends via `stdio` or internal `SSE` hubs.
