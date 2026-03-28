'use client'

import React from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    label: string
    value: string | number
    trend?: { value: string; type: 'up' | 'down' }
    icon?: React.ElementType
}

export function StatCard({ label, value, trend, icon: Icon = Activity }: StatCardProps) {
    return (
        <GlassCard className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10 group-hover:bg-blue-500/10 transition-all duration-700" />
            
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-content-subtle group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                        trend.type === 'up' ? "text-green-500" : "text-red-500"
                    )}>
                        {trend.type === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{trend.value}</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">{label}</p>
                <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">{value}</h3>
            </div>
        </GlassCard>
    )
}
