'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function useDashboardStats() {
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null

      const [scoresResult, appliesResult] = await Promise.all([
        supabase
          .from('job_fit_scores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0])
      ])

      return {
        jobsScored: scoresResult.count || 0,
        dailyApplies: appliesResult.count || 0,
        swarmHealth: 98, // Mocked for now, integrate with agent_logs in Phase 7
        lastSync: new Date().toISOString()
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Sync every 30s
  })
}
