'use client'

import { Shield, Zap, Send, MessageSquare, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusItemProps {
  label: string
  status: 'online' | 'offline' | 'warning'
  icon: any
  color: string
}

const StatusItem = ({ label, status, icon: Icon, color }: StatusItemProps) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
      <div className={cn("p-1.5 rounded-lg", color.replace('text-', 'bg-').concat('/10'))}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-content-subtle">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          )} />
          <span className="text-xs font-mono font-bold text-white uppercase">
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}

export const CommandCenterHeader = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
      <div className="space-y-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <Signal className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-mono font-black italic tracking-tighter text-white uppercase">
            Aero v3.5 Command Center
          </h2>
        </div>
        <p className="text-sm text-content-muted">
          Your personal agent swarm is actively monitoring the global job market.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <StatusItem 
          label="Swarm Health" 
          status="online" 
          icon={Shield} 
          color="text-blue-400" 
        />
        <StatusItem 
          label="Live Scraper" 
          status="online" 
          icon={Zap} 
          color="text-yellow-400" 
        />
        <StatusItem 
          label="Telegram" 
          status="online" 
          icon={Send} 
          color="text-blue-500" 
        />
        <StatusItem 
          label="WhatsApp" 
          status="warning" 
          icon={MessageSquare} 
          color="text-green-400" 
        />
      </div>
    </div>
  )
}
