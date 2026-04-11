'use client'

'use client'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { ScoreMeter } from '@/components/ui/ScoreMeter'
import { Building2, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react'

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
    plan_tier?: string
  }
}

export function JobCard({ job }: JobCardProps) {
  const isExecutive = job.plan_tier === 'executive'

  return (
    <GlassCard 
      className={`p-6 transition-all group overflow-hidden relative ${
        isExecutive 
          ? 'border-amber-500/30 bg-[#050505] shadow-[0_0_50px_-12px_rgba(251,191,36,0.15)] hover:border-amber-500/60' 
          : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 shadow-none'
      }`}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <ScoreMeter 
            score={job.fit_score} 
            size={90} 
            strokeWidth={6} 
            label="Match" 
            primaryColor={isExecutive ? '#fbbf24' : undefined} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <Badge variant={isExecutive ? 'premium' : job.tier === 1 ? 'primary' : 'glass'}>
                  {isExecutive ? 'Executive Elite' : job.tier === 1 ? 'Tier 1 Auto-Apply' : 'Tier 2 One-Click'}
                </Badge>
                <div className="flex items-center gap-1 opacity-50">
                  <Clock className="w-3 h-3 text-content-subtle" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-content-subtle">{job.posted_at}</span>
                </div>
             </div>
             <h3 className={`text-xl font-black italic tracking-tighter uppercase transition-colors leading-tight ${
               isExecutive ? 'text-amber-400 group-hover:text-amber-300' : 'text-white group-hover:text-blue-400'
             }`}>
               {job.title}
             </h3>
             <div className="flex items-center justify-center md:justify-start gap-4 text-content-muted">
                <div className="flex items-center gap-1.5">
                  <Building2 className={`w-3.5 h-3.5 ${isExecutive ? 'text-amber-500/50' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{job.company}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <MapPin className={`w-3.5 h-3.5 ${isExecutive ? 'text-amber-500/50' : ''}`} />
                  <span className="text-[10px] font-medium">{job.location}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {['React', 'TypeScript', 'Node.js'].map(tag => (
              <span key={tag} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${
                isExecutive 
                  ? 'bg-amber-500/5 border border-amber-500/10 text-amber-500/60' 
                  : 'bg-white/[0.03] border border-white/5 text-content-subtle'
              }`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-auto">
          <button className={`h-12 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] group/btn ${
            isExecutive 
              ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-glow-blue'
          }`}>
            {isExecutive ? 'Secure Exclusive Call' : job.tier === 1 ? 'Dispatch Setu' : 'Review Match'}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center justify-center gap-2 opacity-50">
             <ShieldCheck className={`w-3 h-3 ${isExecutive ? 'text-amber-500' : 'text-green-500'}`} />
             <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">
               {isExecutive ? 'Platinum Priority Verified' : 'Sankhya Verified Match'}
             </span>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[40px] transition-all duration-700 ${
        isExecutive ? 'bg-amber-500/[0.05] group-hover:bg-amber-500/10' : 'bg-blue-500/[0.03] group-hover:bg-blue-500/10'
      }`} />
    </GlassCard>
  )
}
