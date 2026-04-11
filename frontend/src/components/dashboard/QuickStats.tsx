'use client'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard'
import { cn } from '@/lib/utils'
import { Send, Activity, Waves } from 'lucide-react'

export function QuickStats() {
    const { data: stats, isLoading } = useDashboardStats()

    const statItems = [
        { label: 'Deployed Today', value: isLoading ? '...' : `${stats?.dailyApplies}/10`, icon: Send, theme: 'highlight' },
        { label: 'Swarm Pulse', value: isLoading ? '...' : `${stats?.swarmHealth}%`, icon: Waves, theme: 'success' },
        { label: 'Uplink Delay', value: '42ms', icon: Activity, theme: 'neutral' },
    ]

    return (
        <div className="flex flex-col gap-4 h-full">
            {statItems.map(({ label, value, icon: Icon, theme }) => (
                <LiquidGlassCard key={label} hoverable className="flex-1 flex items-center gap-5 !p-0">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border",
                        theme === 'highlight' && "bg-accent/10 border-accent/20 text-accent",
                        theme === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                        theme === 'neutral' && "bg-white/5 border-white/10 text-content-subtle"
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-black italic tracking-tighter text-white uppercase">{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-content-muted">{label}</p>
                    </div>
                </LiquidGlassCard>
            ))}
        </div>
    )
}
