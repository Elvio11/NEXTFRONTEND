'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useJobs } from '@/hooks/useJobs'
import { JobCard } from './JobCard'
import { useDashboardStore } from '@/stores/dashboardStore'
import { Filter, Search, Grid, List as ListIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobFeedProps {
  preview?: boolean
  limit?: number
}

export function JobFeed({ preview = false, limit }: JobFeedProps) {
  const { studentMode } = useDashboardStore()
  const { jobs, loading } = useJobs()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterMode, setFilterMode] = useState<'all' | 'internship' | 'mnc'>('all')

  const displayJobs = jobs.slice(0, limit || jobs.length)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!preview && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                filterMode === 'all' ? "bg-accent-blue text-white shadow-glow-blue" : "text-content-subtle hover:text-white"
              )}
            >
              All Jobs
            </button>
            <button
              onClick={() => setFilterMode('internship')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                filterMode === 'internship' ? "bg-accent-violet text-white shadow-glow-violet" : "text-content-subtle hover:text-white"
              )}
            >
              {studentMode ? 'Internships' : 'Entry Roles'}
            </button>
            <button
              onClick={() => setFilterMode('mnc')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                filterMode === 'mnc' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-content-subtle hover:text-white"
              )}
            >
              MNC Tracker
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative flex-grow flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-content-subtle" />
                <input 
                  type="text" 
                  placeholder="Filter swarm results..."
                  className="pl-9 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-content-subtle"
                />
             </div>
             <div className="h-6 w-px bg-white/10" />
             <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-xl p-1 border border-white/5">
                <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-lg", viewMode === 'grid' ? "bg-white/10 text-white" : "text-content-subtle")}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-lg", viewMode === 'list' ? "bg-white/10 text-white" : "text-content-subtle")}><ListIcon className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xxl:grid-cols-3" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {displayJobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!preview && displayJobs.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto">
            <Filter className="w-8 h-8 text-content-subtle opacity-20" />
          </div>
          <p className="text-content-muted font-mono text-sm tracking-tight text-balance">
             No swarm results found for the current filter criteria.<br />
             Try broadening your target roles in <span className="text-blue-400">System Config</span>.
          </p>
        </div>
      )}
    </div>
  )
}
