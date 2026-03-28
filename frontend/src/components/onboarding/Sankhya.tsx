'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { CheckCircle2, AlertCircle, ShieldCheck, User, Target, Briefcase, Zap, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SankhyaProps {
  data: {
    persona: string
    roles: string[]
    identity: string
    prefs: any
  }
  onComplete: () => void
}

export function Sankhya({ data, onComplete }: SankhyaProps) {
  return (
    <GlassCard className="p-8 max-w-3xl mx-auto border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 shadow-glow-green/5">
          <ShieldCheck className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 06: Sankhya Verification</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Final Talent Audit — Swarm Activation Protocol
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Section: Persona */}
           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-content-subtle">
                <User className="w-3.5 h-3.5" />
                <span>Persona</span>
              </div>
              <p className="text-sm font-black text-white italic tracking-tight">{data.persona}</p>
           </div>

           {/* Section: Identity */}
           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-content-subtle">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Identity</span>
              </div>
              <p className="text-sm font-black text-white italic tracking-tight uppercase tracking-widest">{data.identity}</p>
           </div>

           {/* Section: Roles */}
           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-content-subtle">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                <span>Target Nishana</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.roles.map(r => (
                  <span key={r} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/70">{r}</span>
                ))}
              </div>
           </div>

           {/* Section: Preferences */}
           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-content-subtle">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Environmental Model</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <IndianRupee className="w-3 h-3" />
                  <span className="text-[10px] font-black tracking-widest">{data.prefs.salary} LPA Floor</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-white uppercase tracking-tighter">
                <span className="text-blue-400 italic">Work Mode: {data.prefs.workMode}</span>
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <span>Locations: {data.prefs.locations.join(', ')}</span>
              </div>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
           <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
           <p className="text-[10px] font-bold text-content-muted leading-relaxed uppercase tracking-tight">
             Sankhya has analyzed these coordinates. The swarm success probability is estimated at <span className="text-white">94%</span> for current market conditions. Use 'The Vault' next to link platform sessions for Tier 1 auto-deployment.
           </p>
        </div>

        <div className="pt-6">
          <button
            onClick={onComplete}
            className="w-full py-4 rounded-3xl bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-green transition-all active:scale-[0.98]"
          >
            Initiate Final Verification
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
