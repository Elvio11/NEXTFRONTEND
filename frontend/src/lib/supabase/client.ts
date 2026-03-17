import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Returns a singleton Supabase browser client.
 * Safe to call at module level — uses empty strings as fallback at build time.
 * Real URLs are always present at runtime (Vercel / local dev env vars).
 */
export function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback to dummy values during build-time prerendering if env vars are missing
    if (!client) {
        client = createBrowserClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder'
        )
    }
    return client
}
