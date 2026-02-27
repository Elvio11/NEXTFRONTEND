'use client'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { TalvixUser } from '@/types/user'

export function useAuth() {
    const { user, session, profile, permissionState, setProfile } = useAuthStore()
    const supabase = getSupabaseClient()

    const { data, isLoading } = useQuery<TalvixUser | null>({
        queryKey: ['user-profile', user?.id],
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select(
                    'id, subscription_tier, wa_connected, onboarding_complete, persona, dashboard_ready'
                )
                .eq('id', user!.id)
                .single()
            if (error) throw error
            return data as TalvixUser
        },
    })

    useEffect(() => {
        if (data) setProfile(data)
    }, [data, setProfile])

    return { user, session, profile, permissionState, isLoading }
}
