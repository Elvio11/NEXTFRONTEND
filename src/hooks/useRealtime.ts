'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useDashboardStore } from '@/stores/dashboardStore'

export function useRealtime(userId: string | undefined) {
    const queryClient = useQueryClient()
    const { setReady } = useDashboardStore()
    const supabase = getSupabaseClient()

    useEffect(() => {
        if (!userId) return

        // Channel 1: dashboard ready
        const dashboardChannel = supabase
            .channel('dashboard-ready')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`,
                },
                (payload: { new: Record<string, unknown> }) => {
                    if (
                        (payload.new as { dashboard_ready: boolean }).dashboard_ready
                    ) {
                        setReady(true)
                        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                    }
                }
            )
            .subscribe()

        // Channel 2: new fit scores
        const scoresChannel = supabase
            .channel('new-fit-scores')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'job_fit_scores',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    void queryClient.invalidateQueries({ queryKey: ['jobs', userId] })
                }
            )
            .subscribe()

        // Channel 3: application updates
        const appsChannel = supabase
            .channel('application-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'job_applications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    void queryClient.invalidateQueries({
                        queryKey: ['applications', userId],
                    })
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(dashboardChannel)
            void supabase.removeChannel(scoresChannel)
            void supabase.removeChannel(appsChannel)
        }
    }, [userId, queryClient, setReady, supabase])
}
