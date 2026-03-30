'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const LIVE_SIGNALS = [
  'Sankhya scanned LinkedIn (India)',
  'Shilpakaar tailored for 12y exp role',
  'Setu resolving Indeed captcha',
  'New JD: Staff SE @ Google India',
  'Guru sending WhatsApp coaching',
  'Foundit: 1,200 New Internships',
  'Sankhya filtering FitScore > 85%',
  'Shilpakaar optimizing Cloud keywords',
  'Talvix Swarm: 1.2M jobs indexed today'
]

const STATS = [
  { label: 'JOBS INDEXED', value: 124850, suffix: '+', sub: 'Global pool', color: 'text-blue-600' },
  { label: 'APPS SUBMITTED', value: 1422, suffix: '', sub: 'Success: 94%', color: 'text-violet-600' },
  { label: 'HOURS SAVED', value: 355, suffix: 'h', sub: 'Total productivity', color: 'text-emerald-600' }
]

export const SwarmStats = () => {
  const [counts, setCounts] = useState(STATS.map(s => s.value - 10))
  const [signalIdx, setSignalIdx] = useState(0)
  const [pulseIndices, setPulseIndices] = useState<number[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const timer = setInterval(() => {
      setCounts(prev => prev.map((c, i) => {
        if (i === 0) return c + Math.floor(Math.random() * 3) // Many jobs
        if (Math.random() > 0.95) return c + 1 // Occasional applications/hours
        return c
      }))
      setSignalIdx(prev => (prev + 1) % LIVE_SIGNALS.length)
      // Randomly pulse a stat
      setPulseIndices([Math.floor(Math.random() * 3)])
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Big Stats */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="relative p-8 rounded-3xl bg-bg-base/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all group overflow-hidden backdrop-blur-md">
                {/* Active Pulse Glow */}
                <AnimatePresence>
                  {pulseIndices.includes(i) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute inset-0 ${stat.color.replace('text', 'bg')}`}
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">{stat.label}</span>
                    {pulseIndices.includes(i) && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}
                      />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${stat.color}`}>
                      {isMounted ? counts[i].toLocaleString() : stat.value.toLocaleString('en-US')}
                    </h3>
                    <span className="text-xl font-bold text-slate-300">{stat.suffix}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Live Signal Feed */}
          <div className="lg:col-span-4 h-full">
            <div className="p-6 rounded-3xl bg-slate-900 shadow-2xl relative overflow-hidden h-full min-h-[220px] flex flex-col justify-between border border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 text-slate-400">Network Pulse</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500">v4.2.0-STABLE</span>
                </div>

                <div className="relative h-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={signalIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs font-mono text-emerald-400 flex items-center gap-3"
                    >
                      <span className="text-white/20">»</span>
                      {LIVE_SIGNALS[signalIdx]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Pool Visualization - Micro Dots */}
              <div className="grid grid-cols-12 gap-1 pt-4 border-t border-white/5">
                {[...Array(36)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      opacity: Math.random() > 0.9 ? [0.1, 0.8, 0.1] : 0.1,
                      backgroundColor: Math.random() > 0.95 ? '#3b82f6' : '#94a3b8'
                    }}
                    transition={{ duration: 1 + Math.random() * 2, repeat: Infinity }}
                    className="w-1 h-1 rounded-full bg-slate-700"
                  />
                ))}
                <div className="col-span-12 mt-2">
                  <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <span>Pool Scan Status</span>
                    <span className="text-blue-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
