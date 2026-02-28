'use client'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { GlassCard } from '@/components/ui/GlassCard'
import { SkillCard } from './SkillCard'
import type { SkillGapResult } from '@/types/agent'
import { TrendingUp, Lock } from 'lucide-react'

export function SkillGapPanel() {
    const { user } = useAuthStore()
    const { canViewFitReasons: isPaid } = usePermissions()
    const supabase = getSupabaseClient()

    const { data, isLoading } = useQuery<SkillGapResult | null>({
        queryKey: ['skill-gap', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('skill_gap_results')
                .select('top_gaps, updated_at')
                .eq('user_id', user!.id)
                .single()
            if (error) return null
            return data as SkillGapResult
        },
    })

    return (
        <div className="space-y-4">
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                    <h2 className="font-semibold text-[#f1f5f9]">Top Skill Gaps</h2>
                    {!isPaid && (
                        <span className="flex items-center gap-1 text-xs text-[#64748b] ml-auto">
                            <Lock className="w-3 h-3" />
                            Full report (paid)
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 bg-[rgba(255,255,255,0.04)] rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : !data?.top_gaps?.length ? (
                    <p className="text-[#64748b] text-sm text-center py-8">
                        Skill gap analysis is being prepared. Check back shortly.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {data.top_gaps.map((gap, i) => (
                            <SkillCard key={gap.skill} gap={gap} rank={i + 1} />
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    )
}
