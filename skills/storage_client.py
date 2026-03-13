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
