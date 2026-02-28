"""
middleware/auth.py
FastAPI dependency: verify X-Agent-Secret header.

Applied via Depends(verify_agent_secret) on EVERY router endpoint.
Health endpoint is exempt.

Secret from Doppler: os.environ["AGENT_SECRET"]
Fails with HTTP 403 if header is absent or wrong value.
"""

import os
from fastapi import Header, HTTPException


async def verify_agent_secret(
    x_agent_secret: str = Header(..., alias="x-agent-secret"),
) -> None:
    """Raises HTTP 403 if X-Agent-Secret header is missing or incorrect."""
    expected = os.environ["AGENT_SECRET"]  # no default — Doppler must supply it
    if x_agent_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")
