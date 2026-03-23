"""
db/client.py
Supabase client for Server 3 (Automation Layer).

Uses SUPABASE_SERVICE_KEY (Doppler key name) — agents bypass RLS for cross-user writes.
This is the ONLY place the client is initialised.
Import `supabase` everywhere else — never call create_client() again.

All secrets from Doppler via os.environ. No .env files. No defaults.
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
        # Check for both Doppler name (SUPABASE_SERVICE_KEY) and Supabase default (SUPABASE_SERVICE_ROLE_KEY)
        service_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not service_key:
            raise KeyError("Neither SUPABASE_SERVICE_KEY nor SUPABASE_SERVICE_ROLE_KEY found in environment")
            
        _supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            service_key,
        )
    return _supabase_client
