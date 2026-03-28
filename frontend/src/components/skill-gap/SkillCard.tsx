'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { TrendingUp, Sparkles, Target, Zap } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { cn } from '@/lib/utils'
import type { SkillGap } from '@/types/agent'

interface SkillCardProps {
  gap: SkillGap
  rank: number
}

export function SkillCard({ gap, rank }: SkillCardProps) {
  const { studentMode } = useDashboardStore()
  
  return (
    <GlassCard hover className="group p-5 bg-white/[0.01] border-white/5 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden">
      {/* Background Pulse */}
      <div className={cn(
        "absolute -right-16 -top-16 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-700",
        studentMode ? "bg-accent-violet" : "bg-accent-blue"
      )} />

      <div className="flex items-center gap-5 relative z-10">
        {/* Rank Badge */}
        <div className={cn(
          "w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-black italic transition-all duration-300",
          studentMode 
            ? "bg-accent-violet/10 border-accent-violet/20 text-accent-violet" 
            : "bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
        )}>
          #{rank}
        </div>

        {/* Skill Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight grow truncate uppercase">
              {gap.skill}
            </h3>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              <Sparkles className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Critical</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-content-muted uppercase tracking-widest opacity-80">
            <div className="flex items-center gap-1.25">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>ROI: {gap.roi_score}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="flex items-center gap-1.25">
              <Target className="w-3 h-3 text-blue-400" />
              <span>Demand Rank #{gap.frequency_rank}</span>
            </div>
          </div>
        </div>

        {/* ROI Progress */}
        <div className="hidden sm:flex flex-col items-end gap-2 text-right">
          <p className="text-[9px] font-black uppercase tracking-tighter text-content-subtle">Market Orbit</p>
          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(gap.roi_score, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                studentMode ? "bg-accent-violet shadow-glow-violet" : "bg-accent-blue shadow-glow-blue"
              )}
            />
          </div>
        </div>

        <Zap className="w-4 h-4 text-content-subtle opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0" />
      </div>
    </GlassCard>
  )
}
