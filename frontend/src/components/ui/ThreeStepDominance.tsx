'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Zap, Trophy, FileText, Linkedin, Briefcase, Lock, Search, Send, CheckCheck, MoreVertical, Sparkles, TrendingUp } from 'lucide-react'
import { useRef } from 'react'
import { SecureVault, NeuralSwarm, CareerGuru } from './CustomIcons'

const STEPS = [
  {
    id: '01',
    title: 'Connect Your Profile',
    desc: 'Securely link your LinkedIn, Indeed, and resume. Our Vault uses AES-256 encryption to keep your credentials safe.',
    icon: <SecureVault size={40} className="text-white" />,
    color: 'blue',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/5] scale-[0.85] sm:scale-100 origin-center">
          <div className="absolute inset-0 bg-white rounded-[32px] border border-slate-200/50 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"
              >
                <Lock className="w-5 h-5" />
              </motion.div>
              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Vault Active</div>
            </div>
            <div className="space-y-3 relative">
              <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute left-0 right-0 h-0.5 bg-blue-500/20 blur-[2px] z-10" />
              {[
                { label: 'LinkedIn', icon: <Linkedin className="w-3 h-3" />, color: 'bg-[#0077b5]' },
                { label: 'Indeed', icon: <Briefcase className="w-3 h-3" />, color: 'bg-[#2164f3]' },
                { label: 'Global Resume', icon: <FileText className="w-3 h-3" />, color: 'bg-slate-800' }
              ].map((conn, i) => (
                <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${conn.color} text-white flex items-center justify-center`}>{conn.icon}</div>
                    <span className="text-[10px] font-bold text-slate-600">{conn.label}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><SecureVault size={10} className="text-white" /></div>
                </motion.div>
              ))}
            </div>
            <div className="pt-4 pt-auto">
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 5, repeat: Infinity }} className="h-full bg-blue-600" />
               </div>
               <p className="text-[8px] font-mono text-slate-400 mt-2 text-center uppercase tracking-tighter">Syncing Swarm Intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: '02',
    title: 'Deploy the Swarm',
    desc: 'Watch as 15 specialist agents scout the market, score every job, and tailor your resume for 95%+ ATS alignment.',
    icon: <NeuralSwarm size={40} className="text-white" />,
    color: 'violet',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-[48px] bg-[#0f172a] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden group/swarm scale-[0.85] sm:scale-100 origin-center">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <motion.circle 
              cx="50%" cy="50%" r="35%" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 8"
              animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.circle 
              cx="50%" cy="50%" r="25%" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2 6"
              animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </svg>

          {/* Concentric Orbit Paths */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-[45%] aspect-square rounded-full border border-blue-500/20 border-dashed" />
            <div className="w-[70%] aspect-square rounded-full border border-violet-500/10" />
            <div className="w-[20%] aspect-square rounded-full border border-blue-400/30 border-dotted" />
          </div>

          {/* Central Intelligence Core */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
             <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="w-20 h-20 rounded-full border-2 border-blue-500/20 border-dashed flex items-center justify-center p-2">
                   <div className="w-full h-full rounded-full border border-violet-500/30 border-dotted" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-12 h-12 rounded-full bg-blue-600 blur-2xl" />
                   <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl">
                      <NeuralSwarm size={32} className="text-blue-400 animate-pulse shrink-0" />
                   </div>
                </div>
             </div>
          </div>

          {/* Orbiting Agent Swarm - 6 Specialized Agents */}
          {[
            { label: 'Deep Search', icon: <Search />, radius: '24%', duration: 12, delay: 0 },
            { label: 'ATS Tailor', icon: <FileText />, radius: '38%', duration: 18, delay: 0 },
            { label: 'JD Cleaner', icon: <Sparkles />, radius: '24%', duration: 12, delay: 4 },
            { label: 'Fit Scorer', icon: <Zap />, radius: '38%', duration: 18, delay: 6 },
            { label: 'Career Intel', icon: <TrendingUp />, radius: '24%', duration: 12, delay: 8 },
            { label: 'Auto Apply', icon: <Send />, radius: '38%', duration: 18, delay: 12 }
          ].map((agent, i) => (
            <motion.div
              key={agent.label}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: agent.duration, repeat: Infinity, ease: 'linear', delay: -agent.delay }}
            >
              <div 
                className="absolute flex items-center gap-3 pointer-events-auto"
                style={{ left: `calc(50% + ${agent.radius})` }}
              >
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: agent.duration, repeat: Infinity, ease: 'linear', delay: -agent.delay }}
                  className="flex items-center gap-3 group"
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      className="absolute w-8 h-8 rounded-full bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" 
                    />
                    <div className="text-white/80 group-hover:text-white transition-colors w-5 h-5 flex items-center justify-center relative z-10">
                      {agent.icon}
                    </div>
                  </div>
                  <span className="text-[7px] font-black font-mono text-white/30 group-hover:text-white/60 transition-colors uppercase tracking-[0.2em] whitespace-nowrap">{agent.label}</span>
                </motion.div>
              </div>
            </motion.div>
          ))}

          {/* Data Flux - Orbital Comets */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
               <motion.div
                 key={i}
                 className="absolute inset-0 flex items-center justify-center"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 1.5 }}
               >
                 <div className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[2px]" style={{ left: '60%' }} />
               </motion.div>
            ))}
          </div>

          {/* Data Flux - Micro Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => {
              // Stable pseudo-randomness based on index 'i' to prevent hydration mismatch
              const stableX = ((i * 137.5) % 100)
              const stableY = ((i * 242.3) % 100)
              const stableOffset = (i * 7.5) % 20 - 10
              
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.3, 0], 
                    x: [0, stableOffset, 0], 
                    y: [0, stableOffset, 0] 
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute w-0.5 h-0.5 bg-blue-400 rounded-full"
                  style={{ left: `${stableX}%`, top: `${stableY}%` }}
                />
              )
            })}
          </div>

          {/* Core Status Label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
             <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[6px] font-black font-mono text-blue-400 uppercase tracking-[0.3em]">Neural Mesh Active</span>
             </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: '03',
    title: 'Ace the Interview',
    desc: 'Get real-time alerts on WhatsApp & Telegram and stay ahead with JD-specific insights sent directly to your phone by Talvix Bot.',
    icon: <CareerGuru size={40} className="text-white" />,
    color: 'emerald',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-4 lg:p-10 overflow-visible">
        <div className="h-full max-h-[440px] aspect-[9/19] bg-[#17212b] rounded-[48px] border-[10px] border-slate-900 shadow-2xl shadow-black/20 relative overflow-hidden ring-1 ring-white/10 flex flex-col shrink-0 scale-[0.85] sm:scale-100 origin-center">
          {/* Phone Top Notch */}
          <div className="absolute top-0 w-full h-7 bg-slate-950 flex justify-center items-end pb-1.5 z-40">
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>
          
          {/* Telegram Header */}
          <div className="pt-7 pb-3 px-4 bg-[#242f3d] border-b border-black/20 flex items-center justify-between z-30 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold leading-none shadow-lg">T</div>
                <div className="space-y-0.5">
                   <div className="text-[10px] font-bold text-white leading-none">Talvix Bot</div>
                   <div className="text-[8px] text-[#768ca1] leading-none">bot • online</div>
                </div>
             </div>
             <MoreVertical className="w-4 h-4 text-[#768ca1]" />
          </div>

          {/* Chat Content (Looping Animations) */}
          <div className="flex-1 p-3 space-y-3 overflow-hidden relative min-h-0 z-20 bg-[#0e1621]">
             <motion.div 
               animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }} 
               transition={{ duration: 6, repeat: Infinity, times: [0, 0.1, 0.8, 1] }} 
               className="bg-[#242f3d] text-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-white/5 max-w-[90%] relative"
             >
                <p className="text-[9px] leading-snug">Match! 🎯<br/><b>Product Lead @ Atlassian</b><br/>Score: 98% • Applied ✅</p>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-40">
                   <span className="text-[6px]">14:52</span>
                   <CheckCheck className="w-2.5 h-2.5" />
                </div>
             </motion.div>

             <motion.div 
               animate={{ opacity: [0, 1, 1, 0], x: [10, 0, 0, 10] }} 
               transition={{ duration: 6, repeat: Infinity, times: [0, 0.2, 0.8, 1], delay: 1 }} 
               className="bg-[#2b5278] text-white rounded-2xl rounded-tr-none p-3 shadow-sm ml-auto max-w-[80%] relative"
             >
                <p className="text-[9px] leading-snug font-medium">Excellent. Prep mode! 🏹</p>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-40"><span className="text-[6px]">14:53</span></div>
             </motion.div>

             <motion.div 
               animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1, 0.95] }} 
               transition={{ duration: 6, repeat: Infinity, times: [0, 0.3, 0.8, 1], delay: 2 }} 
               className="bg-[#242f3d] text-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-emerald-500/20 max-w-[90%] relative"
             >
                <div className="flex items-center gap-2 mb-1 border-b border-white/5 pb-1">
                   <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                   <span className="text-[6px] font-black text-emerald-400 uppercase tracking-widest tracking-tighter">Interview Invite</span>
                </div>
                <p className="text-[9px] leading-snug">Google HR liked the CV! Round 1 Fri @ 4PM. 🏛️🚀</p>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-40">
                   <span className="text-[6px]">15:01</span>
                   <CheckCheck className="w-2.5 h-2.5" />
                </div>
             </motion.div>

             {/* Typing indicator loop */}
             <motion.div 
               animate={{ opacity: [1, 0, 1] }}
               transition={{ duration: 2, repeat: Infinity, delay: 4 }}
               className="flex gap-1 pl-2"
             >
               {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-[#768ca1] rounded-full" />)}
             </motion.div>
          </div>

          {/* Telegram Footer */}
          <div className="p-2 bg-[#242f3d] border-t border-black/20 flex items-center gap-2 shrink-0 z-30">
             <div className="flex-1 h-7 rounded-full bg-[#17212b] border border-white/5 px-3 flex items-center">
                <span className="text-[9px] text-[#768ca1]">Message...</span>
             </div>
             <div className="w-7 h-7 rounded-full bg-[#2b5278] flex items-center justify-center text-white">
                <Send className="w-3 h-3" />
             </div>
          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/10 rounded-full z-40" />
        </div>
      </div>
    )
  }
]

export const ThreeStepDominance = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.666%'])

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
        <div className="absolute top-8 sm:top-12 left-0 w-full text-center z-20 px-6">
           <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
             The <span className="text-blue-600">3-Step</span> Dominance.
           </h2>
        </div>

        <div className="flex-1 w-full flex items-center relative z-10">
          <motion.div style={{ x }} className="flex w-[300vw] items-center h-full max-h-[85vh]">
            {STEPS.map((step) => (
              <div key={step.id} className="w-[100vw] flex-shrink-0 flex items-center">
                <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-6 md:px-12">
                  <div className="space-y-6 sm:space-y-8">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center border-2 border-blue-400 shrink-0">
                          {step.icon}
                        </div>
                        <div className="space-y-0.5">
                           <span className="text-sm sm:text-lg font-black font-mono text-blue-600 tracking-wider">STEP {step.id}</span>
                           <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
                         {step.desc}
                      </p>
                    </div>
                    <div className="lg:hidden w-full max-w-[300px] mx-auto aspect-square bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden">
                      {step.visual}
                    </div>
                  </div>

                  <div className="hidden lg:flex justify-center items-center">
                     <div className="w-full max-w-[420px] aspect-square bg-bg-base/40 rounded-[48px] border border-slate-200/50 relative shadow-2xl shadow-slate-900/10 flex items-center justify-center overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                          {step.visual}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20 bg-bg-base/80 backdrop-blur-md px-5 py-3 rounded-full border border-slate-200/50 shadow-xl">
           {STEPS.map((_, i) => {
             const start = i * 0.33
             const end = Math.min((i + 1) * 0.33, 1)
             return (
               <div key={i} className="relative w-12 sm:w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    style={{ scaleX: useTransform(scrollYProgress, [start, end], [0, 1]) }} 
                    className="absolute inset-0 bg-blue-600 origin-left"
                  />
               </div>
             )
           })}
        </div>
      </div>
    </div>
  )
}
