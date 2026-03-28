'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, ShieldCheck, Zap, ArrowUpRight, BarChart3, Globe, Briefcase } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ScoreMeter } from '@/components/ui/ScoreMeter'

interface JobDetailProps {
  isOpen: boolean
  onClose: () => void
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
    description?: string
    skills?: string[]
    salary?: string
  } | null
}

export function JobDetail({ isOpen, onClose, job }: JobDetailProps) {
  if (!job) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Slide-over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#050505] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Briefcase className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">{job.title}</h2>
                   <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">{job.company}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-content-subtle hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
               {/* Hero Stats */}
               <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                     <ScoreMeter score={job.fit_score} size={100} strokeWidth={8} label="Match" />
                     <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Calculated by Sankhya</p>
                  </GlassCard>
                  <div className="space-y-4">
                     <GlassCard className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <MapPin className="w-4 h-4 text-content-muted" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">{job.location}</span>
                        </div>
                     </GlassCard>
                     <GlassCard className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Globe className="w-4 h-4 text-content-muted" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">{job.platform}</span>
                        </div>
                     </GlassCard>
                     <GlassCard className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-green-400">
                           <BarChart3 className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{job.salary || 'Competitive'}</span>
                        </div>
                     </GlassCard>
                  </div>
               </div>

               {/* Agent Insight */}
               <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-3 mb-4">
                     <Zap className="w-5 h-5 text-blue-400" />
                     <h3 className="text-sm font-black italic tracking-tighter text-white uppercase">Sankhya Protocol Insight</h3>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                     "This opportunity is a <span className="text-white font-bold">Strong Tactical Match</span>. Your background in React matches 98% of the technical requirements. Shilpakaar has already drafted a version of your resume that emphasizes the required GraphQL expertise."
                  </p>
               </div>

               {/* Description */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted">Opportunity Brief</h3>
                  <div className="text-sm text-content-subtle leading-relaxed whitespace-pre-wrap">
                     {job.description || "The intelligence swarm is currently decompressing the full job description. Standard requirements include expertise in modern software patterns, collaborative cycles, and high-performance delivery."}
                  </div>
               </div>

               {/* Skills */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted">Required Signals</h3>
                  <div className="flex flex-wrap gap-2">
                     {(job.skills || ['React', 'Next.js', 'TypeScript', 'Node.js', 'GraphQL', 'Tailwind']).map((skill) => (
                        <div key={skill} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-white">
                           {skill}
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col gap-4">
               <Button className="w-full h-14 text-sm shadow-glow-blue" onClick={() => {}}>
                  {job.tier === 1 ? 'Execute Auto-Apply Protocol' : 'Dispatch Redirect to Application'}
                  <ArrowUpRight className="ml-2 w-5 h-5" />
               </Button>
               <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-content-subtle" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">
                     Verification by Setu • 100% Secure
                  </span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
