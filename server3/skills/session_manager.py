"""
skills/session_manager.py
AES-256-CBC encrypt/decrypt for LinkedIn session cookies.

Session cookies are stored in the DB as base64-encoded AES-256-CBC ciphertext.
The same SESSION_KEY used by Server 1 (aes.js Vault) is used here.

CRITICAL SECURITY RULES:
  1. Never log session_encrypted, decrypted dict, or individual cookie values
  2. Caller MUST del the result immediately after injecting into the browser:
         session = decrypt_session(encrypted_b64)
         driver.add_cookie(session)
         del session   # ← mandatory
  3. SESSION_KEY from Doppler only — never hardcoded, never in .env
  4. IV is prepended to the ciphertext (first 16 bytes) — same as Server 1 format
"""

import os
import base64
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


def _get_key() -> bytes:
    """
    Read SESSION_KEY from Doppler env at call time (lazy — never at import).
    Key must be exactly 32 bytes (256-bit). Hex-encoded 64-char string expected.
    """
    raw = os.environ["SESSION_KEY"]
    try:
        key_bytes = bytes.fromhex(raw)
        if len(key_bytes) != 32:
            raise ValueError("SESSION_KEY must be exactly 32 bytes (64 hex chars)")
        return key_bytes
    except ValueError as exc:
        raise RuntimeError(f"Invalid SESSION_KEY format: {exc}") from exc


def decrypt_session(session_encrypted: str) -> dict:
    """
    Decrypt a base64-encoded AES-256-CBC ciphertext (IV prepended) into a dict.
    The returned dict contains the browser cookies for the LinkedIn session.

    CRITICAL: Del the returned dict immediately after injecting into driver.
    CRITICAL: Never log the return value or its contents.
    """
    raw      = base64.b64decode(session_encrypted)
    iv       = raw[:16]
    ciphertext = raw[16:]
    key      = _get_key()

    cipher  = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded  = decryptor.update(ciphertext) + decryptor.finalize()

    # Remove PKCS7 padding
    pad_len = padded[-1]
    plaintext = padded[:-pad_len]

    return json.loads(plaintext.decode("utf-8"))


def encrypt_session(session_data: dict) -> str:
    """
    Encrypt a session cookie dict back to base64-encoded AES-256-CBC ciphertext.
    Generates a fresh random IV on each call. IV is prepended to ciphertext.
    Used when re-saving a refreshed session back to DB after use.

    CRITICAL: Never log session_data or the return value.
    """
    import os as _os  # local import to avoid confusion
    key       = _get_key()
    iv        = _os.urandom(16)
    plaintext = json.dumps(session_data, separators=(",", ":")).encode("utf-8")

    # PKCS7 padding
    pad_len  = 16 - (len(plaintext) % 16)
    padded   = plaintext + bytes([pad_len] * pad_len)

    cipher    = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    return base64.b64encode(iv + ciphertext).decode("utf-8")
