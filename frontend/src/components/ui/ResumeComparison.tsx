'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, X, Sparkles } from 'lucide-react'
import { ResumeRewriter } from './ResumeRewriter'

const BEFORE_ITEMS = [
  'Generic "Objective" statement',
  'Outdated technology list',
  'Weak action verbs (Help with, Worked on)',
  'Irrelevant skill clutter',
  'Formatting designed for 2018'
]

const AFTER_ITEMS = [
  'ATS-Optimized professional summary',
  'JD-Matched technical stack',
  'High-impact achievement metrics',
  'Role-specific keyword injections',
  'Modern, sharp layout'
]

export const ResumeComparison = () => {
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mx-auto">
            Stop Sending <span className="text-red-500">Guerilla Resumes</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 font-medium">
            Agent 10 (Shilpakaar) analyzes every JD and transforms your legacy resume into a high-scoring application in milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-[#fefce8]/40 border border-amber-200/50 shadow-inner relative overflow-hidden group/before h-[450px] backdrop-blur-sm"
          >
            <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200 z-10">
              Generic Resume
            </div>
            
            <div className="space-y-6 opacity-80 pt-8">
              <ResumeRewriter active={false} />
              
              <div className="space-y-4 pt-8 border-t border-slate-200/50">
                {BEFORE_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <X className="w-4 h-4 text-red-300 shrink-0" />
                    <span className="text-[10px] text-slate-600/80 font-bold uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-blue-50/50 border border-blue-200/50 shadow-2xl shadow-blue-500/10 relative overflow-hidden group/after h-[450px] backdrop-blur-md"
          >
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-blue-500/20 z-10">
              <Sparkles className="w-3 h-3" />
              Tailored Resume
            </div>
            
            <div className="space-y-6 pt-8">
              <ResumeRewriter active={true} />

              <div className="space-y-4 pt-8 border-t border-blue-50/50">
                {AFTER_ITEMS.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-tight">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Scan animation */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-20 bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 backdrop-blur-[1px] border-y border-blue-500/20"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
