'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { UserCircle, Sparkles, Brain, Code, Terminal, CheckCircle2, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface IdentityProps {
  detectedPersona: string | null
  onComplete: (identity: string) => void
}

const IDENTITY_OPTIONS = [
  { 
    id: 'expert', 
    label: 'The Architect', 
    icon: Brain, 
    desc: 'Focus on System Design, Backend Reliability, and Leadership.',
    color: 'blue',
    insight: 'architectural depth and backend structural integrity'
  },
  { 
    id: 'builder', 
    label: 'The Craftsperson', 
    icon: Terminal, 
    desc: 'Rapid Prototyping, Frontend Excellence, and Product Velocity.',
    color: 'violet',
    insight: 'pixel-perfect precision, product velocity, and frontend excellence'
  },
  { 
    id: 'generalist', 
    label: 'The Swiss Knife', 
    icon: Code, 
    desc: 'Full-stack Versatility, Data Engineering, and Adaptability.',
    color: 'orange',
    insight: 'agile full-stack versatility and rapid cross-domain adaptability'
  }
]

export function Identity({ detectedPersona, onComplete }: IdentityProps) {
  const [selectedId, setSelectedId] = useState<string>('expert')

  return (
    <GlassCard className="p-8 max-w-3xl mx-auto border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-glow-violet/5">
          <Sparkles className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 04: Identity Protocol</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Parichay has mapped your talent. Choose your AI Identity.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          {IDENTITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedId(opt.id)}
              className={cn(
                "flex-1 p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden group text-left",
                selectedId === opt.id 
                  ? "bg-white/[0.04] border-violet-500/50 shadow-glow-violet/10 ring-1 ring-violet-500/20" 
                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500",
                selectedId === opt.id ? "bg-violet-500 text-white" : "bg-white/5 text-content-subtle"
              )}>
                <opt.icon className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-violet-400 transition-colors">{opt.label}</p>
                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-relaxed">
                  {opt.desc}
                </p>
              </div>

              {selectedId === opt.id && (
                <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-4 h-4 text-violet-500" />
                </div>
              )}
              
              {selectedId === opt.id && (
                <motion.div 
                   layoutId="identity-highlight"
                   className="absolute inset-0 bg-violet-500/[0.03] blur-2xl -z-10"
                />
              )}
            </button>
          ))}
        </div>

        <GlassCard className="p-6 bg-violet-500/5 border-violet-500/10">
          <div className="flex items-start gap-4">
            <Award className="w-5 h-5 text-violet-400 mt-1" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Swarm Insight</p>
              <p className="text-[10px] font-bold text-content-muted uppercase tracking-tighter mt-1 leading-relaxed">
                Selecting "{IDENTITY_OPTIONS.find(o => o.id === selectedId)?.label}" will calibrate Shilpakaar (Resume Tailor) to prioritize {IDENTITY_OPTIONS.find(o => o.id === selectedId)?.insight} in every application.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="pt-4">
          <button
            onClick={() => onComplete(selectedId)}
            className="w-full py-4 rounded-3xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-violet transition-all active:scale-[0.98]"
          >
            Confirm Identity Protocol
          </button>
          <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
            <UserCircle className="w-3 h-3 text-content-subtle" />
            <span className="text-[8px] font-bold text-content-subtle uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
              Aero-V3 Talent ID: {detectedPersona?.slice(0, 30)}...
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
