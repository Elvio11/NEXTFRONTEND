'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useDashboardStore } from '@/stores/dashboardStore'
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard'

import { CommandCenterHeader } from './CommandCenterHeader'
import { LivePulseFeed } from './LivePulseFeed'
import { ReadinessCard } from './ReadinessCard'
import { CareerScoreCard } from './CareerScoreCard'
import { QuickStats } from './QuickStats'
import { JobFeed } from '@/components/jobs/JobFeed'
import Link from 'next/link'
import { ArrowRight, Terminal } from 'lucide-react'

export function DashboardHome() {
  const { user, profile } = useAuth()
  const { dashboardReady } = useDashboardStore()
  const isReady = profile?.dashboard_ready || dashboardReady
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
          
          <LiquidGlassCard hoverable={false} className="!p-0 border-accent/10">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">System Protocol</h3>
            </div>
            <p className="text-[11px] font-bold text-content-muted leading-relaxed uppercase tracking-wider">
              Swarm in <span className="text-accent italic">Delta Scan Mode</span>. 
              Prioritizing ultra-high efficiency for fresh market signals.
            </p>
          </LiquidGlassCard>
        </div>

        {/* Right Column: Key Metrics & Preview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="w-full">
              <ReadinessCard ready={isReady} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Career score */}
              <CareerScoreCard />
              {/* Quick stats */}
              <QuickStats />
            </div>

            {/* Top jobs preview */}
            <div className="w-full h-full flex-grow">
              <LiquidGlassCard hoverable={false} className="h-full flex flex-col !p-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Swarm Top Match</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Prime opportunities identified in the last cycle.</p>
                  </div>
                  <Link
                    href="/jobs"
                    className="flex items-center gap-2 px-6 h-10 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-white/[0.06] transition-all"
                  >
                    Enter Feed <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <JobFeed preview limit={3} />
              </LiquidGlassCard>
            </div>
        </div>
      </div>
    </div>
  )
}
