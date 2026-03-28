'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { GlassCard } from '@/components/ui/GlassCard'
import { SkillCard } from './SkillCard'
import { useDashboardStore } from '@/stores/dashboardStore'
import type { SkillGapResult } from '@/types/agent'
import { TrendingUp, Lock, Brain, Sparkles, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SkillGapPanel() {
    const { user } = useAuthStore()
    const { studentMode } = useDashboardStore()
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
            return data as any
        },
    })

    return (
        <div className="space-y-6">
            {/* Growth Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl border",
                    studentMode ? "bg-accent-violet/10 border-accent-violet/20" : "bg-accent-blue/10 border-accent-blue/20"
                  )}>
                    <TrendingUp className={cn("w-5 h-5", studentMode ? "text-accent-violet" : "text-accent-blue")} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Intelligence Growth</h2>
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                       Kaushal's Analysis — {data?.top_gaps?.length ?? 0} Skill Gaps Mapped
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   {!isPaid && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-content-subtle">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Analysis Locked</span>
                      </div>
                   )}
                   <div className="h-6 w-px bg-white/10" />
                   <div className={cn(
                     "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
                     studentMode ? "bg-accent-violet/10 border-accent-violet/20 text-accent-violet" : "bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
                   )}>
                      <Brain className="w-3.5 h-3.5" />
                      <span>Kaushal Active</span>
                   </div>
                </div>
            </div>

            {/* Analysis Grid */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : !data?.top_gaps?.length ? (
                <div className="py-24 text-center space-y-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
                    <div className="p-5 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto">
                      <Zap className="w-8 h-8 text-content-subtle opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-black uppercase tracking-widest text-xs">Analyzing Your Trajectory</p>
                      <p className="text-content-muted font-mono text-[10px] tracking-tight text-balance">
                         Kaushal is currently mapping your skills against current market demand.<br />
                         Your first intelligence report will be ready in 15 minutes.
                      </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {data.top_gaps.map((gap, i) => (
                        <SkillCard key={gap.skill} gap={gap} rank={i + 1} />
                    ))}
                    
                    {/* Growth CTA */}
                    <GlassCard className="p-6 bg-gradient-to-br from-accent-blue/5 to-accent-violet/5 border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-500/10 border border-orange-500/20">
                          <Sparkles className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-white">Full Swarm Intelligence</p>
                          <p className="text-[10px] text-content-subtle mt-1 font-mono tracking-tight">Unlock Guru's personalized roadmap based on these gaps.</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 group/btn">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Upgrade Now</span>
                        <ChevronRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </GlassCard>
                </div>
            )}
        </div>
    )
}
