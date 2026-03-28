'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

// Force all pages using Providers to be dynamic (no SSG)
export const dynamic = 'force-dynamic'

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
    })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
    if (typeof window === 'undefined') return makeQueryClient()
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
}

export function Providers({ children }: { children: ReactNode }) {
    const queryClient = getQueryClient()
    const { setUser, setSession, setInitialized } = useAuthStore()

    useEffect(() => {
        // Only initialise Supabase on client — avoids build-time env-var lookup
        const supabase = getSupabaseClient()

        supabase.auth
            .getSession()
            .then(({ data }: { data: { session: Session | null } }) => {
                setSession(data.session)
                setUser(data.session?.user ?? null)
            })
            .catch(() => {/* silently ignore failed initial session fetch */ })
            .finally(() => {
                setInitialized(true)
            })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event: string, session: Session | null) => {
                setSession(session)
                setUser(session?.user ?? null)
                setInitialized(true)
            }
        )

        return () => subscription.unsubscribe()
    }, [setUser, setSession])

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}
