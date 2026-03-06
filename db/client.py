"""
db/client.py
Supabase client for Server 2.

Uses SUPABASE_SERVICE_KEY (Doppler key name) — agents bypass RLS for cross-user writes.
This is the ONLY place the client is initialised.
Call get_supabase() everywhere else — never call create_client() again.

All secrets from Doppler via os.environ. No .env files. No defaults.
Lazy initialisation: client is created on first call, not at import time.
This prevents startup crashes when env vars are not yet injected.
"""

import os
from supabase import create_client, Client

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """
    Return the Supabase singleton client.
    Created on first call — safe to import without env vars present at module load.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],  # Doppler key: SUPABASE_SERVICE_KEY
        )
    return _supabase_client
