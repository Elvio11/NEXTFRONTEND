/**
 * supabaseClient.js
 * Shared Supabase JS client for Server 1.
 * Uses SUPABASE_ANON_KEY ONLY — never service_role.
 * Server 1 reads data as the authenticated user via RLS.
 *
 * CRITICAL: SUPABASE_SERVICE_ROLE_KEY must never appear in any
 * Server 1 source file. It lives exclusively on Servers 2 and 3.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY  // anon key — RLS enforced, auth.uid() scoped
);

module.exports = supabase;
