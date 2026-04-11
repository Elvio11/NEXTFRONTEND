'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard'
import { Activity, Terminal, Brain, Search, Zap, CheckCircle2, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_ACTIVITIES = [
    { agent: 'Sankhya', action: 'Scoring 243 jobs in Bangalore...', icon: Brain, status: 'thinking' },
    { agent: 'Anveshan', action: 'Direct MCP Ingestion (JobSpy)...', icon: Search, status: 'active' },
    { agent: 'Setu', action: 'Deploying Smart-Apply (Google)...', icon: CheckCircle2, status: 'success' },
    { agent: 'Shilpakaar', action: 'Tailoring Resume (Microsoft)...', icon: Zap, status: 'active' },
    { agent: 'Vacha', action: 'Recalibrating Form Q&A...', icon: Activity, status: 'thinking' },
] as const

export const LivePulseFeed = () => {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // Initial logs
    setLogs(AGENT_ACTIVITIES.slice(0, 4))

    const interval = setInterval(() => {
      const randomActivity = AGENT_ACTIVITIES[Math.floor(Math.random() * AGENT_ACTIVITIES.length)]
      const timestampedActivity = { ...randomActivity, timestamp: new Date().toLocaleTimeString() }
      
      setLogs(prev => [timestampedActivity, ...prev].slice(0, 6))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <LiquidGlassCard hoverable={false} className="h-full flex flex-col overflow-hidden !p-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
            Live Swarm Pulse
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Locked</span>
        </div>
      </div>

      <div className="flex-grow p-4 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.div
              layout
              key={`${log.agent}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="group flex gap-4 p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5"
            >
              <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  log.status === 'thinking' && "bg-accent/10 border-accent/20 text-accent",
                  log.status === 'active' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                  log.status === 'success' && "bg-green-500/10 border-green-500/20 text-green-400"
              )}>
                <log.icon className="w-4 h-4" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-0.5">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {log.agent}
                   </span>
                   <span className="text-[8px] font-black uppercase tracking-widest text-content-muted">
                    Active Session
                   </span>
                </div>
                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider">
                  {log.action}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-content-muted">
          <Waves className="w-3 h-3 text-accent animate-pulse" />
          <span>Syncing with Aero-V3 Network...</span>
        </div>
      </div>
    </LiquidGlassCard>
  )
}
