# TALVIX — STORAGE MIGRATION IMPLEMENTATION PLAN

**Document Version**: 1.0  
**Based On**: STORAGE_MIGRATION_v4_PROMPT.md, ORIGINAL_MIGRATION_PLAN.md  
**Created**: 2026-03-13  
**Status**: READY FOR EXECUTION  

---

## EXECUTIVE SUMMARY

Migrate Talvix from local `/storage/` filesystem to MinIO S4 object storage. This is a **breaking change** affecting all 3 servers and 11+ agents.

**Constraint C7**: All file I/O MUST use `storage_client` (Python) / `storageClient.js` (Node). No direct `boto3`, no `open()` for persistent storage.

---

## PART 0 — SPECIALIZED AGENT EXECUTION ORDER

The migration will be executed using OpenCode's specialized agents in the following order:

### Phase 0: Pre-Migration Validation
1. **@agency-devops-automator** — Verify S4 MinIO connectivity from all servers, bucket existence, credentials validation

### Phase 1: Design & Core Infrastructure
2. **@backend_architect** — Design storage_client API contract (function signatures, async patterns, error handling)
3. **@backend_engineer** — Implement `storage_client.py` for S2/S3 and `storageClient.js` for S1

### Phase 2: Server 2 Migration (S2)
4. **@backend_engineer** — Migrate S2 components in dependency order:
   - Agent 3 (writes parsed resume)
   - Skill: `skill_gap_analyzer.py` (writes skill gaps)
   - Agent 4 (reads parsed resume)
   - Agent 5 (reads parsed resume, writes career intel)
   - Agent 6 (reads parsed resume + model weights)
   - Agent 7 (reads JD text files)
   - Update `orchestrator/gates.py` (replace `/storage/` check with MinIO health)

### Phase 3: Server 3 Migration (S3)
5. **@backend_engineer** — Migrate S3 components:
   - Skill: `resume_tailor.py` (convert DOCX → PDF, use storage_client)
   - Skill: `cover_letter_writer.py` (use storage_client)
   - Skill: `apply_engine.py` (screenshots via storage_client)
   - Agent 9 (writes JD text files)
   - Update `tests/test_session_security.py` (screenshot path assertion)

### Phase 4: Server 1 Integration (S1)
6. **@backend_engineer** — Create presigned URL endpoints in S1 routes

### Phase 5: Cleanup System
7. **@backend_engineer** — Create S2 cleanup router (`routers/cleanup.py`) with 4 endpoints
8. **@backend_engineer** — Update pg_cron SQL to call S2 cleanup endpoints

### Phase 6: Test Updates
9. **@backend_engineer** — Update all test files that reference `/storage/` to mock storage_client

### Phase 7: Verification & QA
10. **@qa_debugger** — Grep audit: zero `/storage/`, zero `os.makedirs`, zero `pathlib` in agent/skill code
11. **@qa_debugger** — Verify MinIO health check integration in orchestrator
12. **@agency-api-tester** — Contract validation: presigned URL and cleanup endpoints

### Phase 8: Final Review
13. **@agency-code-reviewer** — C7 compliance review (no direct boto3, no local paths)
14. **@agency-project-shepherd** — Final migration report, update AGENTS.md, mark agents complete

**Rationale**: Storage client first (all migrations depend on it). Server 2 before Server 3 (Agent 3 is source of parsed resumes). Skills before agents (agents call I/O skills). Cleanup after core migration. Tests last. QA at end for final verification.

---

## PART 1 — SCOPING ANALYSIS

### 1.1 Current State (Branch: main)

All servers currently use local filesystem at `/storage/` which is **broken** because each FluxCloud server has isolated storage. Cross-server file reads fail.

**Total /storage/ references found**: 235+ across codebase

### 1.2 Files Requiring Migration

#### Server 2 (branch-server2) — Python

**Agent Files:**
1. `agents/agent3_resume.py` — writes parsed resume (gzipped JSON)
2. `agents/agent4_skill_gap.py` — reads parsed resume
3. `agents/agent5_career.py` — reads parsed resume, writes career intel (gzipped JSON)
4. `agents/agent6_fit.py` — reads parsed resume, reads model weights (JSON)
5. `agents/agent7_jd.py` — reads JD text files

**Skill Files (perform file I/O):**
6. `skills/skill_gap_analyzer.py` — writes skill gaps (gzipped JSON)
7. `skills/resume_parser.py` — does NOT write files (just parsing) ✓
8. `skills/career_scorer.py` — does NOT write files ✓
9. `skills/jd_cleaner.py` — does NOT write files ✓

**Other:**
10. `orchestrator/gates.py` — checks `/storage/` exists (line 295-298), keep check but change to MinIO health check (see Part 5)
11. `flow/career_planner.py` — sets `file_path = "/storage/uploads/..."` (line 37). Need to trace this flow; likely should be removed or updated.
12. `tests/*.py` — all test files that use `/storage/` paths need updates

#### Server 3 (branch-server3) — Python

**Agent Files:**
1. `agents/agent9_scraper.py` — writes JD text files
2. `agents/agent10_tailor.py` — reads parsed resume, but does NOT write itself (skill handles writing)
3. `agents/agent11_cover_letter.py` — reads parsed resume, but does NOT write itself (skill handles writing)
4. `agents/agent12_applier.py` — does NOT write screenshots directly (apply_engine handles it)

**Skill Files (perform file I/O):**
5. `skills/resume_tailor.py` — **CRITICAL**: writes tailored `.docx` but plan requires `.pdf`. **NEEDS FORMAT CHANGE** + path correction (currently `tailored-resumes/`, should be `tailored/`)
6. `skills/cover_letter_writer.py` — writes cover letter (txt)
7. `skills/apply_engine.py` — writes screenshots (PNG)

**Other:**
8. `tests/test_session_security.py` — asserts `/storage/screenshots/` in code (line 106-107), need to update assertion to check MinIO key pattern instead

#### Server 1 (branch-server1) — Node.js

1. Create `src/lib/storageClient.js` — MinIO presigned URL generator
2. Update dashboard routes (likely `src/routes/dashboard.js` or `applications.js`) to return presigned URLs instead of file paths
3. Add environment variables to deployment config: `S4_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

---

## PART 2 — IMPLEMENTATION SEQUENCE

### Phase 0: Prerequisites (S4 MinIO Server)

**SEE SEPARATE S4 SETUP GUIDE** — Must be completed BEFORE any agent migration:
- Create `branch-server4` with Dockerfile
- Deploy MinIO on FluxCloud (port 9000 API, 9001 Console)
- Create bucket `talvix`
- Set env vars on S2, S3, S1: `S4_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

---

### Phase 1: Create Storage Client Wrappers

#### 1.1 Server 2 & 3: `skills/storage_client.py`

**File**: `branch-server2/skills/storage_client.py`  
**File**: `branch-server3/skills/storage_client.py` (identical copy)

Copy exact implementation from ORIGINAL_MIGRATION_PLAN.md lines 192-318.

Key features:
- Lazy singleton `get_s3()` using `boto3`
- Async operations: `put`, `get`, `delete`, `exists`, `list_keys`
- Presigned URL generator
- Convenience helpers: `put_json_gz`, `get_json_gz`, `put_text`, `get_text`, `put_bytes`, `get_bytes`

**No modifications** — use verbatim from plan.

---

#### 1.2 Server 1: `src/lib/storageClient.js`

**File**: `branch-server1/src/lib/storageClient.js`

Copy exact implementation from ORIGINAL_MIGRATION_PLAN.md lines 540-570.

Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

**Install first**:
```bash
cd branch-server1
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

### Phase 2: Migrate Server 2 Agents & Skills

**Order matters** — migrate in dependency order (resume → skill_gap → career → fit → jd_clean).

#### Step 2.1: Agent 3 (Resume Intelligence)

**File**: `branch-server2/agents/agent3_resume.py`

**Changes**:
1. Add import: `from skills.storage_client import put_json_gz`
2. Replace line 110:  
   OLD: `"storage_path": f"/storage/parsed-resumes/{user_id}.json.gz",`  
   NEW: `"storage_path": f"parsed-resumes/{user_id}.json.gz",`
3. **Where to write file**: After line 87 (after resumes table upsert), add:  
   ```python
   await put_json_gz(f"parsed-resumes/{user_id}.json.gz", parsed)
   ```
4. Remove any reference to local paths. Only store MinIO key (without leading slash).

**Note**: The resume `parsed` dict is already available from `parse_resume()` call.

---

#### Step 2.2: Skill — skill_gap_analyzer.py

**File**: `branch-server2/skills/skill_gap_analyzer.py`

**Changes**:
1. Add import: `from skills.storage_client import put_json_gz`
2. Remove: `import os` (no longer needed)
3. Remove line 22: `STORAGE_PATH = "/storage/skill-gaps"`  
   Replace with: `STORAGE_PATH = "skill-gaps"` (just the prefix)
4. Replace lines 124-127:  
   ```python
   # OLD:
   os.makedirs(STORAGE_PATH, exist_ok=True)
   out_path = f"{STORAGE_PATH}/{user_id}.json.gz"
   with gzip.open(out_path, "wt", encoding="utf-8") as f:
       json.dump({"user_id": user_id, "full_gaps": full_gaps}, f)
   
   # NEW:
   await put_json_gz(f"{STORAGE_PATH}/{user_id}.json.gz", {"user_id": user_id, "full_gaps": full_gaps})
   ```
5. Remove: `import os` from top if no longer used elsewhere.

---

#### Step 2.3: Agent 4 (Skill Gap)

**File**: `branch-server2/agents/agent4_skill_gap.py`

**Changes**:
1. Add import: `from skills.storage_client import get_json_gz`
2. Replace lines 34-41 (loading resume):  
   ```python
   # OLD:
   resume_path = f"/storage/parsed-resumes/{user_id}.json.gz"
   try:
       with gzip.open(resume_path, "rt", encoding="utf-8") as f:
           parsed = json.load(f)
   
   # NEW:
   try:
       parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
   ```
3. Remove: `import json` and `import gzip` (no longer needed here)

---

#### Step 2.4: Agent 5 (Career Intel)

**File**: `branch-server2/agents/agent5_career.py`

**Changes**:
1. Add import: `from skills.storage_client import get_json_gz, put_json_gz`
2. Replace lines 33-40 (load resume):  
   ```python
   # OLD:
   resume_path = f"/storage/parsed-resumes/{user_id}.json.gz"
   try:
       with gzip.open(resume_path, "rt", encoding="utf-8") as f:
           parsed = json.load(f)
   
   # NEW:
   try:
       parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
   ```
3. Replace lines 72-74 (write career intel):  
   ```python
   # OLD:
   os.makedirs("/storage/career-intel", exist_ok=True)
   with gzip.open(f"/storage/career-intel/{user_id}.json.gz", "wt", encoding="utf-8") as f:
       json.dump({"user_id": user_id, **result}, f)
   
   # NEW:
   await put_json_gz(f"career-intel/{user_id}.json.gz", {"user_id": user_id, **result})
   ```
4. Remove: `import os`, `import gzip` (if not used elsewhere)

---

#### Step 2.5: Agent 6 (Fit Scorer)

**File**: `branch-server2/agents/agent6_fit.py`

**Changes**:
1. Add import: `from skills.storage_client import get_json_gz, get_text`
2. Replace `_score_single_user` lines 38-43 (load resume):  
   ```python
   # OLD:
   resume_path = f"/storage/parsed-resumes/{user_id}.json.gz"
   with gzip.open(resume_path, "rt", encoding="utf-8") as f:
       parsed = json.load(f)
   
   # NEW:
   parsed = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
   ```
3. Replace lines 413-414 (load model weights):  
   ```python
   # OLD:
   weights_json = await get_text("model-data/weights_current.json")
   weights = json.loads(weights_json)
   
   # NEW:
   weights_text = await get_text("model-data/weights_current.json")
   weights = json.loads(weights_text)
   ```
4. For full_scan mode concurrent reads (lines 418-424), change:  
   ```python
   # OLD:
   resumes = await asyncio.gather(*[
       get_json_gz(f"/storage/parsed-resumes/{uid}.json.gz") for uid in user_ids
   ], return_exceptions=True)
   
   # NEW:
   resumes = await asyncio.gather(*[
       get_json_gz(f"parsed-resumes/{uid}.json.gz") for uid in user_ids
   ], return_exceptions=True)
   ```
5. Remove: `import gzip`, `import json` from agent file (keep in skills if needed)

---

#### Step 2.6: Agent 7 (JD Cleaner)

**File**: `branch-server2/agents/agent7_jd.py`

**Changes**:
1. Add import: `from skills.storage_client import get_text`
2. Replace lines 53-66 (load JD):  
   ```python
   # OLD:
   jd_path = f"/storage/jds/{fingerprint}.txt"
   try:
       with open(jd_path, "r", encoding="utf-8", errors="ignore") as f:
           raw_jd = f.read()
   
   # NEW:
   try:
       raw_jd = await get_text(f"jds/{fingerprint}.txt")
   ```
3. For batch cleaning (lines 435-441), change:  
   ```python
   # OLD:
   jd_texts = await asyncio.gather(*[
       get_text(f"/storage/jds/{fp}.txt") for fp in fingerprints
   ], return_exceptions=True)
   
   # NEW:
   jd_texts = await asyncio.gather(*[
       get_text(f"jds/{fp}.txt") for fp in fingerprints
   ], return_exceptions=True)
   ```
4. Remove: `import os` if no longer needed

---

#### Step 2.7: Agent 15 (Calibrator) — Future

When Agent 15 is built, it must use `storage_client` from day one. Document this in code comments as template.

---

### Phase 3: Migrate Server 3 Agents & Skills

#### Step 3.1: Skill — resume_tailor.py (PDF CONVERSION)

**File**: `branch-server3/skills/resume_tailor.py`

**MAJOR CHANGES**:
1. Change output format from DOCX to PDF
2. Fix path from `tailored-resumes/` → `tailored/`
3. Replace all file I/O with `storage_client`

**Detailed steps**:

1. Add imports:
   ```python
   from skills.storage_client import get_json_gz, put_bytes
   from io import BytesIO
   ```

2. Replace `_resume_path()` (line 29-30):  
   ```python
   def _resume_path(user_id: str) -> str:
       return f"parsed-resumes/{user_id}.json.gz"  # remove leading slash
   ```

3. Replace `_tailored_path()` (line 32-33):  
   ```python
   def _tailored_path(user_id: str, job_id: str) -> str:
       return f"tailored/{user_id}/{job_id}.pdf"  # PDF, not DOCX; no leading slash
   ```

4. Replace `_load_parsed_resume()` (lines 38-44):  
   ```python
   async def _load_parsed_resume(user_id: str) -> dict:
       return await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
   ```
   (remove `os.path.exists` check — `get_json_gz` raises FileNotFoundError)

5. **Convert DOCX → PDF**: Replace `_build_docx()` and docx save logic (lines 208-213) with PDF generation using ReportLab or WeasyPrint.  
   **Simplest approach**: Use ReportLab to generate PDF from scratch (don't try to convert DOCX).  
   Implement new `_build_pdf(tailored: dict) -> bytes` function.

   Example ReportLab:
   ```python
   from reportlab.pdfgen import canvas
   from io import BytesIO
   
   def _build_pdf(tailored: dict) -> bytes:
       buffer = BytesIO()
       c = canvas.Canvas(buffer)
       # Add content from tailored dict (name, sections, bullets)
       # Use simple text layout; maximum page 1
       c.save()
       return buffer.getvalue()
   ```

6. Replace writing logic (lines 209-213):
   ```python
   # OLD:
   output_path = _tailored_path(user_id, job_id)
   Path(output_path).parent.mkdir(parents=True, exist_ok=True)
   doc = _build_docx(tailored)
   doc.save(output_path)
   return output_path
   
   # NEW:
   pdf_bytes = _build_pdf(tailored)
   output_path = _tailored_path(user_id, job_id)
   await put_bytes(output_path, pdf_bytes)
   return output_path
   ```

7. Remove imports: `from pathlib import Path`, `from docx import Document` (no longer using python-docx)
8. Add import: `from reportlab.pdfgen import canvas` (install `reportlab` if not in requirements)

---

#### Step 3.2: Skill — cover_letter_writer.py

**File**: `branch-server3/skills/cover_letter_writer.py`

**Changes**:
1. Add import: `from skills.storage_client import get_json_gz, put_text`
2. Replace `_resume_path()`: remove leading slash
3. Replace `_load_parsed_resume()` (lines 35-41) with:  
   ```python
   async def _load_parsed_resume(user_id: str) -> dict:
       return await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
   ```
4. Replace `_cover_letter_path()`: remove leading slash (keep same pattern)
5. Replace `write_cover_letter()` write logic (lines 120-124):  
   ```python
   # OLD:
   output_path = _cover_letter_path(user_id, job_id)
   Path(output_path).parent.mkdir(parents=True, exist_ok=True)
   with open(output_path, "w", encoding="utf-8") as f:
       f.write(letter.strip())
   return output_path
   
   # NEW:
   output_path = _cover_letter_path(user_id, job_id)
   await put_text(output_path, letter.strip())
   return output_path
   ```
6. Remove: `import os`, `from pathlib import Path`

---

#### Step 3.3: Skill — apply_engine.py (screenshots)

**File**: `branch-server3/skills/apply_engine.py`

**Changes**:
1. Add import: `from skills.storage_client import put_bytes`
2. Replace `_save_screenshot()` (lines 47-56):
   ```python
   async def _save_screenshot(driver: uc.Chrome, run_id: str, job_id: str) -> Optional[str]:
       try:
           path = f"screenshots/{run_id}/{job_id}.png"
           screenshot_bytes = driver.get_screenshot_as_png()
           await put_bytes(path, screenshot_bytes)
           return path
       except Exception as exc:
           print(f"[apply_engine] screenshot failed: {exc}")
           return None
   ```
3. Remove: `from pathlib import Path`, `import os`

---

#### Step 3.4: Agent 9 (Job Scraper)

**File**: `branch-server3/agents/agent9_scraper.py`

**Changes**:
1. Add import: `from skills.storage_client import put_text`
2. Replace `_write_jd_to_storage()` (lines 39-44):
   ```python
   async def _write_jd_to_storage(fingerprint: str, jd_text: str) -> None:
       await put_text(f"jds/{fingerprint}.txt", jd_text)
   ```
   (Note: no need to create directory — MinIO is flat)
3. Update line 94 call remains same.
4. Remove: `from pathlib import Path`, `import os`
5. For concurrent writes (lines 475-478), already using `asyncio.gather` — ensure `put_text` is async (it is).

---

#### Step 3.5: Agent 10 (Resume Tailor) — already covered by skill changes

**File**: `branch-server3/agents/agent10_tailor.py`  
**No file I/O changes needed** — it only calls `tailor_resume()` which now uses storage_client internally. Just ensure import works.

---

#### Step 3.6: Agent 11 (Cover Letter) — already covered by skill changes

**File**: `branch-server3/agents/agent11_cover_letter.py`  
No changes needed — skill now uses storage_client.

---

#### Step 3.7: Agent 12 (Auto-Applier) — already covered by skill changes

**File**: `branch-server3/agents/agent12_applier.py`  
No changes needed — apply_engine now uses storage_client.

---

### Phase 4: Server 1 (Node.js) — Presigned URLs

#### Step 4.1: Install Dependencies

```bash
cd branch-server1
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

#### Step 4.2: Create `src/lib/storageClient.js`

Copy exact code from ORIGINAL_MIGRATION_PLAN.md lines 540-570.

```javascript
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

let _s3Client = null;

function getS3() {
  if (!_s3Client) {
    _s3Client = new S3Client({
      endpoint: process.env.S4_URL,
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }
  return _s3Client;
}

async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });
  return await getSignedUrl(getS3(), command, { expiresIn });
}

module.exports = { getPresignedUrl };
```

---

#### Step 4.3: Add Environment Variables to FluxCloud

In FluxCloud deployment config for Server 1, add:
```
S4_URL = [MinIO API URL from S4]
MINIO_ACCESS_KEY = [same as S2/S3]
MINIO_SECRET_KEY = [same as S2/S3]
MINIO_BUCKET = talvix
```

---

#### Step 4.4: Update Dashboard Routes

**File**: `branch-server1/src/routes/dashboard.js` (or `applications.js` — find correct file)

Add routes:

```javascript
const { getPresignedUrl } = require("../lib/storageClient");

// GET /api/applications/:appId/resume
router.get("/applications/:appId/resume", verifyJWT, async (req, res) => {
  const { appId } = req.params;
  const userId = req.user.id;

  const { data } = await supabase
    .from("job_applications")
    .select("tailored_resume_path")
    .eq("id", appId)
    .eq("user_id", userId)
    .single();

  if (!data?.tailored_resume_path) {
    return res.status(404).json({ error: "Resume not found" });
  }

  const url = await getPresignedUrl(data.tailored_resume_path, 3600);
  return res.json({ url });
});

// GET /api/applications/:appId/cover-letter
router.get("/applications/:appId/cover-letter", verifyJWT, async (req, res) => {
  const { appId } = req.params;
  const userId = req.user.id;

  const { data } = await supabase
    .from("job_applications")
    .select("cover_letter_path")
    .eq("id", appId)
    .eq("user_id", userId)
    .single();

  if (!data?.cover_letter_path) {
    return res.status(404).json({ error: "Cover letter not found" });
  }

  const url = await getPresignedUrl(data.cover_letter_path, 3600);
  return res.json({ url });
});
```

**Note**: Frontend should call these endpoints to get the download URL, then redirect user to the presigned URL.

---

### Phase 5: Cleanup Endpoints & pg_cron

#### Step 5.1: Create Cleanup Router on Server 2

**File**: `branch-server2/routers/cleanup.py`

```python
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from skills.storage_client import delete, list_keys
from db.client import get_supabase
from middleware.auth import verify_agent_secret  # adjust import path

router = APIRouter()

@router.post("/cleanup/tailored-resumes")
async def cleanup_tailored_resumes(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    result = get_supabase().table("job_applications") \
        .select("id, user_id, tailored_resume_path") \
        .lt("created_at", cutoff.isoformat()) \
        .not_.is_("tailored_resume_path", "null") \
        .execute()
    
    keys_to_delete = [row["tailored_resume_path"] for row in result.data if row["tailored_resume_path"]]
    
    await asyncio.gather(*[delete(key) for key in keys_to_delete])
    
    for row in result.data:
        get_supabase().table("job_applications") \
            .update({"tailored_resume_path": None}) \
            .eq("id", row["id"]) \
            .execute()
    
    return {"deleted": len(keys_to_delete)}

@router.post("/cleanup/cover-letters")
async def cleanup_cover_letters(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    # similar pattern using cover_letter_path
    # ...

@router.post("/cleanup/screenshots")
async def cleanup_screenshots(auth=Depends(verify_agent_secret)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    # For screenshots, need to list by prefix and parse timestamps from keys
    # Or store screenshot metadata in DB for easier cleanup
    # For now, list all and filter by key name if possible
    # ...

@router.post("/cleanup/jds")
async def cleanup_jds(auth=Depends(verify_agent_secret)):
    # Delete JDs for jobs marked as dead (>30 days deleted)
    # Use job_fingerprint from jobs table before hard delete
    # ...
```

**Protection**: All routes require `X-Agent-Secret` header via `verify_agent_secret` dependency.

---

#### Step 5.2: Update pg_cron Jobs

Replace file-system deletion SQL with HTTP POST to S2 cleanup endpoints.

**PostgreSQL (in Supabase)**:
```sql
-- 3:00 AM daily — cleanup tailored resumes (7 day TTL)
SELECT net.http_post(
  url := '[S2_URL]/api/cleanup/tailored-resumes',
  headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
);

-- 3:05 AM daily — cleanup cover letters (7 day TTL)
SELECT net.http_post(
  url := '[S2_URL]/api/cleanup/cover-letters',
  headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
);

-- 3:10 AM daily — cleanup screenshots (7 day TTL)
SELECT net.http_post(
  url := '[S2_URL]/api/cleanup/screenshots',
  headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
);

-- 4:00 AM daily — cleanup JDs for dead jobs (integrate into existing job cleanup)
-- In the existing dead job deletion function, before deleting job rows:
--   1. Collect all fingerprints from jobs about to be deleted
--   2. Call S2 cleanup endpoint or directly delete from MinIO using storage_client
--   3. Then delete job rows
```

---

### Phase 6: Test Updates

**All test files that use `/storage/` paths must be updated** to either:
- Mock `storage_client` calls
- Use test-specific MinIO keys (e.g., `test/resume.json.gz`)
- Or patch file operations

**Files to update** (from grep):
- `branch-server2/tests/test_agent3.py` (line 125, 184)
- `branch-server2/tests/test_flow.py` (lines 65, 105, 145)
- `branch-server2/tests/test_llm_contracts.py` (line 112)
- `branch-server3/tests/test_session_security.py` (line 106-107 — change assertion to check that `screenshot_path` doesn't contain `/storage/` but still returns a valid key pattern)

**Strategy**: Mock `storage_client.get_*` and `storage_client.put_*` in tests to avoid real MinIO calls.

---

### Phase 7: Verification & QA

#### 7.1 Grep Verification (MUST PASS)

Run on both server branches:

```bash
cd branch-server2
grep -rn "/storage/" --include="*.py" agents/ skills/ routers/ flow/ orchestrator/
# EXPECT: ZERO results after migration

cd branch-server3
grep -rn "/storage/" --include="*.py" agents/ skills/
# EXPECT: ZERO results after migration

# Also check for:
grep -rn "open(" --include="*.py" agents/ skills/ | grep -v "__pycache__"
# EXPECT: Only non-storage file opens (e.g., config files, temp files in /tmp/)

grep -rn "os.makedirs" --include="*.py" agents/ skills/
# EXPECT: ZERO

grep -rn "pathlib" --include="*.py" agents/ skills/
# EXPECT: ZERO
```

---

#### 7.2 End-to-End Flow Tests

After deployment to staging (or local with MinIO running):

**TEST 1 — Resume Upload Flow**  
1. User uploads resume via S1  
2. S1 calls S2 Agent 3  
3. Agent 3 writes parsed resume to MinIO  
4. Agent 6 (full_scan) reads from MinIO  
5. Check: `job_fit_scores` populated  

**TEST 2 — Scrape → JD Clean**  
1. Trigger Agent 9  
2. Agent 9 writes JDs to MinIO  
3. Agent 7 reads JDs from MinIO  
4. Check: `job_skills` rows created, `jobs.jd_cleaned = TRUE`

**TEST 3 — Tailored Resume**  
1. Trigger Agent 10  
2. Agent 10 (via skill) writes PDF to MinIO  
3. S1 `/api/applications/:appId/resume` returns presigned URL  
4. Frontend can download PDF via URL  

**TEST 4 — Cover Letter**  
1. Trigger Agent 11  
2. Agent 11 (via skill) writes TXT to MinIO  
3. S1 `/api/applications/:appId/cover-letter` returns presigned URL  

**TEST 5 — Screenshots**  
1. Force Selenium failure in Agent 12  
2. Check MinIO: `screenshots/agent12/YYYYMMDD_HHMMSS.png` exists  

---

#### 7.3 MinIO Health Check Integration

**Add to Server 2 orchestrator gates** (`orchestrator/gates.py`):

```python
async def check_minio_health() -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{os.environ['S4_URL']}/minio/health/live", timeout=5.0)
            return resp.status_code == 200
    except:
        return False

# In Gate 4 (System Health Gate):
if not await check_minio_health():
    alert_founder_critical("MinIO S4 health check failed")
    return {"status": "error", "reason": "storage_unavailable"}
```

---

## PART 3 — CHANGE SUMMARY BY FILE

### Server 2 (12 files + tests)

| File | Type | Changes |
|------|------|---------|
| `agents/agent3_resume.py` | Agent | Add `put_json_gz`, write parsed resume |
| `agents/agent4_skill_gap.py` | Agent | Replace `gzip.open` with `get_json_gz` |
| `agents/agent5_career.py` | Agent | Replace reads/writes with storage_client |
| `agents/agent6_fit.py` | Agent | Replace reads with storage_client |
| `agents/agent7_jd.py` | Agent | Replace read with `get_text` |
| `skills/skill_gap_analyzer.py` | Skill | Replace write with `put_json_gz` |
| `skills/resume_parser.py` | Skill | No file I/O — verify, but update docstrings if needed |
| `skills/career_scorer.py` | Skill | No file I/O — verify |
| `skills/jd_cleaner.py` | Skill | No file I/O — verify |
| `orchestrator/gates.py` | System | Update `/storage/` check to MinIO health |
| `flow/career_planner.py` | Flow | Check line 37 — may be outdated |
| `routers/cleanup.py` | New | Create new file with 4 cleanup endpoints |

**Tests**: Update all test files that reference `/storage/` paths.

---

### Server 3 (7 files + tests)

| File | Type | Changes |
|------|------|---------|
| `agents/agent9_scraper.py` | Agent | Replace `_write_jd_to_storage` with `put_text` |
| `agents/agent10_tailor.py` | Agent | No change (skill handles storage) |
| `agents/agent11_cover_letter.py` | Agent | No change |
| `agents/agent12_applier.py` | Agent | No change |
| `skills/resume_tailor.py` | Skill | **CONVERT DOCX → PDF**, fix path, replace all I/O |
| `skills/cover_letter_writer.py` | Skill | Replace all I/O with storage_client |
| `skills/apply_engine.py` | Skill | Replace `_save_screenshot` with async `put_bytes` |
| `tests/test_session_security.py` | Test | Update screenshot path assertion |

---

### Server 1 (2 files)

| File | Type | Changes |
|------|------|---------|
| `src/lib/storageClient.js` | New | Create MinIO presigned URL client |
| `src/routes/dashboard.js` (or similar) | Routes | Add presigned URL endpoints |
| `package.json` | Deps | Add `@aws-sdk/*` packages |

---

## PART 4 — CRITICAL NOTES & GOTCHAS

1. **Path format**: MinIO keys are **flat strings** — no leading slash!  
   ✅ Correct: `parsed-resumes/user123.json.gz`  
   ❌ Wrong: `/storage/parsed-resumes/user123.json.gz`

2. **PDF Conversion**: `resume_tailor.py` currently uses `python-docx`. Must switch to ReportLab (or similar) for PDF generation. This is a **feature change** but aligns with migration spec.

3. **Concurrent Operations**: Use `asyncio.gather()` for bulk operations (already in Agent 6 and 9). `storage_client` supports async.

4. **Error Handling**: `storage_client.get_*` raises `FileNotFoundError` if key missing. Agents should catch and handle appropriately (like current `FileNotFoundError` handling).

5. **DB Columns**: Continue storing MinIO keys (e.g., `parsed-resumes/user123.json.gz`) — NOT full URLs. S1 generates presigned URLs on demand.

6. **Environment Variables**: All servers need: `S4_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`. Set in FluxCloud UI directly (no Doppler).

7. **Logging**: Use `log_utils.agent_logger` as before. No changes to logging.

8. **No Caching**: Direct MinIO calls only. Do not add Redis caching layer.

9. **Tests**: Update tests to mock `storage_client` functions instead of hitting real MinIO. Use `unittest.mock.patch` or pytest fixtures.

---

## PART 5 — ROLLBACK PLAN

If migration fails in production:

1. **Keep S4 running** — no harm if unused.
2. Revert agent deployments to previous `main` branch versions.
3. Agents will continue using local `/storage/` (if still mounted and shared).
4. No database rollback needed — column values are just keys (format change from absolute path to relative key is backwards-compatible if both support reading from same location? Actually no, because old code expects `/storage/...` and new code expects `key` without slash. **Rollback requires re-deploying old agent code which expects the old path format**. This is acceptable if using feature flags? Better to:  
   - Complete migration in one deploy all-at-once across all servers.
   - Use blue-green deployment: deploy new agents to new instances, drain old ones.
   - Or: use branch-based deployment: deploy `branch-server2-migration` and `branch-server3-migration` as temporary new servers, switch over, then decommission old.

**Recommended**: Deploy to staging first, run full flow tests, then coordinated production deploy with 5-minute maintenance window.

---

## PART 6 — CHECKLIST

### Pre-Migration
- [ ] S4 MinIO server deployed and accessible from S2, S3, S1
- [ ] Bucket `talvix` created
- [ ] `MINIO_*` env vars set on S2, S3, S1
- [ ] `storage_client.py` copied to S2 and S3
- [ ] `storageClient.js` created on S1
- [ ] npm packages installed on S1
- [ ] Cleanup router created on S2
- [ ] pg_cron SQL updated
- [ ] All tests updated and passing with mocked storage_client

### During Migration
- [ ] Server 2 agents migrated in order: Agent 3 → Agent 4 → Agent 5 → Agent 6 → Agent 7
- [ ] Server 3 skills migrated: resume_tailor (PDF convert) → cover_letter_writer → apply_engine
- [ ] Server 3 agents verified (no changes except relying on updated skills)
- [ ] Server 1 routes updated
- [ ] All `/storage/` path strings replaced with MinIO keys (no leading slash)

### Post-Migration
- [ ] `grep -rn "/storage/"` returns ZERO on S2 and S3 (excluding tests, comments)
- [ ] `grep -rn "open("` shows no file operations for resumes/JDs/etc.
- [ ] MinIO health check wired into orchestrator
- [ ] End-to-end TEST 1-5 all pass in staging
- [ ] Production deployment documented with rollback steps
- [ ] AGENTS.md updated to reflect migration completion

---

## PART 7 — TIME ESTIMATE

| Task | Time |
|------|------|
| S4 setup (if not done) | 2 hours |
| storage_client.py (copy + test) | 30 min |
| storageClient.js (copy + test) | 30 min |
| Server 2 agent migrations (5 agents) | 3 hours |
| Server 3 skill migrations (3 skills) | 3 hours (includes PDF conversion) |
| Cleanup endpoints + pg_cron | 1 hour |
| Test updates | 1 hour |
| Verification + e2e testing | 2 hours |
| Production deploy + smoke tests | 2 hours |
| **Total** | **14–16 hours** (≈ 2 days with context switching) |

---

## PART 8 — RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF conversion breaks resume formatting | High | Test with multiple resume types; keep fallback to plain text if needed |
| MinIO latency slows agents | Medium | Add retry logic to storage_client; use async properly |
| Concurrent operations exceed MinIO limits | Low | Confirm S4 instance size; test load |
| Tests fail due to missing storage_client mock | Medium | Implement comprehensive test fixtures before migration |
| Rollback complicated due to path format change | High | Deploy all-at-once with backup; have hot-rollback plan |
| Agent 15 (future) developer misses storage_client requirement | Medium | Add compliance check in AGENTS.md and code review |

---

## APPENDIX — MINIO S4 SETUP (for reference)

1. Create `branch-server4` with Dockerfile (MinIO official image)
2. Deploy to FluxCloud with env: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
3. Expose ports: 9000 (API), 9001 (Console)
4. Get assigned URLs from FluxCloud: `S4_URL` (port 9000), `S4_CONSOLE_URL` (port 9001)
5. Create bucket:  
   ```python
   import boto3, os
   from botocore.client import Config
   s3 = boto3.client('s3', endpoint_url=os.environ['S4_URL'], 
                     aws_access_key_id=os.environ['MINIO_ACCESS_KEY'],
                     aws_secret_access_key=os.environ['MINIO_SECRET_KEY'],
                     config=Config(signature_version='s3v4'), region_name='us-east-1')
   s3.create_bucket(Bucket='talvix')
   ```
6. Test connectivity from S2 and S3.

---

**END OF IMPLEMENTATION PLAN**
