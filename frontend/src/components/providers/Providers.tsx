'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

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
    const setUser = useAuthStore((s) => s.setUser)
    const setSession = useAuthStore((s) => s.setSession)
    const setInitialized = useAuthStore((s) => s.setInitialized)

    useEffect(() => {
        const supabase = getSupabaseClient()

        // 1. Hydrate immediately from any existing cookie/localStorage session
        supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
            setSession(data.session)
            setUser(data.session?.user ?? null)
            setInitialized(true)
        }).catch(() => {
            setInitialized(true)
        })

        // 2. Keep in sync with auth state changes (PKCE code exchange, sign out, etc.)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run once on mount — setters are stable Zustand references

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}
