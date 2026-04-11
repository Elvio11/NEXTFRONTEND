'use client'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import type { CareerIntelligence } from '@/types/agent'

export function CareerScoreCard() {
    const { user } = useAuthStore()
    const supabase = getSupabaseClient()

    const { data } = useQuery<CareerIntelligence | null>({
        queryKey: ['career-intel', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('career_intelligence')
                .select('score_components, updated_at')
                .eq('user_id', user!.id)
                .single()
            if (error) return null
            return data as CareerIntelligence
        },
    })

    const radarData = data?.score_components
        ? [
            { subject: 'Skills', value: data.score_components.skills },
            { subject: 'Exp', value: data.score_components.experience },
            { subject: 'Demand', value: data.score_components.demand },
            { subject: 'Salary', value: data.score_components.salary },
        ]
        : [
            { subject: 'Skills', value: 60 },
            { subject: 'Exp', value: 70 },
            { subject: 'Demand', value: 55 },
            { subject: 'Salary', value: 65 },
        ]

    const totalScore = data?.score_components
        ? Math.round(
            (data.score_components.skills * 0.3 +
                data.score_components.experience * 0.25 +
                data.score_components.demand * 0.25 +
                data.score_components.salary * 0.2)
        )
        : null

    return (
        <GlassCard glow="violet" className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#f1f5f9] text-sm">Career Score</h2>
                {totalScore !== null && (
                    <span className="text-2xl font-extrabold text-[#8b5cf6]">
                        {totalScore}
                        <span className="text-sm font-normal text-[#64748b]">/100</span>
                    </span>
                )}
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Radar
                        name="Career"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="rgba(139,92,246,0.15)"
                    />
                </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#334155] text-center mt-1">
                Skills 30% · Experience 25% · Demand 25% · Salary 20%
            </p>
        </GlassCard>
    )
}
