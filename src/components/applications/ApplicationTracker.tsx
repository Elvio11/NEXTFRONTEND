'use client'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { formatDate } from '@/lib/utils'
import type { JobApplication } from '@/types/job'
import { ApplicationRow } from './ApplicationRow'

export function ApplicationTracker() {
    const { user } = useAuthStore()
    const supabase = getSupabaseClient()

    const { data: applications, isLoading } = useQuery<JobApplication[]>({
        queryKey: ['applications', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_applications')
                .select('job_id, status, apply_tier, applied_at, jobs(title, company)')
                .eq('user_id', user!.id)
                .order('applied_at', { ascending: false })
            if (error) throw error
            return (data ?? []) as unknown as JobApplication[]
        },
    })

    if (isLoading) {
        return (
            <GlassCard className="p-6 animate-pulse">
                <div className="h-4 bg-[rgba(255,255,255,0.08)] rounded w-1/3 mb-4" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-[rgba(255,255,255,0.04)] rounded mb-3" />
                ))}
            </GlassCard>
        )
    }

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#f1f5f9]">Applications</h2>
                <span className="text-xs text-[#64748b]">{applications?.length ?? 0} total</span>
            </div>

            {!applications?.length ? (
                <p className="text-[#64748b] text-sm text-center py-8">
                    No applications yet. Jobs are auto-applied at 8 PM IST.
                </p>
            ) : (
                <div className="space-y-2">
                    {applications.map((app) => (
                        <ApplicationRow key={app.job_id} application={app} />
                    ))}
                </div>
            )}
        </GlassCard>
    )
}

// Re-export for convenience
export { formatDate }
