"""
llm/gemini.py
Gemini async HTTP client for Server 2.

Usage on this server:
  flash_lite → Agent 7 (JD Cleaning) ONLY
  flash      → Agent 15 Weekly Calibration

Gemini is the FALLBACK for non-critical tasks only.
NEVER use Gemini for tasks assigned to Sarvam-M.
API key from Doppler: GEMINI_API_KEY.
"""

import os
import httpx
import logging
from typing import Literal

logger = logging.getLogger("gemini")

GeminiMode = Literal["flash", "flash_lite"]

_MODEL_MAP = {
    "flash":      "gemini-2.0-flash",
    "flash_lite": "gemini-2.0-flash-lite",
}

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiClient:
    @property
    def _api_key(self) -> str:
        """Lazy — read at call time so missing key doesn't crash at import."""
        key = os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise RuntimeError("GEMINI_API_KEY not set in Doppler environment")
        return key

    async def complete(self, prompt: str, mode: GeminiMode) -> str:
        """
        Send a generateContent request to Gemini.
        Raises RuntimeError on network failure or non-2xx response.
        """
        model = _MODEL_MAP[mode]
        url   = f"{_GEMINI_BASE}/{model}:generateContent?key={self._api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048},
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return (
                    data["candidates"][0]["content"]["parts"][0]["text"].strip()
                )
        except Exception as exc:
            raise RuntimeError(f"Gemini {mode} failed: {exc}") from exc


# Singleton
gemini = GeminiClient()
