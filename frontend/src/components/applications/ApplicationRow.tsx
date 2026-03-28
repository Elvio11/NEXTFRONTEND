'use client'

import React from 'react'
import type { JobApplication } from '@/types/job'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Globe, Clock, ChevronRight, Binary } from 'lucide-react'

const statusConfig: Record<string, { 
    label: string; 
    color: string; 
    bgColor: string; 
    icon: React.ElementType 
}> = {
    queued: { 
      label: 'Staged by Setu', 
      color: 'text-content-subtle', 
      bgColor: 'bg-white/5 border-white/10', 
      icon: Clock 
    },
    applying: { 
      label: 'Setu Deploying...', 
      color: 'text-accent-blue', 
      bgColor: 'bg-accent-blue/10 border-accent-blue/20 shadow-glow-blue', 
      icon: Binary 
    },
    submitted: { 
      label: 'Deployed', 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10 border-green-500/20', 
      icon: ShieldCheck 
    },
    callback: { 
      label: 'Mission Success', 
      color: 'text-accent-blue font-black', 
      bgColor: 'bg-accent-blue/20 border-accent-blue/30 shadow-glow-blue animate-pulse', 
      icon: Zap 
    },
    rejected: { 
      label: 'Aborted', 
      color: 'text-red-400', 
      bgColor: 'bg-red-500/5 border-red-500/10', 
      icon: ChevronRight 
    },
    expired: { 
      label: 'Decommissioned', 
      color: 'text-content-muted', 
      bgColor: 'bg-white/2 border-white/5 opacity-50', 
      icon: Clock 
    },
}

interface ApplicationRowProps {
    application: JobApplication
}

export function ApplicationRow({ application }: ApplicationRowProps) {
    const { status, apply_tier, applied_at, job } = application
    const config = statusConfig[status] || statusConfig.queued

    return (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="group flex items-center gap-6 px-4 py-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300"
        >
            {/* Index/Icon */}
            <div className={cn(
              "p-2.5 rounded-xl border transition-all duration-500",
              config.bgColor
            )}>
              <config.icon className={cn("w-4 h-4", config.color)} />
            </div>

            {/* Job Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate tracking-tight">{job?.title || 'Unknown Role'}</p>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-content-subtle">
                    T{apply_tier}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-bold text-content-subtle truncate uppercase tracking-widest">{job?.company || 'Unknown Corp'}</p>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1 text-[9px] text-content-muted">
                    <Globe className="w-3 h-3 text-blue-500/50" />
                    <span>Automated Deployment</span>
                  </div>
                </div>
            </div>

            {/* Status & Date */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="hidden lg:block text-right">
                  <p className="text-[9px] font-black uppercase tracking-tighter text-content-subtle">Deployment Status</p>
                  <div className={cn("inline-flex items-center gap-1.5 mt-0.5", config.color)}>
                    {status === 'applying' && <span className="h-1 w-1 rounded-full bg-current animate-ping" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                       {config.label}
                    </span>
                  </div>
                </div>

                <div className="h-4 w-px bg-white/5 hidden sm:block" />

                <div className="hidden sm:flex flex-col items-end">
                   <p className="text-[9px] font-black uppercase tracking-tighter text-content-subtle">Timestamp</p>
                   <p className="text-[10px] font-mono font-medium text-white/50 mt-0.5">
                     {formatDate(applied_at)}
                   </p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-content-subtle opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    )
}
