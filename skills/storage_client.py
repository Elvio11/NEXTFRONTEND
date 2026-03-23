import os
import gzip
import asyncio
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from datetime import timezone
import datetime
from pathlib import Path

# ─── Lazy singleton & Mode Detection ──────────────────────────────────────

_s3_client = None
_STORAGE_MODE = "local" # Default to local if variables missing

def get_storage_mode():
    global _STORAGE_MODE
    if os.environ.get("S4_URL") or os.environ.get("MINIO_URL"):
        _STORAGE_MODE = "s3"
    return _STORAGE_MODE

def get_s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=os.environ.get("S4_URL") or os.environ.get("MINIO_URL"),
            aws_access_key_id=os.environ.get("MINIO_ROOT_USER") or os.environ.get("MINIO_ACCESS_KEY") or os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("MINIO_ROOT_PASSWORD") or os.environ.get("MINIO_SECRET_KEY") or os.environ.get("AWS_SECRET_ACCESS_KEY"),
            config=Config(signature_version="s3v4"),
            region_name="us-east-1"
        )
    return _s3_client

def get_local_root() -> Path:
    # Use absolute path for inter-server consistency
    root = os.environ.get("STORAGE_ROOT", "./local-storage")
    return Path(os.path.abspath(root))

BUCKET = lambda: os.environ.get("MINIO_BUCKET", "careeros")

# ─── Core operations ──────────────────────────────────────────────────────

async def put(key: str, data: bytes) -> None:
    """Upload bytes. Key is the path e.g. parsed-resumes/user123.json.gz"""
    if get_storage_mode() == "s3":
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: get_s3().put_object(Bucket=BUCKET(), Key=key, Body=data)
        )
    else:
        path = get_local_root() / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

async def get(key: str) -> bytes:
    """Download bytes. Raises FileNotFoundError if key does not exist."""
    if get_storage_mode() == "s3":
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
    else:
        path = get_local_root() / key
        if not path.exists():
            raise FileNotFoundError(f"Local storage key not found: {key}")
        return path.read_bytes()

async def delete(key: str) -> None:
    """Delete a file. Silent if key does not exist."""
    if get_storage_mode() == "s3":
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: get_s3().delete_object(Bucket=BUCKET(), Key=key)
            )
        except ClientError:
            pass
    else:
        path = get_local_root() / key
        if path.exists():
            path.unlink()

async def exists(key: str) -> bool:
    """Check if a key exists."""
    if get_storage_mode() == "s3":
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: get_s3().head_object(Bucket=BUCKET(), Key=key)
            )
            return True
        except ClientError:
            return False
    else:
        path = get_local_root() / key
        return path.exists()

async def list_keys(prefix: str) -> list[str]:
    """List all keys under a prefix."""
    if get_storage_mode() == "s3":
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: get_s3().list_objects_v2(Bucket=BUCKET(), Prefix=prefix)
        )
        return [obj["Key"] for obj in response.get("Contents", [])]
    else:
        path = get_local_root() / prefix
        if not path.exists():
            return []
        keys = []
        for p in path.rglob("*"):
            if p.is_file():
                # Return relative to root
                keys.append(str(p.relative_to(get_local_root())).replace("\\", "/"))
        return keys

def presigned_url(key: str, expires_in: int = 3600) -> str:
    if get_storage_mode() == "s3":
        return get_s3().generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET(), "Key": key},
            ExpiresIn=expires_in
        )
    else:
        # In local mode, return a file URI or local path proxy
        # For E2E, a file URI is enough
        path = get_local_root() / key
        return path.as_uri()

# ─── Convenience helpers ──────────────────────────────────────────────────

async def put_json_gz(key: str, data: dict) -> None:
    import json
    compressed = gzip.compress(json.dumps(data).encode("utf-8"))
    await put(key, compressed)

async def get_json_gz(key: str) -> dict:
    import json
    compressed = await get(key)
    return json.loads(gzip.decompress(compressed).decode("utf-8"))

async def put_text(key: str, text: str) -> None:
    await put(key, text.encode("utf-8"))

async def get_text(key: str) -> str:
    return (await get(key)).decode("utf-8")

async def put_bytes(key: str, data: bytes) -> None:
    await put(key, data)

async def get_bytes(key: str) -> bytes:
    return await get(key)
