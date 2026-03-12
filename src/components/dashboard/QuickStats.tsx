'use client'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Briefcase, Send, Phone } from 'lucide-react'

export function QuickStats() {
    const { user } = useAuthStore()
    const supabase = getSupabaseClient()

    const { data: applications } = useQuery({
        queryKey: ['applications-count', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('job_applications')
                .select('status')
                .eq('user_id', user!.id)
            return data ?? []
        },
    })

    const { data: jobCount } = useQuery({
        queryKey: ['job-count', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { count } = await supabase
                .from('job_fit_scores')
                .select('job_id', { count: 'exact', head: true })
                .eq('user_id', user!.id)
            return count ?? 0
        },
    })

    const applied = applications?.length ?? 0
    const callbacks =
        applications?.filter((a: { status: string }) => a.status === 'callback').length ?? 0

    const stats = [
        { label: 'Jobs Analysed', value: jobCount ?? 0, icon: Briefcase, color: '#3b82f6' },
        { label: 'Applied', value: applied, icon: Send, color: '#8b5cf6' },
        { label: 'Callbacks', value: callbacks, icon: Phone, color: '#22c55e' },
    ]

    return (
        <div className="flex flex-col gap-3 h-full">
            {stats.map(({ label, value, icon: Icon, color }) => (
                <GlassCard key={label} className="p-4 flex-1 flex items-center gap-4">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}20` }}
                    >
                        <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[#f1f5f9]">{value}</p>
                        <p className="text-xs text-[#64748b]">{label}</p>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}
