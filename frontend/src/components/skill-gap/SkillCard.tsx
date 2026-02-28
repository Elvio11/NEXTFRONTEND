'use client'
import type { SkillGap } from '@/types/agent'
import { GlassCard } from '@/components/ui/GlassCard'

interface SkillCardProps {
    gap: SkillGap
    rank: number
}

export function SkillCard({ gap, rank }: SkillCardProps) {
    return (
        <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.15)] flex items-center justify-center text-sm font-bold text-[#3b82f6] flex-shrink-0">
                #{rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[#f1f5f9] text-sm">{gap.skill}</p>
                <p className="text-xs text-[#64748b] mt-0.5">
                    ROI score: {gap.roi_score} · Rank #{gap.frequency_rank} in market
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#3b82f6] rounded-full"
                        style={{ width: `${Math.min(gap.roi_score, 100)}%` }}
                    />
                </div>
            </div>
        </GlassCard>
    )
}
