'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useDashboardStore } from '@/stores/dashboardStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { CommandCenterHeader } from './CommandCenterHeader'
import { LivePulseFeed } from './LivePulseFeed'
import { ReadinessCard } from './ReadinessCard'
import { CareerScoreCard } from './CareerScoreCard'
import { QuickStats } from './QuickStats'
import { JobFeed } from '@/components/jobs/JobFeed'
import Link from 'next/link'
import { ArrowRight, Terminal } from 'lucide-react'

export function DashboardHome() {
  const { user } = useAuth()
  const { dashboardReady } = useDashboardStore()
  useRealtime(user?.id)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Command Center Status Bar */}
      <CommandCenterHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intelligence Stream */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-[400px]">
            <LivePulseFeed />
          </div>
          
          <GlassCard className="p-6 bg-blue-500/[0.02] border-blue-500/10">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">System Logs</h3>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Your agent swarm is currently in <span className="text-blue-400 font-bold">Delta Scoring Mode</span>. 
              Efficiency is prioritized for recent scrape results.
            </p>
          </GlassCard>
        </div>

        {/* Right Column: Key Metrics & Preview */}
        <div className="lg:col-span-8 space-y-6">
          <BentoGrid className="grid-cols-1">
            {/* Readiness card */}
            <div className="md:col-span-1">
              <ReadinessCard ready={dashboardReady} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Career score */}
              <CareerScoreCard />
              {/* Quick stats */}
              <QuickStats />
            </div>

            {/* Top jobs preview */}
            <div className="md:col-span-1">
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Top Swarm Matches</h2>
                    <p className="text-xs text-content-muted mt-1">High-fit opportunities identified in the last 24 hours.</p>
                  </div>
                  <Link
                    href="/jobs"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-blue-400 hover:bg-white/[0.06] transition-all"
                  >
                    View Swarm Results <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <JobFeed preview limit={3} />
              </GlassCard>
            </div>
          </BentoGrid>
        </div>
      </div>
    </div>
  )
}
