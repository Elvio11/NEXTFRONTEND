"""
llm/sarvam.py
Sarvam-M cloud API client for Server 3.

Base URL: https://api.sarvam.ai  (fixed — no env var needed)
Auth:     SARVAM_API_KEY from Doppler (only secret required)

Sarvam-M is the primary LLM — Apache 2.0, cost = ₹0 forever.
NEVER use Gemini as a fallback for Sarvam-M operations.
If Sarvam-M is unavailable: raise SarvamUnavailableError → agent returns "skipped".

Modes map to Sarvam's reasoning_effort parameter:
  think     → reasoning_effort="high"   — Agents 10 (Resume Tailor), 13 high-risk
  no_think  → reasoning_effort="low"    — Agent 13 fast risk checks
  precise   → reasoning_effort="medium" — stub for future Agent 14 (Server 3)
"""

import os
import httpx
from typing import Literal

SarvamMode = Literal["think", "no_think", "precise"]

# Fixed cloud endpoint — never changes
_BASE_URL = "https://api.sarvam.ai"

_MODE_TO_EFFORT = {
    "think":    "high",
    "no_think": "low",
    "precise":  "medium",
}


class SarvamUnavailableError(Exception):
    """Raised when Sarvam-M cannot be reached. Caller must return skipped."""
    pass


class SarvamClient:
    @property
    def _api_key(self) -> str:
        """Read at call time so missing key doesn't crash at import/startup."""
        key = os.environ.get("SARVAM_API_KEY", "")
        if not key:
            raise SarvamUnavailableError("SARVAM_API_KEY not configured in Doppler")
        return key

    async def complete(self, prompt: str, mode: SarvamMode) -> str:
        """
        Send a chat completion request to the Sarvam cloud API.
        Raises SarvamUnavailableError on network failure or non-2xx response.
        Caller must catch this and return {"status": "skipped"} — NEVER fall back to Gemini.
        """
        effort = _MODE_TO_EFFORT[mode]
        payload = {
            "model":            "sarvam-m",
            "messages":         [{"role": "user", "content": prompt}],
            "reasoning_effort": effort,
        }
        headers = {
            "api-subscription-key": self._api_key,
            "Content-Type":         "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"{_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except SarvamUnavailableError:
            raise
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            raise SarvamUnavailableError(f"Sarvam-M unreachable: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise SarvamUnavailableError(
                f"Sarvam-M returned {exc.response.status_code}"
            ) from exc
        except (KeyError, IndexError) as exc:
            raise SarvamUnavailableError(f"Unexpected Sarvam response format: {exc}") from exc


# Singleton — import this everywhere, never instantiate SarvamClient again
sarvam = SarvamClient()
