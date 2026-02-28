"""
db/client.py
Supabase client for Server 2.

Uses SUPABASE_SERVICE_KEY (Doppler key name) — agents bypass RLS for cross-user writes.
This is the ONLY place the client is initialised.
Import `supabase` everywhere else — never call create_client() again.

All secrets from Doppler via os.environ. No .env files. No defaults.
"""

import os
from supabase import create_client, Client

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],  # Doppler key: SUPABASE_SERVICE_KEY
)
