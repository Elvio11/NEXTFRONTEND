'use client'

import React from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { ScoreMeter } from '@/components/ui/ScoreMeter'
import { Building2, MapPin, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    type: string
    fit_score: number
    posted_at: string
    platform: string
    tier: number
  }
}

export function JobCard({ job }: JobCardProps) {
  return (
    <GlassCard className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all group overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <ScoreMeter score={job.fit_score} size={90} strokeWidth={6} label="Match" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <Badge variant={job.tier === 1 ? 'primary' : 'glass'}>
                  {job.tier === 1 ? 'Tier 1 Auto-Apply' : 'Tier 2 One-Click'}
                </Badge>
                <div className="flex items-center gap-1 opacity-50">
                  <Clock className="w-3 h-3 text-content-subtle" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-content-subtle">{job.posted_at}</span>
                </div>
             </div>
             <h3 className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-blue-400 transition-colors leading-tight">
               {job.title}
             </h3>
             <div className="flex items-center justify-center md:justify-start gap-4 text-content-muted">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{job.company}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">{job.location}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {['React', 'TypeScript', 'Node.js'].map(tag => (
              <span key={tag} className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-content-subtle">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-auto">
          <button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-glow-blue flex items-center justify-center gap-3 active:scale-[0.98] group/btn">
            {job.tier === 1 ? 'Dispatch Setu' : 'Review Match'}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center justify-center gap-2 opacity-50">
             <ShieldCheck className="w-3 h-3 text-green-500" />
             <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Sankhya Verified Match</span>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/[0.03] rounded-full blur-[40px] group-hover:bg-blue-500/10 transition-all duration-700" />
    </GlassCard>
  )
}
