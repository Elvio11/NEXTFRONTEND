"""
llm/gemini.py
Gemini async HTTP client for Server 3.

Usage on this server:
  flash      → Agent 11 (Cover Letter generation)
  flash_lite → stub (not used Server 3 — included for completeness)

Gemini is used ONLY for tasks explicitly assigned to it.
NEVER use Gemini as a fallback for Sarvam-M operations.
API key from Doppler: GEMINI_API_KEY.
"""

import os
import httpx
from typing import Literal

GeminiMode = Literal["flash", "flash_lite"]

_MODEL_MAP = {
    "flash":      "gemini-1.5-flash",
    "flash_lite": "gemini-1.5-flash-8b",
}

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiClient:
    @property
    def _api_key(self) -> str:
        """Lazy — read at call time so missing key doesn't crash at import."""
        return os.environ.get("GEMINI_API_KEY", "")

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
