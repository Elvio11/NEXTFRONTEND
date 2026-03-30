'use client'

import { motion } from 'framer-motion'
import { 
  ShilpakaarIcon, 
  SankhyaIcon, 
  SetuIcon, 
  GuruIcon 
} from './AgentIcons'

const FEATURES = [
  {
    title: 'Precision Tailoring',
    agent: 'Shilpakaar',
    icon: ShilpakaarIcon,
    color: '#3b82f6',
    description: 'Deploys Shilpakaar (Agent 10) to rewrite your resume for every single job ID, ensuring 95%+ ATS keyword alignment.'
  },
  {
    title: 'Delta Fit Scoring',
    agent: 'Sankhya',
    icon: SankhyaIcon,
    color: '#8b5cf6',
    description: 'Sankhya (Agent 6) calculates a multi-dimensional fit score for 150K+ live jobs, filtering for your dream companies.'
  },
  {
    title: 'Zero-Click Applying',
    agent: 'Setu',
    icon: SetuIcon,
    color: '#f97316',
    description: 'Setu (Agent 12) handles Tier 1 platforms (Indeed/LinkedIn) automatically, managing form Q&A and session logic.'
  },
  {
    title: 'Daily Swarm Coaching',
    agent: 'Guru',
    icon: GuruIcon,
    color: '#22c55e',
    description: 'Guru (Agent 8) monitors your progress and sends tactical career advice directly to your WhatsApp.'
  }
]

export const SwarmCapabilities = () => {
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mx-auto">
            15 Specialists. <span className="text-blue-600">One Swarm.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 font-medium">
            While generic AI tools just 'chat', Talvix deploys a coordinated unit of specialized agents to own your job search.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 rounded-3xl bg-bg-base/40 border border-slate-200/50 hover:border-blue-300/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden relative shadow-sm backdrop-blur-md"
            >
              {/* Decorative background glow */}
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ backgroundColor: feature.color }}
              />

              <div className="relative z-10 space-y-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-950 shadow-xl border border-white/10"
                  style={{ boxShadow: `0 10px 30px -10px ${feature.color}60` }}
                >
                  <feature.icon className="w-10 h-10" style={{ color: feature.color }} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{feature.agent}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-transparent group-hover:border-blue-100 pb-2 transition-all">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
