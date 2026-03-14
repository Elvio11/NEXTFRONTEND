# TALVIX — STORAGE ARCHITECTURE MIGRATION PROMPT v4.0

This document serves as the master prompt for the Talvix Storage Migration. It integrates the original migration requirements with the specialized team of agents and skills assigned to the task.

## 1. Migration Team (Tagged)

The following specialized team will handle this migration:

| Role | Entity | Responsibility |
| :--- | :--- | :--- |
| **Lead Architect** | @backend_architect | Design the multi-bucket client and API contracts. |
| **Lead Engineer** | @backend_engineer | Implement code changes across all servers (Node/Python). |
| **QA/Audit** | @qa_debugger | Perform the "Zero Local Path" audit and security checks. |
| **DevOps** | @agency-devops-automator | Verify FluxCloud connectivity to S4 MinIO (Port 9000). |
| **Code Governance**| @agency-code-reviewer | Enforce Rule C7: NO local `/storage/` or direct `boto3`. |
| **Orchestrator** | @agency-project-shepherd | Coordinate the 8-step migration workflow. |
| **Contract Audit** | @agency-api-tester | Validate presigned URL and cleanup API endpoints. |

## 2. MinIO S4 Configuration (LIVE)

**Bucket Mapping:**
- `talvix-resumes`: Parsed resume JSON
- `talvix-jds`: Raw JD text files
- `talvix-skill-gaps`: Skill gap reports
- `talvix-career-intel`: Career intelligence reports
- `talvix-tailored`: Tailored resume PDF
- `talvix-cover-letters`: Cover letter text files
- `talvix-calibration`: Calibration reports
- `talvix-screenshots`: Selenium failure screenshots
- `talvix-model-data`: Model weights JSON

**Infrastructure Facts:**
- **Endpoint**: Port 9000 (MinIO API) via FluxCloud URL.
- **Console**: Port 9001 (Web UI) via FluxCloud URL.
- **Access**: Key/Secret provided via FluxCloud Environment Variables.

## 3. Migration Instructions

### Core Requirement
Replace every local filesystem path (`/storage/...`) with calls to the centralized `storage_client`.

### The Client Wrapper (`storage_client.py` / `storageClient.js`)
- Must handle multiple buckets as provided above.
- Must use `asyncio.gather()` for concurrent MinIO operations.
- Must provide convenience helpers (`put_json_gz`, `get_text`, `presigned_url`).
- **FORBIDDEN**: `open()` for persistent storage, direct `boto3` in agents.

### Server-Specific Tasks
- **Server 1 (Node.js)**: Implement `lib/storageClient.js` using `@aws-sdk/client-s3`. add routes for presigned URLs.
- **Server 2/3 (Python)**: Implement `skills/storage_client.py` using `boto3`. Migrate all agents (3, 4, 5, 6, 7, 9, 10, 11, 12, 15).
- **pg_cron**: Update cleanup jobs to call Server 2 cleanup endpoints instead of local filesystem deletes.

## 4. Constraint C7 (Updated)
**STORAGE VIA MINIO ONLY**
All file reads and writes must use the respective storage client wrappers exclusively. No local storage paths or direct S3 SDK imports are allowed in application logic. DB columns must store MinIO keys, not full URLs.

---
**Run Order**: `backend_architect` (Design) → `backend_engineer` (Wrapper) → `backend_engineer` (Migrate) → `qa_debugger` (Audit).
