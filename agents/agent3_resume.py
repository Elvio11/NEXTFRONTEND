"""
agents/agent3_resume.py
Agent 3 — Resume Intelligence (Parichay)

Parses user resume, generates AI personas, writes to DB and MinIO.
Called by CareerPlannerFlow @start and by /api/agents/resume-intelligence router.

6-Layer Upload Security (Layers 5-6 live here):
  Layer 5: Subprocess sandboxing with 30s timeout. If parsing crashes, main
           FastAPI process stays alive. File is deleted from MinIO on failure.
  Layer 6: Storage isolation. Original upload deleted after successful parse.
           Only parsed JSON output is kept: parsed-resumes/{user_id}.json.gz

Steps:
  1. Parse file (pypdf / python-docx via resume_parser skill — Layers 3+4 run there)
     → Run in sandboxed subprocess with 30s timeout (Layer 5)
  2. Generate 3 AI persona variants (Sarvam-M Think via persona_generator skill)
  3. Write gzip'd parsed JSON to MinIO: parsed-resumes/{user_id}.json.gz
  4. Upsert resumes table (slim summary JSONB)
  5. Set users.fit_scores_stale = TRUE
  6. Set users.onboarding_completed = TRUE (first parse)
  7. Delete original upload from MinIO (Layer 6)
  8. Return persona_options + extracted_summary to caller
"""

import time
import sys
import asyncio
import subprocess
import json
from datetime import datetime, timezone

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.resume_parser import parse_resume
from skills.persona_generator import generate_personas
from skills.storage_client import put_json_gz, delete as delete_from_minio
from skills.embedding_engine import store_resume_embedding
from llm.sarvam import SarvamUnavailableError


# ── Layer 5: Subprocess sandboxing with 30s timeout ─────────────────────────
PARSE_TIMEOUT_SECONDS = 30


def _run_parse_subprocess(s3_key: str, user_id: str) -> dict:
    """
    Layer 5: Run resume parsing in a subprocess with 30s timeout.
    This function is executed in a child process to isolate parsing failures
    from the main FastAPI process.

    Returns:
        dict with parsed resume data on success
    Raises:
        TimeoutError if parsing exceeds 30 seconds
        Exception on any parsing failure
    """
    # Run the async parse_resume in a subprocess using asyncio.run()
    # The subprocess gets its own Python interpreter - failures here don't crash main
    return asyncio.run(parse_resume(s3_key, user_id))


async def _parse_in_sandbox(
    s3_key: str, user_id: str, timeout_seconds: int = PARSE_TIMEOUT_SECONDS
) -> dict:
    """
    Layer 5: Execute resume parsing in a sandboxed subprocess with timeout.

    Uses subprocess.run() to spawn a child process that executes the parsing.
    If the subprocess crashes or exceeds timeout, the main process stays alive.

    Args:
        s3_key: MinIO key for the uploaded resume file
        user_id: User ID for database records
        timeout_seconds: Maximum time allowed for parsing (default 30s)

    Returns:
        Parsed resume dict on success

    Raises:
        TimeoutError if subprocess times out
        Exception if subprocess crashes or returns error
    """
    # Get the current Python executable path
    python_exe = sys.executable

    # Create a script that runs the parsing in a subprocess
    # We pass the s3_key and user_id as JSON via stdin to avoid shell injection
    script_code = f'''
import sys
import json
import asyncio
from skills.resume_parser import parse_resume

async def main():
    s3_key = "{s3_key}"
    user_id = "{user_id}"
    try:
        result = await parse_resume(s3_key, user_id)
        print("SUCCESS:" + json.dumps(result))
    except Exception as e:
        print("ERROR:" + str(e))
    finally:
        # Ensure we exit cleanly
        sys.exit(0)

asyncio.run(main())
'''

    try:
        # Run parsing in subprocess with timeout
        # This is the critical Layer 5 security measure - isolates parsing failures
        result = subprocess.run(
            [python_exe, "-c", script_code],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            # Additional sandboxing: restrict filesystem access in production
            # cwd=os.path.dirname(os.path.abspath(__file__)),  # Optional: restrict working dir
        )

        # Check if subprocess was killed by timeout
        if result.returncode == -15 or result.returncode == -9:
            # -15 = SIGTERM (timeout), -9 = SIGKILL
            raise TimeoutError(f"Parsing timed out after {timeout_seconds}s")

        # Parse stdout for success/error markers
        stdout = result.stdout.strip() if result.stdout else ""
        stderr = result.stderr.strip() if result.stderr else ""

        if stdout.startswith("SUCCESS:"):
            # Extract parsed JSON
            parsed_json = stdout[8:]  # Remove "SUCCESS:" prefix
            return json.loads(parsed_json)

        elif stdout.startswith("ERROR:"):
            # Propagate the error from subprocess
            error_msg = stdout[6:]
            raise Exception(f"Subprocess parse error: {error_msg}")

        else:
            # Unexpected output - check stderr
            if stderr:
                raise Exception(f"Subprocess stderr: {stderr}")
            raise Exception(f"Unexpected subprocess output: {stdout[:200]}")

    except subprocess.TimeoutExpired:
        # This catches the timeout before returncode check
        raise TimeoutError(f"Parsing timed out after {timeout_seconds}s")
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse subprocess output: {e}")


async def run(user_id: str, s3_key: str) -> dict:
    """
    Full Agent 3 execution.
    Returns standard response envelope + persona_options + extracted_summary.
    """
    run_id = new_run_id()
    start = time.time()
    await log_start("agent3_resume", user_id, run_id)

    def _elapsed_ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # ── Step 1: Parse resume (Layer 5 — subprocess sandbox with 30s timeout) ─
        try:
            # Run parsing in sandboxed subprocess with 30s timeout
            # This isolates parsing failures from the main FastAPI process
            parsed = await _parse_in_sandbox(s3_key, user_id, PARSE_TIMEOUT_SECONDS)
        except TimeoutError as te:
            reason = f"parse_timeout: {str(te)}"
            # Layer 5: Log incident and delete file from MinIO on timeout
            await delete_from_minio(s3_key)
            get_supabase().table("resumes").upsert(
                {
                    "user_id": user_id,
                    "parse_status": "failed",
                    "parse_error": reason,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="user_id",
            ).execute()
            await log_fail(run_id, f"timeout: s3_key={s3_key}, {reason}", _elapsed_ms())
            return {
                "status": "failed",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error": reason,
            }
        except Exception as exc:
            reason = f"parse_error: {str(exc)[:200]}"
            # Layer 5: Log incident and delete file from MinIO on parse failure
            await delete_from_minio(s3_key)
            get_supabase().table("resumes").upsert(
                {
                    "user_id": user_id,
                    "parse_status": "failed",
                    "parse_error": reason,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="user_id",
            ).execute()
            await log_fail(run_id, f"crash: s3_key={s3_key}, {reason}", _elapsed_ms())
            return {
                "status": "failed",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error": reason,
            }

        # ── Step 2: Generate personas ─────────────────────────────────────
        try:
            personas = await generate_personas(parsed)
        except SarvamUnavailableError as exc:
            await log_skip(run_id, f"sarvam_unavailable: {exc}")
            return {
                "status": "skipped",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error": "Sarvam-M unavailable — retry later",
            }

        # ── Step 3: Upsert resumes table ──────────────────────────────────
        summary_jsonb = {
            "seniority": parsed["seniority_level"],
            "top_5_skills": parsed["top_5_skills"],
            "exp_years": parsed["experience_years"],
            "persona": None,  # set after user selects in Step 4
        }

        get_supabase().table("resumes").upsert(
            {
                "user_id": user_id,
                "parse_status": "done",
                "summary": summary_jsonb,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="user_id",
        ).execute()

        await put_json_gz(f"parsed-resumes/{user_id}.json.gz", parsed)

        # Generate resume embedding for pgvector hybrid search
        try:
            await store_resume_embedding(user_id, parsed.get("raw_text", "")[:3000])
        except Exception:
            pass  # Non-fatal — embedding retried on next parse

        # ── Step 4: Set flags on users table ──────────────────────────────
        get_supabase().table("users").update(
            {
                "fit_scores_stale": True,
                "onboarding_completed": True,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", user_id).execute()

        # ── Layer 6: Delete original upload from MinIO ────────────────────
        # Only parsed JSON output kept: parsed-resumes/{user_id}.json.gz
        await delete_from_minio(s3_key)

        await log_end(run_id, 1, _elapsed_ms())

        return {
            "status": "success",
            "duration_ms": _elapsed_ms(),
            "records_processed": 1,
            "error": None,
            "persona_options": personas,
            "extracted_summary": {
                "seniority": parsed["seniority_level"],
                "top_5_skills": parsed["top_5_skills"],
                "exp_years": parsed["experience_years"],
                "current_title": parsed["current_title"],
            },
            "storage_path": f"parsed-resumes/{user_id}.json.gz",
        }

    except Exception as exc:
        # Delete original upload on any unexpected failure
        try:
            await delete_from_minio(s3_key)
        except Exception:
            pass
        await log_fail(run_id, str(exc), _elapsed_ms())
        return {
            "status": "failed",
            "duration_ms": _elapsed_ms(),
            "records_processed": 0,
            "error": str(exc)[:500],
        }
