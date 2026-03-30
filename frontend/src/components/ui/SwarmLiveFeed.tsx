'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, Sparkles, MapPin, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const JOBS = [
  { company: 'Google', role: 'Staff Software Engineer', location: 'Bangalore, India', color: 'bg-blue-500' },
  { company: 'Zomato', role: 'Sr. Product Designer', location: 'Remote, India', color: 'bg-red-500' },
  { company: 'Microsoft', role: 'Cloud Architect', location: 'Hyderabad, India', color: 'bg-cyan-500' },
  { company: 'Swiggy', role: 'Full Stack Dev', location: 'Bangalore, India', color: 'bg-orange-500' },
  { company: 'Amazon', role: 'ML Ops Lead', location: 'Global Remote', color: 'bg-yellow-500' },
  { company: 'Meta', role: 'Frontend Specialist', location: 'London, UK (Remote)', color: 'bg-blue-600' },
]

export const SwarmLiveFeed = ({ frame: manualFrame }: { frame?: number }) => {
  const [internalItems, setInternalItems] = useState(JOBS.slice(0, 4))
  const [internalActiveStep, setInternalActiveStep] = useState(0)

  // If a manual frame is provided (Remotion context), derive everything from it.
  // Otherwise, use internal state for a live preview.
  const isManual = manualFrame !== undefined
  
  // Logic for internal (live) state
  useEffect(() => {
    if (isManual) return
    const interval = setInterval(() => {
      setInternalActiveStep(prev => (prev + 1) % 4)
      if (internalActiveStep === 3) {
        setInternalItems(prev => {
          const next = [...prev]
          const removed = next.shift()
          if (removed) next.push(JOBS[Math.floor(Math.random() * JOBS.length)])
          return next
        })
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [internalActiveStep, isManual])

  const activeStep = isManual ? Math.floor((manualFrame % 120) / 30) : internalActiveStep
  const items = isManual ? JOBS.slice(0, 4) : internalItems // Simpler logic for the video for now

  return (
    <div className="w-full h-full bg-slate-900 rounded-3xl p-6 overflow-hidden flex flex-col gap-4 border border-white/10 shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400">Swarm Execution Log</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Live Trace // 0xAF32</span>
      </div>

      <div className="flex-1 space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((job, i) => (
            <motion.div
              key={`${job.company}-${i}`}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 transition-colors ${i === 0 ? 'bg-white/10 border-blue-500/30' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${job.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                  {job.company[0]}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{job.company}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Building2 className="w-3 h-3" />
                      {job.role}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator for the top item */}
              <div className="flex flex-col items-end gap-1 min-w-[100px]">
                {i === 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                      {activeStep === 0 && <><Loader2 className="w-3 h-3 animate-spin" /> Scouring</>}
                      {activeStep === 1 && <><Sparkles className="w-3 h-3 text-violet-400" /> Tailoring</>}
                      {activeStep === 2 && <><Loader2 className="w-3 h-3 animate-spin" /> Applying</>}
                      {activeStep === 3 && <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Success</>}
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${activeStep === 3 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(activeStep + 1) * 25}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">In Queue</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Agent Status Footer */}
      <div className="mt-2 bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900" />
            ))}
          </div>
          <span className="text-[10px] font-bold text-blue-300 uppercase">15 Agents Synchronized</span>
        </div>
        <div className="text-[10px] font-mono text-blue-400 animate-pulse">SARVAM-M THINKING...</div>
      </div>
    </div>
  )
}
