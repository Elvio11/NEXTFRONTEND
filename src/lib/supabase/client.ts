import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Returns a singleton Supabase browser client.
 * Safe to call at module level — uses empty strings as fallback at build time.
 * Real URLs are always present at runtime (Vercel / local dev env vars).
 */
export function getSupabaseClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
        )
    }
    return client
}
