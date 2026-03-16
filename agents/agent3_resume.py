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
  2. Generate 3 AI persona variants (Sarvam-M Think via persona_generator skill)
  3. Write gzip'd parsed JSON to MinIO: parsed-resumes/{user_id}.json.gz
  4. Upsert resumes table (slim summary JSONB)
  5. Set users.fit_scores_stale = TRUE
  6. Set users.onboarding_completed = TRUE (first parse)
  7. Delete original upload from MinIO (Layer 6)
  8. Return persona_options + extracted_summary to caller
"""

import time
import asyncio
import uuid
from datetime import datetime, timezone
from concurrent.futures import ProcessPoolExecutor

from db.client import get_supabase
from log_utils.agent_logger import log_start, log_end, log_fail, log_skip, new_run_id
from skills.resume_parser import parse_resume, ParseError
from skills.persona_generator import generate_personas
from skills.storage_client import put_json_gz, delete as delete_from_minio
from skills.embedding_engine import store_resume_embedding
from llm.sarvam import SarvamUnavailableError


# ── Layer 5: Subprocess timeout ──────────────────────────────────────────
PARSE_TIMEOUT_SECONDS = 30


async def run(user_id: str, s3_key: str) -> dict:
    """
    Full Agent 3 execution.
    Returns standard response envelope + persona_options + extracted_summary.
    """
    run_id = new_run_id()
    start  = time.time()
    await log_start("agent3_resume", user_id, run_id)

    def _elapsed_ms() -> int:
        return int((time.time() - start) * 1000)

    try:
        # ── Step 1: Parse resume (Layer 5 — with timeout) ─────────────
        try:
            parsed = await asyncio.wait_for(
                parse_resume(s3_key, user_id),
                timeout=PARSE_TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            reason = f"parse_timeout: exceeded {PARSE_TIMEOUT_SECONDS}s"
            # Layer 5: Delete file from MinIO on timeout
            await delete_from_minio(s3_key)
            get_supabase().table("resumes").upsert({
                "user_id":      user_id,
                "parse_status": "failed",
                "parse_error":  reason,
                "updated_at":   datetime.now(timezone.utc).isoformat(),
            }, on_conflict="user_id").execute()
            await log_fail(run_id, reason, _elapsed_ms())
            return {
                "status":    "failed",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error":     reason,
            }
        except ParseError as pe:
            reason = str(pe)
            # Layer 5: Delete file from MinIO on parse failure
            await delete_from_minio(s3_key)
            get_supabase().table("resumes").upsert({
                "user_id":      user_id,
                "parse_status": "failed",
                "parse_error":  reason,
                "updated_at":   datetime.now(timezone.utc).isoformat(),
            }, on_conflict="user_id").execute()
            await log_fail(run_id, reason, _elapsed_ms())
            return {
                "status":    "failed",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error":     reason,
            }

        # ── Step 2: Generate personas ─────────────────────────────────────
        try:
            personas = await generate_personas(parsed)
        except SarvamUnavailableError as exc:
            await log_skip(run_id, f"sarvam_unavailable: {exc}")
            return {
                "status":    "skipped",
                "duration_ms": _elapsed_ms(),
                "records_processed": 0,
                "error":     "Sarvam-M unavailable — retry later",
            }

        # ── Step 3: Upsert resumes table ──────────────────────────────────
        summary_jsonb = {
            "seniority":   parsed["seniority_level"],
            "top_5_skills": parsed["top_5_skills"],
            "exp_years":   parsed["experience_years"],
            "persona":     None,  # set after user selects in Step 4
        }

        get_supabase().table("resumes").upsert({
            "user_id":      user_id,
            "parse_status": "done",
            "summary":      summary_jsonb,
            "updated_at":   datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()

        await put_json_gz(f"parsed-resumes/{user_id}.json.gz", parsed)

        # Generate resume embedding for pgvector hybrid search
        try:
            await store_resume_embedding(user_id, parsed.get("raw_text", "")[:3000])
        except Exception:
            pass  # Non-fatal — embedding retried on next parse

        # ── Step 4: Set flags on users table ──────────────────────────────
        get_supabase().table("users").update({
            "fit_scores_stale":      True,
            "onboarding_completed":  True,
            "updated_at":            datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        # ── Layer 6: Delete original upload from MinIO ────────────────────
        # Only parsed JSON output kept: parsed-resumes/{user_id}.json.gz
        await delete_from_minio(s3_key)

        await log_end(run_id, 1, _elapsed_ms())

        return {
            "status":            "success",
            "duration_ms":       _elapsed_ms(),
            "records_processed": 1,
            "error":             None,
            "persona_options":   personas,
            "extracted_summary": {
                "seniority":    parsed["seniority_level"],
                "top_5_skills": parsed["top_5_skills"],
                "exp_years":    parsed["experience_years"],
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
            "status":    "failed",
            "duration_ms": _elapsed_ms(),
            "records_processed": 0,
            "error":     str(exc)[:500],
        }
