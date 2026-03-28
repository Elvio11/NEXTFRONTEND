'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Activity, Terminal, Brain, Search, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_ACTIVITIES = [
  { agent: 'Sankhya', action: 'Scoring 243 new jobs in Bangalore...', icon: Brain, color: 'text-violet-400' },
  { agent: 'Anveshan', action: 'Scraped 42 new listings from Indeed.', icon: Search, color: 'text-blue-400' },
  { agent: 'Parichay', action: 'Updating resume intelligence profile...', icon: Activity, color: 'text-blue-500' },
  { agent: 'Setu', action: 'Successfully applied to Google (SWE Intern).', icon: CheckCircle2, color: 'text-green-400' },
  { agent: 'Shilpakaar', action: 'Tailoring resume for Microsoft role.', icon: Zap, color: 'text-orange-400' },
  { agent: 'Guru', action: 'Synthesizing daily career advice...', icon: AlertCircle, color: 'text-yellow-400' },
  { agent: 'Vacha', action: 'Recalibrating form answers for LinkedIn...', icon: Activity, color: 'text-blue-300' },
]

export const LivePulseFeed = () => {
  const [logs, setLogs] = useState<typeof AGENT_ACTIVITIES>([])

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
    <GlassCard className="h-full flex flex-col overflow-hidden border-white/5 bg-white/[0.01]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
            Live Swarm Pulse
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-mono text-green-500/80 font-bold">Synchronized</span>
        </div>
      </div>

      <div className="flex-grow p-4 space-y-3 overflow-y-auto font-mono text-[11px] leading-relaxed">
        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.div
              key={`${log.agent}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5"
            >
              <div className={cn("mt-0.5", log.color)}>
                <log.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn("font-bold text-[10px]", log.color)}>
                    {log.agent}
                  </span>
                  <span className="text-[9px] text-content-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-content-muted">
                  {log.action}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-content-subtle">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>Monitoring 15 agents in real-time...</span>
        </div>
      </div>
    </GlassCard>
  )
}
