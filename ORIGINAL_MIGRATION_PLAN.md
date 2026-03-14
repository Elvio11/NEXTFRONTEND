# TALVIX — STORAGE ARCHITECTURE MIGRATION (ORIGINAL PROPOSAL)

================================================================================
TALVIX — ANTIGRAVITY SESSION 3
Storage Architecture Migration — Local Filesystem → MinIO on S4
Version: 1.0 | Date: March 2026
================================================================================

You are the technical co-founder of Talvix — an AI-first career automation
platform built specifically for India. You have full read and write access to
all four source-of-truth branches of the Talvix GitHub repository:

  server1   → WhatsApp Gateway (Node.js 24) — FluxCloud
  server2   → Intelligence Layer (Python 3.11 + FastAPI + CrewAI) — FluxCloud
  server3   → Automation Layer (Python 3.11 + FastAPI + Selenium) — FluxCloud
  frontend  → Next.js 15 App Router — Vercel

DO NOT touch the main branch. It is not the source of truth.

You have been given two files at the start of this session:

  1. TALVIX_MASTER_ARCHITECTURE_v3.1.docx  — the locked product specification
  2. TALVIX_AUDIT_REPORT.md               — ground truth of what is built

Read both files completely before writing a single line of code.

================================================================================
PART 1 — THE PROBLEM THIS SESSION SOLVES
================================================================================

The current codebase uses local filesystem paths for all file operations:

  /storage/parsed-resumes/{user_id}.json.gz
  /storage/jds/{fingerprint}.txt
  /storage/tailored/{user_id}/{app_id}.pdf
  etc.

This is BROKEN. Each FluxCloud server has its own isolated SSD.
S2 cannot read files written by S3. S3 cannot read files written by S2.

Specific broken cross-server operations right now:

  Agent 9  (S3) writes JD files     → Agent 7  (S2) cannot read them
  Agent 3  (S2) writes parsed resume → Agent 10 (S3) cannot read it
  Agent 3  (S2) writes parsed resume → Agent 6  (S3) cannot read it
  Agent 10 (S3) writes tailored PDF  → S1 cannot serve it to user
  Agent 11 (S3) writes cover letter  → S1 cannot serve it to user
  Agent 15 (S2) writes agent context → Agent 12 (S3) cannot read it

This session fixes this completely by:

  1. Deploying S4 — a dedicated MinIO storage server on FluxCloud
  2. Adding storage_client.py to S2 and S3 — boto3 S3-compatible wrapper
  3. Migrating every agent — replacing all local file paths with MinIO calls
  4. Updating S1 — serving user files via MinIO presigned URLs
  5. Updating pg_cron — cleanup jobs delete from MinIO not local filesystem
  6. Verifying — grep confirms zero local /storage/ paths remain

================================================================================
PART 2 — THE FOUR SERVER ARCHITECTURE (FINAL)
================================================================================

  S1  0.5 vCore / 1GB RAM  / 5GB    Node.js 24 + Express + Baileys
  S2  2 vCores  / 6GB RAM  / 15GB   Python 3.11 + FastAPI + CrewAI
  S3  5 vCores  / 9GB RAM  / 15GB   Python 3.11 + FastAPI + Selenium
  S4  0.5 vCore / 4GB RAM  / 50GB   MinIO — ALL file storage

All servers: 1 instance each. Unlimited bandwidth. ₹0 egress.
All env vars set directly in FluxCloud deployment config — no Doppler runtime.
Python: os.environ["KEY"] | Node: process.env.KEY

S4 has a static IP node. FluxCloud assigns separate URLs per exposed port:
  S4_URL         → :9000 MinIO API  (used by all agents)
  S4_CONSOLE_URL → :9001 MinIO Console (used manually for debugging)
All inter-server calls use FluxCloud-assigned URLs stored as env vars — never raw IPs.
All concurrent file operations use asyncio.gather() — already standard in codebase.

================================================================================
PART 3 — S4 MINIO SERVER SETUP
================================================================================

────────────────────────────────────────────────────────────────────────────────
3.1 WHAT MINIO IS
────────────────────────────────────────────────────────────────────────────────

MinIO is a self-hosted S3-compatible object storage server.
It runs as a single Docker container.
All operations use standard boto3 S3 API — no custom SDK.
One bucket: "talvix" — all files go into this single bucket.
Files are organised by key prefix (equivalent to folder paths).

────────────────────────────────────────────────────────────────────────────────
3.2 S4 GITHUB REPOSITORY
────────────────────────────────────────────────────────────────────────────────

Create a new branch in the Talvix GitHub repo: server4
This follows the same pattern as server1, server2, server3.

Branch structure:
  server4/
  ├── Dockerfile
  ├── docker-compose.yml      (for local testing only)
  ├── .dockerignore
  └── README.md               (setup instructions)

────────────────────────────────────────────────────────────────────────────────
3.3 DOCKERFILE FOR S4
────────────────────────────────────────────────────────────────────────────────

File: server4/Dockerfile

  FROM minio/minio:latest

  EXPOSE 9000    # MinIO API port
  EXPOSE 9001    # MinIO Console (web UI) port

  # Data directory — maps to FluxCloud's persistent storage
  VOLUME ["/data"]

  # Start MinIO server
  CMD ["server", "/data", "--address", ":9000", "--console-address", ":9001"]

FluxCloud deployment config environment variables (set in FluxCloud UI):
  MINIO_ROOT_USER      = [set in FluxCloud UI — never commit to repo]
  MINIO_ROOT_PASSWORD  = [set in FluxCloud UI — never commit to repo]

S4 exposes TWO ports — FluxCloud assigns a separate URL per exposed port:
  Port 9000 → MinIO API  → S4_URL         (all agent file operations)
  Port 9001 → MinIO Console → S4_CONSOLE_URL (manual debugging via web UI)

All other servers (S1/S2/S3) use port 8080 mapped from 443 for consistency.
S4 is the only server that differs — it uses 9000 for API.

────────────────────────────────────────────────────────────────────────────────
3.4 MINIO BUCKET INITIALISATION
────────────────────────────────────────────────────────────────────────────────

After S4 is deployed and MinIO is running, create the bucket once:

  import boto3
  from botocore.client import Config

  s3 = boto3.client(
      "s3",
      endpoint_url=os.environ["S4_URL"],  # FluxCloud URL → :9000
      aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
      aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
      config=Config(signature_version="s3v4"),
      region_name="us-east-1"  # MinIO requires a region, any value works
  )

  s3.create_bucket(Bucket="talvix")

Run this once as a setup script. After that the bucket persists permanently.
Add this as server4/setup_bucket.py — run manually after first deploy.

────────────────────────────────────────────────────────────────────────────────
3.5 ENVIRONMENT VARIABLES NEEDED ON S2, S3, S1
────────────────────────────────────────────────────────────────────────────────

Add these to FluxCloud deployment config for S1, S2, and S3:

  S4_URL           = https://[s4-api-assigned-url].app.runonflux.io  ← MinIO API port 9000
  MINIO_ACCESS_KEY = [same as MINIO_ROOT_USER on S4]
  MINIO_SECRET_KEY = [same as MINIO_ROOT_PASSWORD on S4]
  MINIO_BUCKET     = talvix

Also add inter-server URLs while you're in FluxCloud config:
  S1_URL = https://[s1-url].app.runonflux.io  (add to S2 and S3)
  S2_URL = https://[s2-url].app.runonflux.io  (add to S1 and S3)
  S3_URL = https://[s3-url].app.runonflux.io  (add to S1 and S2)

================================================================================
PART 4 — storage_client.py
================================================================================

This is the single most important file in this session.
It is the only way any agent interacts with MinIO.
Direct boto3 calls in agent files are FORBIDDEN — always use this wrapper.

────────────────────────────────────────────────────────────────────────────────
4.1 CREATE THIS FILE IN BOTH S2 AND S3
────────────────────────────────────────────────────────────────────────────────

  server2/skills/storage_client.py   (identical content)
  server3/skills/storage_client.py   (identical content)

────────────────────────────────────────────────────────────────────────────────
4.2 FULL IMPLEMENTATION
────────────────────────────────────────────────────────────────────────────────

  import os
  import gzip
  import asyncio
  import boto3
  from botocore.client import Config
  from botocore.exceptions import ClientError
  from datetime import timezone
  import datetime
  from log_utils.agent_logger import log_error

  # ─── Lazy singleton ───────────────────────────────────────────────────────

  _s3_client = None

  def get_s3():
      global _s3_client
      if _s3_client is None:
          _s3_client = boto3.client(
              "s3",
              endpoint_url=os.environ["S4_URL"],  # FluxCloud URL → :9000
              aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
              aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
              config=Config(signature_version="s3v4"),
              region_name="us-east-1"
          )
      return _s3_client

  BUCKET = lambda: os.environ["MINIO_BUCKET"]  # "talvix"

  # ─── Core operations ──────────────────────────────────────────────────────

  async def put(key: str, data: bytes) -> None:
      """Upload bytes to MinIO. Key is the full path e.g. parsed-resumes/user123.json.gz"""
      loop = asyncio.get_event_loop()
      await loop.run_in_executor(
          None,
          lambda: get_s3().put_object(Bucket=BUCKET(), Key=key, Body=data)
      )

  async def get(key: str) -> bytes:
      """Download bytes from MinIO. Raises FileNotFoundError if key does not exist."""
      loop = asyncio.get_event_loop()
      try:
          response = await loop.run_in_executor(
              None,
              lambda: get_s3().get_object(Bucket=BUCKET(), Key=key)
          )
          return response["Body"].read()
      except ClientError as e:
          if e.response["Error"]["Code"] == "NoSuchKey":
              raise FileNotFoundError(f"Storage key not found: {key}")
          raise

  async def delete(key: str) -> None:
      """Delete a file from MinIO. Silent if key does not exist."""
      loop = asyncio.get_event_loop()
      try:
          await loop.run_in_executor(
              None,
              lambda: get_s3().delete_object(Bucket=BUCKET(), Key=key)
          )
      except ClientError:
          pass  # Silent on missing key — idempotent delete

  async def exists(key: str) -> bool:
      """Check if a key exists in MinIO."""
      loop = asyncio.get_event_loop()
      try:
          await loop.run_in_executor(
              None,
              lambda: get_s3().head_object(Bucket=BUCKET(), Key=key)
          )
          return True
      except ClientError:
          return False

  async def list_keys(prefix: str) -> list[str]:
      """List all keys under a prefix. Used by cleanup jobs."""
      loop = asyncio.get_event_loop()
      response = await loop.run_in_executor(
          None,
          lambda: get_s3().list_objects_v2(Bucket=BUCKET(), Prefix=prefix)
      )
      return [obj["Key"] for obj in response.get("Contents", [])]

  def presigned_url(key: str, expires_in: int = 3600) -> str:
      """
      Generate a presigned URL for user-facing file downloads.
      Used by S1 to serve tailored PDFs and cover letters.
      expires_in: seconds until URL expires (default 1 hour)
      """
      return get_s3().generate_presigned_url(
          "get_object",
          Params={"Bucket": BUCKET(), "Key": key},
          ExpiresIn=expires_in
      )

  # ─── Convenience helpers ──────────────────────────────────────────────────

  async def put_json_gz(key: str, data: dict) -> None:
      """Gzip compress a dict and upload as JSON. Used for parsed resumes etc."""
      import json
      compressed = gzip.compress(json.dumps(data).encode("utf-8"))
      await put(key, compressed)

  async def get_json_gz(key: str) -> dict:
      """Download and decompress a gzipped JSON file."""
      import json
      compressed = await get(key)
      return json.loads(gzip.decompress(compressed).decode("utf-8"))

  async def put_text(key: str, text: str) -> None:
      """Upload a plain text string. Used for JDs, cover letters."""
      await put(key, text.encode("utf-8"))

  async def get_text(key: str) -> str:
      """Download a plain text file."""
      return (await get(key)).decode("utf-8")

  async def put_bytes(key: str, data: bytes) -> None:
      """Upload raw bytes. Used for PDF files."""
      await put(key, data)

  async def get_bytes(key: str) -> bytes:
      """Download raw bytes. Used for PDF files."""
      return await get(key)

────────────────────────────────────────────────────────────────────────────────
4.3 USAGE RULES
────────────────────────────────────────────────────────────────────────────────

  from skills.storage_client import put_json_gz, get_json_gz, put_text, get_text, put_bytes, presigned_url

  # Parsed resume (gzipped JSON)
  await put_json_gz(f"parsed-resumes/{user_id}.json.gz", resume_dict)
  resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")

  # JD text file
  await put_text(f"jds/{fingerprint}.txt", jd_text)
  jd = await get_text(f"jds/{fingerprint}.txt")

  # Tailored PDF (raw bytes)
  await put_bytes(f"tailored/{user_id}/{app_id}.pdf", pdf_bytes)

  # Presigned URL for user download (called from S1 via API response)
  url = presigned_url(f"tailored/{user_id}/{app_id}.pdf", expires_in=3600)

  NEVER call boto3 directly in agent files.
  NEVER use open() for /storage/ paths.
  ALWAYS import from skills.storage_client.

================================================================================
PART 5 — KEY PATHS (UNCHANGED — SAME LOGICAL STRUCTURE)
================================================================================

The logical file paths stay identical to what agents currently use.
Only the transport changes (local disk → MinIO).
This minimises code changes — agents just swap open() for storage_client calls.

  parsed-resumes/{user_id}.json.gz          Written: Agent 3  | Read: Agent 6, 10
  skill-gaps/{user_id}.json.gz              Written: Agent 4  | Read: Agent 4
  career-intel/{user_id}.json.gz            Written: Agent 5  | Read: Agent 5
  jds/{fingerprint}.txt                     Written: Agent 9  | Read: Agent 7
  tailored/{user_id}/{app_id}.pdf           Written: Agent 10 | Served: S1
  cover-letters/{user_id}/{app_id}.txt      Written: Agent 11 | Served: S1
  screenshots/{agent}/{timestamp}.png       Written: Agent 12 | Read: debugging
  calibration/{run_id}.json.gz              Written: Agent 15 | Read: Agent 15
  model-data/weights_current.json           Written: Agent 15 | Read: Agent 6
  agent-context/{user_id}/current.json      Written: S2       | Read: S2, S3

================================================================================
PART 6 — MIGRATION: SERVER 2 AGENTS
================================================================================

For each file below:
  1. Add import: from skills.storage_client import [needed functions]
  2. Replace every open() / local file read / local file write
  3. Remove any os.path, os.makedirs, pathlib references for /storage/
  4. Keep all other logic completely unchanged

────────────────────────────────────────────────────────────────────────────────
AGENT 3 — server2/agents/agent3_resume.py
────────────────────────────────────────────────────────────────────────────────

Current (broken):
  os.makedirs(f"/storage/parsed-resumes/", exist_ok=True)
  with gzip.open(f"/storage/parsed-resumes/{user_id}.json.gz", "wb") as f:
      f.write(json.dumps(parsed_resume).encode())

Replace with:
  await put_json_gz(f"parsed-resumes/{user_id}.json.gz", parsed_resume)

Also update: resumes table → parsed_resume_path column
  Store the MinIO key, not a local path:
  parsed_resume_path = f"parsed-resumes/{user_id}.json.gz"

────────────────────────────────────────────────────────────────────────────────
AGENT 4 — server2/agents/agent4_skill_gap.py
────────────────────────────────────────────────────────────────────────────────

Read parsed resume:
  resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")

Write full skill gap report:
  await put_json_gz(f"skill-gaps/{user_id}.json.gz", full_report)

────────────────────────────────────────────────────────────────────────────────
AGENT 5 — server2/agents/agent5_career.py
────────────────────────────────────────────────────────────────────────────────

Write career intel:
  await put_json_gz(f"career-intel/{user_id}.json.gz", career_intel)

────────────────────────────────────────────────────────────────────────────────
AGENT 6 — server2/agents/agent6_fit.py
────────────────────────────────────────────────────────────────────────────────

Read parsed resume during scoring:
  resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")

Read model weights:
  weights_json = await get_text("model-data/weights_current.json")
  weights = json.loads(weights_json)

IMPORTANT — concurrent reads for full_scan mode:
  When scoring multiple users in full_scan, read resumes concurrently:

  resumes = await asyncio.gather(*[
      get_json_gz(f"parsed-resumes/{uid}.json.gz")
      for uid in user_ids
  ], return_exceptions=True)

  Handle FileNotFoundError per user — if resume missing, skip that user,
  log warning, continue.

────────────────────────────────────────────────────────────────────────────────
AGENT 7 — server2/agents/agent7_jd.py
────────────────────────────────────────────────────────────────────────────────

Read JD files for cleaning:
  jd_text = await get_text(f"jds/{fingerprint}.txt")

IMPORTANT — concurrent reads for batch cleaning:
  jd_texts = await asyncio.gather(*[
      get_text(f"jds/{fp}.txt")
      for fp in fingerprints
  ], return_exceptions=True)

Handle FileNotFoundError per JD — if JD missing from storage,
mark jobs.jd_cleaned = TRUE with empty skills (don't crash the batch).

────────────────────────────────────────────────────────────────────────────────
AGENT 8 — server2/agents/agent8_coach.py
────────────────────────────────────────────────────────────────────────────────

No file operations. No changes needed.

────────────────────────────────────────────────────────────────────────────────
AGENT 15 — server2/agents/agent15_calibrator.py (Phase F — future)
────────────────────────────────────────────────────────────────────────────────

When Agent 15 is built in Session 2 Phase F, it must use:

  Write calibration report:
  await put_json_gz(f"calibration/{run_id}.json.gz", report)

  Write model weights:
  await put_text("model-data/weights_current.json", json.dumps(weights))

  DO NOT use local filesystem paths when building Agent 15.

================================================================================
PART 7 — MIGRATION: SERVER 3 AGENTS
================================================================================

────────────────────────────────────────────────────────────────────────────────
AGENT 9 — server3/agents/agent9_scraper.py
────────────────────────────────────────────────────────────────────────────────

Write JD files after scraping:
  await put_text(f"jds/{fingerprint}.txt", raw_jd_text)

IMPORTANT — concurrent writes for batch:
  await asyncio.gather(*[
      put_text(f"jds/{fp}.txt", jd)
      for fp, jd in fingerprint_jd_pairs
  ])

────────────────────────────────────────────────────────────────────────────────
AGENT 10 — server3/agents/agent10_tailor.py
────────────────────────────────────────────────────────────────────────────────

Read parsed resume:
  resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")

Write tailored PDF:
  await put_bytes(f"tailored/{user_id}/{app_id}.pdf", pdf_bytes)

Update job_applications.tailored_resume_path:
  Store MinIO key: f"tailored/{user_id}/{app_id}.pdf"
  NOT a local path. NOT a URL. Just the key.
  S1 generates the presigned URL on demand when user requests download.

Also check: storage path in audit was noted as
  /storage/tailored-resumes/{user_id}/{job_id}.docx (wrong path + wrong format)
  Correct to: tailored/{user_id}/{app_id}.pdf (PDF not DOCX, app_id not job_id)

────────────────────────────────────────────────────────────────────────────────
AGENT 11 — server3/agents/agent11_cover_letter.py
────────────────────────────────────────────────────────────────────────────────

Write cover letter:
  await put_text(f"cover-letters/{user_id}/{app_id}.txt", cover_letter_text)

Update job_applications.cover_letter_path:
  Store MinIO key: f"cover-letters/{user_id}/{app_id}.txt"

────────────────────────────────────────────────────────────────────────────────
AGENT 12 — server3/agents/agent12_applier.py + skills/apply_engine.py
────────────────────────────────────────────────────────────────────────────────

Write failure screenshots:
  import datetime
  timestamp = datetime.datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
  await put_bytes(f"screenshots/agent12/{timestamp}.png", screenshot_bytes)

Where screenshot_bytes comes from Selenium:
  screenshot_bytes = driver.get_screenshot_as_png()

────────────────────────────────────────────────────────────────────────────────
AGENT 13 — server3/agents/agent13_anti_ban.py
────────────────────────────────────────────────────────────────────────────────

No file operations. No changes needed.

================================================================================
PART 8 — MIGRATION: SERVER 1
================================================================================

S1 does not write files. It only needs to serve user-facing files to the
frontend via presigned URLs.

────────────────────────────────────────────────────────────────────────────────
8.1 ADD MinIO CLIENT TO SERVER 1 (Node.js)
────────────────────────────────────────────────────────────────────────────────

Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

Create: server1/src/lib/storageClient.js

  const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

  let _s3Client = null;

  function getS3() {
    if (!_s3Client) {
      _s3Client = new S3Client({
        endpoint: process.env.S4_URL,  // FluxCloud URL → :9000
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY,
          secretAccessKey: process.env.MINIO_SECRET_KEY,
        },
        forcePathStyle: true,  // Required for MinIO
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

────────────────────────────────────────────────────────────────────────────────
8.2 UPDATE DASHBOARD PROXY ROUTE
────────────────────────────────────────────────────────────────────────────────

When frontend requests a tailored resume or cover letter download,
S1 generates a presigned URL and returns it. Frontend redirects user to it.

Update server1/src/routes/dashboard.js (or applications.js):

  const { getPresignedUrl } = require("../lib/storageClient");

  // GET /api/applications/:appId/resume
  router.get("/applications/:appId/resume", verifyJWT, async (req, res) => {
    const { appId } = req.params;
    const userId = req.user.id;

    // Fetch the MinIO key from job_applications table
    const { data } = await supabase
      .from("job_applications")
      .select("tailored_resume_path")
      .eq("id", appId)
      .eq("user_id", userId)
      .single();

    if (!data?.tailored_resume_path) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Generate presigned URL — valid for 1 hour
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

Add to S1 FluxCloud env vars:
  S4_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET
  (same vars as S2 and S3 — no MINIO_HOST or MINIO_PORT needed, S4_URL covers it)

================================================================================
PART 9 — UPDATE pg_cron CLEANUP JOBS
================================================================================

Current pg_cron cleanup jobs delete files from local filesystem via direct
SQL or agent calls. These need to be updated to call MinIO delete instead.

The cleanest approach: create a cleanup endpoint on S2 that pg_cron calls.
S2 then uses storage_client.delete() to remove expired files from MinIO.

────────────────────────────────────────────────────────────────────────────────
9.1 ADD CLEANUP ROUTER TO SERVER 2
────────────────────────────────────────────────────────────────────────────────

Create: server2/routers/cleanup.py

  POST /api/cleanup/tailored-resumes    # Delete PDFs older than 7 days
  POST /api/cleanup/cover-letters       # Delete cover letters older than 7 days
  POST /api/cleanup/screenshots         # Delete screenshots older than 7 days
  POST /api/cleanup/jds                 # Delete JDs for dead jobs (30 days)

All routes: X-Agent-Secret required.

Implementation pattern for each:

  @router.post("/cleanup/tailored-resumes")
  async def cleanup_tailored_resumes(auth=Depends(verify_agent_secret)):
      cutoff = datetime.now(timezone.utc) - timedelta(days=7)

      # Get expired application IDs from Supabase
      result = get_supabase().table("job_applications") \
          .select("id, user_id, tailored_resume_path") \
          .lt("created_at", cutoff.isoformat()) \
          .not_.is_("tailored_resume_path", "null") \
          .execute()

      keys_to_delete = [
          row["tailored_resume_path"]
          for row in result.data
          if row["tailored_resume_path"]
      ]

      # Delete concurrently from MinIO
      await asyncio.gather(*[delete(key) for key in keys_to_delete])

      # Clear paths in DB
      for row in result.data:
          get_supabase().table("job_applications") \
              .update({"tailored_resume_path": None}) \
              .eq("id", row["id"]) \
              .execute()

      return {"deleted": len(keys_to_delete)}

────────────────────────────────────────────────────────────────────────────────
9.2 UPDATE pg_cron TO CALL CLEANUP ENDPOINTS
────────────────────────────────────────────────────────────────────────────────

Replace existing file-deletion pg_cron jobs with HTTP calls to S2 cleanup:

  -- 3:00 AM daily — cleanup tailored resumes (7 day TTL)
  SELECT net.http_post(
    url := '{S2_URL}/api/cleanup/tailored-resumes',
    headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
  );

  -- 3:05 AM daily — cleanup cover letters (7 day TTL)
  SELECT net.http_post(
    url := '{S2_URL}/api/cleanup/cover-letters',
    headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
  );

  -- 3:10 AM daily — cleanup screenshots (7 day TTL)
  SELECT net.http_post(
    url := '{S2_URL}/api/cleanup/screenshots',
    headers := json_build_object('X-Agent-Secret', current_setting('app.agent_secret'))
  );

  -- 4:00 AM daily — cleanup JDs for dead jobs (already handled by jobs DELETE cascade)
  -- JD files in MinIO: delete when job row is hard deleted
  -- Add to existing dead job cleanup: call storage delete for each fingerprint

================================================================================
PART 10 — VERIFICATION
================================================================================

After all migrations are complete, run these checks before closing the session.

────────────────────────────────────────────────────────────────────────────────
10.1 GREP VERIFICATION — ZERO LOCAL PATHS MUST REMAIN
────────────────────────────────────────────────────────────────────────────────

Run on server2/ and server3/ branches:

  grep -rn "open(" server2/ --include="*.py" | grep -v "__pycache__" | grep -v ".pyc"
  grep -rn "/storage/" server2/ --include="*.py"
  grep -rn "/storage/" server3/ --include="*.py"
  grep -rn "os.makedirs" server2/ --include="*.py"
  grep -rn "os.makedirs" server3/ --include="*.py"
  grep -rn "pathlib" server2/ --include="*.py"
  grep -rn "pathlib" server3/ --include="*.py"

Expected result: ZERO hits on /storage/ paths.
open() hits should only be in non-agent utility files (e.g. PDF generation libs).

────────────────────────────────────────────────────────────────────────────────
10.2 END-TO-END FLOW TEST
────────────────────────────────────────────────────────────────────────────────

Test the critical cross-server flows manually after deployment:

  TEST 1 — Resume upload flow:
    Upload resume → Agent 3 writes to MinIO → Agent 6 reads from MinIO
    PASS: fit scores appear in job_fit_scores table

  TEST 2 — Nightly scrape flow:
    Trigger Agent 9 → JDs written to MinIO → Agent 7 reads from MinIO
    PASS: job_skills rows populated, jd_cleaned = TRUE

  TEST 3 — Tailored resume flow:
    Trigger Agent 10 → PDF written to MinIO → S1 generates presigned URL
    PASS: frontend receives URL, PDF downloads successfully

  TEST 4 — Cover letter flow:
    Trigger Agent 11 → TXT written to MinIO → S1 generates presigned URL
    PASS: frontend receives URL, cover letter opens successfully

  TEST 5 — Screenshot flow:
    Force a Selenium failure → Agent 12 writes screenshot to MinIO
    PASS: screenshot visible in MinIO console at screenshots/agent12/

────────────────────────────────────────────────────────────────────────────────
10.3 MINIO HEALTH CHECK
────────────────────────────────────────────────────────────────────────────────

Add a health check to S4's MinIO that S2 can call:

  GET {S4_URL}/minio/health/live
  (S4_URL already points to port 9000 via FluxCloud)
  Expected response: 200 OK

Add this check to Server 2's System Health Gate (orchestrator/gates.py):

  # Gate 4 — System Health Gate
  minio_healthy = await check_minio_health()
  if not minio_healthy:
      alert_founder_critical("MinIO S4 health check failed")
      return {"status": "error", "reason": "storage_unavailable"}

================================================================================
PART 11 — WHAT NOT TO TOUCH
================================================================================

  - All Supabase table structures — no schema changes
  - All agent business logic — only file I/O lines change
  - All LLM prompt logic — untouched
  - All Selenium logic — untouched
  - All authentication middleware — untouched
  - CareerPlannerFlow — untouched
  - pg_cron cleanup jobs for DB rows (agent_logs, notifications, etc.) — untouched
  - Frontend — no changes (presigned URLs are transparent to frontend)
  - Any file that has zero file operations — do not touch it

Do NOT:
  - Add local /storage/ paths anywhere
  - Call boto3 directly in agent files — always use storage_client
  - Store full URLs in DB columns — store MinIO keys only
  - Use Supabase Storage for any file operation
  - Add any caching layer — direct MinIO calls only

================================================================================
PART 12 — UPDATED CODE CONSTRAINT C7
================================================================================

The original C7 constraint said:
  "No Supabase Storage client for file storage. /storage/ paths only."

C7 is now updated to:

  C7 — STORAGE VIA MINIO ONLY
  All file reads and writes must use skills/storage_client.py exclusively.
  Never use open() for persistent storage.
  Never use local /storage/ filesystem paths.
  Never import boto3 directly in agent files.
  Never use Supabase Storage client.
  Always import: from skills.storage_client import [needed functions]
  DB columns store MinIO keys (strings), never full URLs or local paths.

This constraint applies to every existing agent file and every future agent.

================================================================================
PART 13 — NEW DOPPLER SECRETS (FOR REFERENCE ONLY)
================================================================================

Doppler is no longer in the runtime path. Env vars are set directly in
FluxCloud deployment config UI. However, update Doppler as a reference
document so all 73+ secrets remain documented.

Add these new entries to Doppler as reference documentation only:

  S4_URL           FluxCloud URL for MinIO API (port 9000)
  S4_CONSOLE_URL   FluxCloud URL for MinIO Console (port 9001)
  MINIO_ACCESS_KEY MinIO root user (same value as MINIO_ROOT_USER on S4)
  MINIO_SECRET_KEY MinIO root password (same value as MINIO_ROOT_PASSWORD on S4)
  MINIO_BUCKET     talvix
  S1_URL           FluxCloud URL for S1
  S2_URL           FluxCloud URL for S2
  S3_URL           FluxCloud URL for S3

Total: 73 existing + 8 new = 81 secrets documented in Doppler (reference only).
All are set in FluxCloud UI directly. S4 uses MINIO_ROOT_USER and
MINIO_ROOT_PASSWORD as its own env vars (MinIO's native names).

================================================================================
PART 14 — UPDATED ARCHITECTURE FACTS
================================================================================

These facts supersede anything in TALVIX_MASTER_ARCHITECTURE_v3.1.docx:

  Servers:          4 (S1, S2, S3, S4) — not 3
  Instances:        1 per server — not 3
  Storage:          MinIO on S4 — not FluxShare
  Storage paths:    MinIO keys — not /storage/ local filesystem
  File serving:     Presigned URLs via S1 — not direct file serving
  Doppler:          Reference only — not runtime injection
  LLM hosting:      API calls — not self-hosted
  Monthly cost:     ~₹1,174/mo — not ₹1,635/mo

  S1:  0.5 vCore / 1GB  / 5GB   ~₹19/mo
  S2:  2 vCores  / 6GB  / 15GB  ~₹89/mo
  S3:  5 vCores  / 9GB  / 15GB  ~₹173/mo
  S4:  0.5 vCore / 4GB  / 50GB  ~₹128/mo  ← NEW
  Webshare:                       ₹415/mo
  Jio SIM:                        ₹350/mo
  ──────────────────────────────────────
  TOTAL:                          ₹1,174/mo

================================================================================
VERIFICATION CHECKLIST — SESSION 3 COMPLETE WHEN ALL PASS
================================================================================

  [ ] S4 branch created (server4) with Dockerfile
  [ ] MinIO running on S4, bucket "talvix" created
  [ ] S4 static IP set, accessible from S1, S2, S3
  [ ] storage_client.py added to server2/skills/ and server3/skills/
  [ ] Agent 3: parsed resume writes to MinIO ✅
  [ ] Agent 4: reads resume + writes skill gaps to MinIO ✅
  [ ] Agent 5: writes career intel to MinIO ✅
  [ ] Agent 6: reads resume + model weights from MinIO ✅
  [ ] Agent 7: reads JDs from MinIO ✅
  [ ] Agent 9: writes JDs to MinIO ✅
  [ ] Agent 10: reads resume + writes PDF to MinIO ✅
  [ ] Agent 11: writes cover letter to MinIO ✅
  [ ] Agent 12: writes screenshots to MinIO ✅
  [ ] S1: storageClient.js added, presigned URL routes working ✅
  [ ] S1: MINIO_* env vars added to FluxCloud config ✅
  [ ] S2: MINIO_* env vars added to FluxCloud config ✅
  [ ] S3: MINIO_* env vars added to FluxCloud config ✅
  [ ] cleanup.py router added to S2 ✅
  [ ] pg_cron cleanup jobs updated to call S2 cleanup endpoints ✅
  [ ] grep -rn "/storage/" returns ZERO hits on S2 and S3 ✅
  [ ] End-to-end TEST 1-5 all pass ✅
  [ ] MinIO health check wired into Orchestrator Gate 4 ✅
  [ ] Doppler updated with 5 new MinIO secrets (reference) ✅

================================================================================
END OF TALVIX ANTIGRAVITY SESSION 3 PROMPT
================================================================================
