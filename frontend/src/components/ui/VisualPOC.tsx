'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Trophy, FileText, Search, Send, 
  Sparkles, TrendingUp, 
  FileJson, Mail, ShieldCheck, Calendar, Settings, 
  Activity, CheckCircle2,
  Briefcase
} from 'lucide-react'
import { NeuralSwarm } from './CustomIcons'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const AGENTS = [
  // Layer 1: Core Intelligence (Inner)
  { id: 3, label: 'Resume Intel', icon: <FileJson />, radius: '15%', duration: 18, delay: 0, layer: 1 },
  { id: 4, label: 'Skill Gap', icon: <Zap />, radius: '15%', duration: 18, delay: 4, layer: 1 },
  { id: 5, label: 'Career Intel', icon: <TrendingUp />, radius: '15%', duration: 18, delay: 8, layer: 1 },
  { id: 6, label: 'Fit Scorer', icon: <Trophy />, radius: '15%', duration: 18, delay: 12, layer: 1 },
  { id: 7, label: 'JD Cleaner', icon: <Sparkles />, radius: '15%', duration: 18, delay: 16, layer: 1 },
  
  // Layer 2: Execution & Automation (Middle)
  { id: 9, label: 'Job Scraper', icon: <Search />, radius: '28%', duration: 25, delay: 2, layer: 2 },
  { id: 10, label: 'ATS Tailor', icon: <FileText />, radius: '28%', duration: 25, delay: 7, layer: 2 },
  { id: 11, label: 'Cover Letter', icon: <Mail />, radius: '28%', duration: 25, delay: 12, layer: 2 },
  { id: 12, label: 'Auto Apply', icon: <Send />, radius: '28%', duration: 25, delay: 17, layer: 2 },
  { id: 13, label: 'Anti-Ban', icon: <ShieldCheck />, radius: '28%', duration: 25, delay: 22, layer: 2 },

  // Layer 3: Calibration & Follow-up (Outer)
  { id: 8, label: 'Daily Coach', icon: <Activity />, radius: '40%', duration: 35, delay: 5, layer: 3 },
  { id: 14, label: 'Anuvartan', icon: <Calendar />, radius: '40%', duration: 35, delay: 15, layer: 3 },
  { id: 15, label: 'Calibrator', icon: <Settings />, radius: '40%', duration: 35, delay: 25, layer: 3 }
]

const STAGES = [
  { id: 'scout', label: '1. Discovery', agent: 9, desc: 'Agent 9 (Scraper) scouts LinkedIn for SDE-2 roles.' },
  { id: 'analyze', label: '2. Analysis', agent: 7, desc: 'Agent 7 (Cleaner) extracts 14 core skills from the JD.' },
  { id: 'score', label: '3. Strategy', agent: 6, desc: 'Agent 6 (Fit Scorer) predicts a 98% match for your profile.' },
  { id: 'tailor', label: '4. Tailoring', agent: 10, desc: 'Agent 10 (Tailor) rewrites your experience for ATS precision.' },
  { id: 'apply', label: '5. Execution', agent: 12, desc: 'Agent 12 (Setu) launches the secure auto-apply sequence.' },
  { id: 'notify', label: '6. Ready', agent: 8, desc: 'Agent 8 (Sarthi) notifies you on WhatsApp: Applied ✅' }
]

export const VisualPOC = () => {
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % STAGES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="demo" className="py-24 px-6 relative overflow-hidden bg-bg-base/20 border-y border-slate-200/50">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />
      
      {/* Deep Atmospheric Glows */}
      <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        <div className="text-center space-y-6">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black uppercase tracking-widest mx-auto">
             Real-Time Swarm Workflow
           </div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight">
             Watch the Swarm <br /><span className="text-blue-600">in Action.</span>
           </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Workflow Stage Display */}
          <div className="space-y-8 bg-white/40 backdrop-blur-xl p-5 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-white/50 shadow-sm relative overflow-hidden">
             {/* Stage Progress Bar */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
               <motion.div 
                 className="h-full bg-blue-600"
                 key={currentStage}
                 initial={{ width: '0%' }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 4.5, ease: 'linear' }}
               />
             </div>

             <div className="space-y-10">
                <div className="space-y-4">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={currentStage}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       className="space-y-2"
                     >
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                           {STAGES[currentStage].label}
                        </span>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{STAGES[currentStage].label}</h3>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                          {STAGES[currentStage].desc}
                        </p>
                     </motion.div>
                   </AnimatePresence>
                </div>

                {/* Job Card Simulation - HIGHER FIDELITY ANIMATION */}
                <div className="relative aspect-[16/9] bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden shadow-blue-500/5 group">
                   
                   {/* Background Glow during Scan */}
                   <AnimatePresence>
                      {currentStage === 1 && (
                         <motion.div initial={{ top: '-100%' }} animate={{ top: '100%' }} transition={{ duration: 3, repeat: Infinity }} className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none z-10" />
                      )}
                   </AnimatePresence>

                   <div className="absolute top-0 left-0 w-full h-full p-5 sm:p-8 space-y-4 sm:space-y-6">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                               <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                               <div className="text-[12px] font-black text-slate-900 tracking-tight">Software Development Engineer II</div>
                               <div className="text-[10px] font-bold text-blue-500 flex items-center gap-1.5 mt-0.5">
                                  <span>Zomato • Gurugram</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span>Full-time</span>
                               </div>
                            </div>
                         </div>
                         
                         {/* Dynamic Badge Zone */}
                         <div className="flex flex-col items-end gap-2">
                           {currentStage >= 2 && (
                             <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white shadow-lg border-2 border-white flex flex-col items-center">
                               <span className="text-[10px] font-black leading-none">98%</span>
                               <span className="text-[6px] uppercase font-bold tracking-widest leading-none">Match</span>
                             </motion.div>
                           )}
                           {currentStage >= 4 && (
                              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-2">
                                <Send className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">Applied</span>
                              </motion.div>
                           )}
                         </div>
                      </div>

                      {/* Content Layers based on Stage */}
                      <div className="space-y-4 pt-2">
                         <div className="flex flex-wrap gap-2">
                            {['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'AWS'].map((skill, i) => (
                               <motion.div 
                                 key={skill}
                                 animate={{ 
                                   scale: currentStage >= 1 && (i % 2 === 0 || currentStage >= 2) ? 1 : 0.9,
                                   opacity: currentStage >= 1 && (i % 2 === 0 || currentStage >= 2) ? 1 : 0.4
                                 }}
                                 className={cn(
                                    "px-3 py-1 rounded-lg border text-[9px] font-bold transition-all",
                                    currentStage >= 2 && i < 3 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                 )}
                               >
                                 {skill}
                               </motion.div>
                            ))}
                         </div>

                         <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
                            <motion.p 
                              animate={{ 
                                color: currentStage >= 3 ? '#2563eb' : '#64748b',
                                fontStyle: currentStage === 3 ? 'italic' : 'normal'
                              }}
                              className="text-[11px] leading-relaxed font-medium"
                            >
                               {currentStage >= 3 
                                 ? "Architected resilient payment gateways handling 10k+ TP..." 
                                 : "Helped build several apps using Java and AWS/Docker..."}
                            </motion.p>
                            {currentStage === 3 && (
                               <motion.div 
                                 initial={{ width: '0%' }}
                                 animate={{ width: '100%' }}
                                 className="absolute bottom-0 left-0 h-0.5 bg-blue-500 opacity-20"
                               />
                            )}
                         </div>

                         {/* Submission Message Overflow */}
                         <AnimatePresence>
                           {currentStage >= 5 && (
                              <motion.div 
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#075e54] text-white flex items-center justify-between shadow-xl border border-white/10 z-20"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#128c7e] flex items-center justify-center text-[10px] font-black">T</div>
                                    <div className="flex flex-col -space-y-0.5">
                                       <span className="text-[8px] font-black uppercase opacity-60">Talvix Sarthi</span>
                                       <span className="text-[10px] font-bold">Zomato Application Sent ✅</span>
                                    </div>
                                 </div>
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-2">
                   <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                         {[9, 7, 6].map((id) => (
                            <div key={id} className={cn(
                               "w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all",
                               STAGES[currentStage].agent === id ? "bg-blue-600 text-white z-10 animate-bounce" : "bg-slate-200 text-slate-400"
                            )}>
                               <span className="text-[7px] font-black">A{id}</span>
                            </div>
                         ))}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Swarm Processing</span>
                   </div>
                   <div className="text-[10px] font-black text-blue-600 italic tracking-tighter">
                      Runtime: {3.2 + currentStage * 1.5}s
                   </div>
                </div>
             </div>
          </div>

          {/* Right: Immersive Hub Visualization */}
          <div className="relative aspect-square w-full max-w-[550px] mx-auto scale-[0.75] sm:scale-100 origin-center">
             {/* Concentric Paths */}
             <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-[30%] aspect-square rounded-full border border-blue-500/20 border-dashed animate-spin-slow" />
                <div className="w-[56%] aspect-square rounded-full border border-violet-500/10" />
                <div className="w-[80%] aspect-square rounded-full border border-slate-300/20 border-dashed" />
             </div>

             {/* Central Neural Hub */}
             <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="relative">
                   <motion.div 
                     animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
                     transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity } }} 
                     className="w-32 h-32 rounded-full border-2 border-blue-500/20 border-dashed flex items-center justify-center p-3"
                   >
                      <div className="w-full h-full rounded-full border border-violet-500/30 border-dotted" />
                   </motion.div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute w-24 h-24 rounded-full bg-blue-600 blur-3xl" />
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-3xl border border-white/40 flex items-center justify-center shadow-2xl relative z-10">
                         <NeuralSwarm size={48} className="text-blue-500 animate-pulse shrink-0 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      </div>
                   </div>
                </div>
             </div>

             {/* 15 Orbiting Agents with Workflow Highlight */}
             {AGENTS.map((agent) => {
               const isActive = STAGES[currentStage].agent === agent.id
               
               return (
                 <motion.div
                   key={agent.id}
                   className="absolute inset-0 flex items-center justify-center pointer-events-none"
                   animate={{ rotate: 360 }}
                   transition={{ duration: agent.duration, repeat: Infinity, ease: 'linear', delay: -agent.delay }}
                 >
                   <div 
                     className="absolute flex items-center gap-3 pointer-events-auto"
                     style={{ left: `calc(50% + ${agent.radius})` }}
                   >
                     <motion.div 
                       animate={{ rotate: -360, scale: isActive ? 1.4 : 1 }} 
                       transition={{ rotate: { duration: agent.duration, repeat: Infinity, ease: 'linear', delay: -agent.delay }, scale: { duration: 0.5 } }}
                       className="flex items-center gap-3 group/agent"
                     >
                       <div className="relative flex items-center justify-center">
                         <motion.div 
                           animate={{ scale: [1, 1.4, 1], opacity: isActive ? 0.8 : [0.1, 0.3, 0.1] }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className={cn(
                              "absolute w-10 h-10 rounded-full blur-lg opacity-0 transition-opacity",
                              isActive ? "bg-blue-500 opacity-100" : "bg-blue-400/20 group-hover/agent:opacity-100"
                           )}
                         />
                         <div className={cn(
                           "w-9 h-9 rounded-xl border transition-all z-10 flex items-center justify-center",
                           isActive 
                             ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                             : "bg-white/90 border-slate-200/50 text-slate-400 group-hover/agent:text-blue-500 shadow-sm"
                         )}>
                           <span className="w-5 h-5">{agent.icon}</span>
                         </div>
                       </div>
                       
                       <AnimatePresence>
                         {isActive && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex flex-col -space-y-0.5"
                            >
                              <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">Active Node</span>
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">{agent.label}</span>
                            </motion.div>
                         )}
                       </AnimatePresence>
                     </motion.div>
                   </div>
                 </motion.div>
               )
             })}
          </div>
        </div>

        {/* Workflow Summary Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
           {STAGES.map((s, i) => (
              <div 
                key={i}
                className={cn(
                  "px-6 py-3 rounded-2xl border transition-all duration-500 flex items-center gap-3",
                  currentStage === i 
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 translate-y-[-4px]" 
                    : "bg-white/60 border-slate-200 text-slate-500 opacity-60 backdrop-blur-md"
                )}
              >
                 <div className={cn("w-2 h-2 rounded-full", currentStage === i ? "bg-white animate-pulse" : "bg-slate-300")} />
                 <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
              </div>
           ))}
        </div>
      </div>
    </section>
  )
}
