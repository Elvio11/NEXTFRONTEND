'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Target, Search, X, Check, Globe, Laptop, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_FAMILIES = [
  'Frontend Engineering',
  'Backend Engineering',
  'Fullstack Development',
  'Data Science',
  'Product Management',
  'UI/UX Design',
  'DevOps & SRE',
  'Machine Learning',
  'Generative AI',
  'Cybersecurity',
  'Cloud Architecture',
  'Mobile Development',
  'System Design',
  'QA Automation',
  'Blockchain',
]

interface NishanaProps {
  onComplete: (roles: string[]) => void
}

export function Nishana({ onComplete }: NishanaProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [query, setQuery] = useState('')

  const filteredRoles = ROLE_FAMILIES.filter(r => 
    r.toLowerCase().includes(query.toLowerCase()) && !selectedRoles.includes(r)
  )

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(prev => prev.filter(r => r !== role))
    } else if (selectedRoles.length < 5) {
      setSelectedRoles(prev => [...prev, role])
    }
  }

  return (
    <GlassCard className="p-8 max-w-2xl mx-auto border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-glow-orange/5">
          <Target className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 03: Nishana Protocol</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Define target role families for swarm search calibration
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search & Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle group-focus-within:text-orange-400 transition-colors" />
          <input
            type="text"
            placeholder="Search roles (e.g., Frontend, Product...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-sm font-mono text-white placeholder:text-content-subtle focus:outline-none focus:border-orange-500/50 transition-all shadow-glow-orange/0 focus:shadow-glow-orange/5"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className={cn(
               "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10",
               selectedRoles.length >= 5 ? "text-orange-500" : "text-content-subtle"
            )}>
              {selectedRoles.length}/5 Limit
            </span>
          </div>
        </div>

        {/* Selected Roles */}
        <div className="flex flex-wrap gap-2.5 min-h-[40px]">
          <AnimatePresence>
            {selectedRoles.map((role) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold uppercase tracking-widest text-orange-400 group"
              >
                <Check className="w-3 h-3" />
                <span>{role}</span>
                <button
                  onClick={() => toggleRole(role)}
                  className="p-1 rounded-md hover:bg-orange-500/20 text-orange-400/50 hover:text-orange-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {selectedRoles.length === 0 && (
            <p className="text-[10px] font-mono text-content-subtle py-2">
              Anveshan needs at least one target role to initiate the job swarm.
            </p>
          )}
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-content-subtle px-1">Top Role Families</p>
          <div className="grid grid-cols-2 gap-2">
            {filteredRoles.slice(0, 8).map((role) => (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 text-left hover:border-white/20 transition-all group"
              >
                <span className="text-[10px] font-bold uppercase text-white/70 group-hover:text-white transition-colors tracking-tight">{role}</span>
                <Zap className="w-3 h-3 text-content-subtle opacity-0 group-hover:opacity-100 transition-all group-hover:text-orange-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="pt-6">
          <button
            onClick={() => selectedRoles.length > 0 && onComplete(selectedRoles)}
            disabled={selectedRoles.length === 0}
            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-orange transition-all disabled:opacity-30 disabled:shadow-none active:scale-[0.98]"
          >
            Lock Target Nishana
          </button>
          <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
            <Globe className="w-3 h-3 text-content-subtle" />
            <span className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">Global Scraper Calibration</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
