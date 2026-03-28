'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { FitScoreMeter } from './FitScoreMeter'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { usePermissions } from '@/hooks/usePermissions'
import { OneClickApplyButton } from './OneClickApplyButton'
import type { JobFitScore } from '@/types/job'
import { MapPin, Globe, Brain, Sparkles, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobCardProps {
  job: JobFitScore
}

export function JobCard({ job }: JobCardProps) {
  const { canViewFitReasons } = usePermissions()
  const { fit_score, fit_reasons } = job
  const { title, company, location, is_remote } = job.job

  const initial = company.charAt(0).toUpperCase()

  return (
    <GlassCard hover className="group p-5 bg-white/[0.01] border-white/5 hover:bg-white/[0.02] transition-all duration-500">
      {/* Background Accent Glow */}
      <div className={cn(
        "absolute -right-20 -top-20 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none",
        fit_score >= 80 ? "bg-green-500" : "bg-blue-500"
      )} />

      <div className="relative z-10 flex flex-col gap-5">
        
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Company Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-lg font-black italic text-white shadow-glass transition-transform group-hover:scale-105 duration-300">
                {initial}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-bg-base border border-white/10">
                <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-bold text-white tracking-tight truncate leading-tight group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
              <p className="text-xs font-medium text-content-muted mt-0.5 truncate uppercase tracking-widest opacity-80">
                {company}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-content-subtle uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  {is_remote ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <MapPin className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{is_remote ? 'Global Remote' : location}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-green-500/80">Active Result</span>
              </div>
            </div>
          </div>

          {/* Scoring Visual */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
             <FitScoreMeter score={fit_score} size="md" />
             <span className="text-[9px] font-black uppercase tracking-tighter text-content-subtle italic">
               Sankhya Score
             </span>
          </div>
        </div>

        {/* Swarm Intelligence Insights Section */}
        <div className="relative">
          <div className={cn(
            "p-3.5 rounded-xl border border-white/5 bg-white/[0.02]",
            !canViewFitReasons && "blur-md select-none pointer-events-none"
          )}>
            <div className="flex items-start gap-2.5">
              <div className="p-1 px-1.5 rounded bg-blue-500/10 border border-blue-500/20 mt-0.5 flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Parichay Insight</span>
              </div>
              <p className="text-[11px] text-content-muted leading-relaxed font-mono font-medium">
                {fit_reasons || "Identifying skill alignment: Python (Expert), API Design (Strong), Cloud (Native). 4 Strengths detected."}
              </p>
            </div>
          </div>

          {!canViewFitReasons && (
            <div className="absolute inset-0 flex items-center justify-center">
              <UpgradeCTA feature="fit_reasons" compact />
            </div>
          )}
        </div>

        {/* Action Tray */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-content-subtle">
              Bridge Ready
            </span>
          </div>
          <div className="flex items-center gap-3">
             <OneClickApplyButton jobId={job.job_id} />
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
