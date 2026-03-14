# Talvix: System-Wide Truth Audit Prompt (v4.0 Architecture)

**Instructions for AI Agent:**
Invoke the `agency-project-shepherd` skill to execute this audit. Do not rely on historical status logs; perform a physical, system-wide verification across all deployment branches.

---

## The Audit Mission

Perform a "Truth-Only" Full System Audit of the Talvix project against the **v4.0 Master Architecture**. Verify the physical state of all four servers and the frontend to determine launch readiness.

### CHECKLIST 1: Backend Layer (Servers 1, 2, 3)
1. **Server 1 (Gateway)**: Verify Node.js 20/Express implementation. Confirm the JWT validation layer, Baileys (WA) connection stub, and ensure the 'Vault' (AES-256 session encryption) handles the 'X-Agent-Secret' correctly.
2. **Server 2 (Intelligence)**: Audit the Python 3.11/FastAPI/CrewAI stack. Confirm that Agents 3-8 are fully migrated to the 'async def' model and use the MinIO 'storage_client'. Verify the 'fit_scorer' (Agent 6) delta-vs-full scan logic + fit reason caching.
3. **Server 3 (Execution)**: Audit the Selenium/CrewAI automation stack. Check the standardization of Selenium retry logic. Verify if Agent 12 (Auto-Apply) is physically operational for Indeed/LinkedIn with decrypted session injection.

### CHECKLIST 2: Agent Registry Reconciliation
*   Map Agents 1 through 15 to physical file paths.
*   Flag any agent that is marked "Complete" in `AGENTS.md` but is physically missing, is a shell stub, or lacks an entry point.
*   **Critical**: Confirm status of Agent 14 (Follow-Up) and Agent 15 (Calibrator).

### CHECKLIST 3: Core Architectural Constraints
*   **Doppler**: Confirm zero `.env` files and verify secret retrieval via `os.environ`.
*   **Storage**: Confirm zero direct local filesystem writes in agents; verify all use the MinIO / FluxShare storage service.
*   **LinkedIn Safety**: Verify the **Global Kill Switch** (1,500 actions/day) is correctly incrementing/blocking in the database layer.
*   **RLS/Security**: Ensure `service_role` is absent from Server 1 and that sensitive columns are stripped from all API responses.

### CHECKLIST 4: Frontend State
*   Assess the Next.js 15.5.12 monorepo alignment.
*   Verify the directory structure matches the 'restored' main branch state and that permission gates for Free vs. Paid tiers are implemented.

---

## REQUIRED OUTPUT
1. **Discrepancy Report**: A list of "Physical Code vs. Documented Status" (missing files, incorrect logic, etc.).
2. **Readiness Verdict**: A clear "Yes/No" status for proceeding to Phase 6 (Agent 14).
3. **Action Items**: A prioritized list of immediate fixes for any architectural violations found.

**Reference Docs**: `AGENTS.md`, `architecture-constraints.md`, `backend_architect.md`, `system.md`, and `walkthrough.md`.
