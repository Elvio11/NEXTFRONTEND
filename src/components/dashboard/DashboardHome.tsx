'use client'
import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useDashboardStore } from '@/stores/dashboardStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { ReadinessCard } from './ReadinessCard'
import { CareerScoreCard } from './CareerScoreCard'
import { QuickStats } from './QuickStats'
import { JobFeed } from '@/components/jobs/JobFeed'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function DashboardHome() {
    const { user } = useAuth()
    const { dashboardReady } = useDashboardStore()
    useRealtime(user?.id)

    return (
        <div className="space-y-6">
            <BentoGrid>
                {/* Readiness card — 4 cols */}
                <div className="md:col-span-4">
                    <ReadinessCard ready={dashboardReady} />
                </div>

                {/* Quick stats — 2 cols */}
                <div className="md:col-span-2">
                    <QuickStats />
                </div>

                {/* Career score — 3 cols */}
                <div className="md:col-span-3">
                    <CareerScoreCard />
                </div>

                {/* Top jobs preview — 3 cols */}
                <div className="md:col-span-3">
                    <GlassCard className="p-5 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-[#f1f5f9] text-sm">Top Matches</h2>
                            <Link
                                href="/jobs"
                                className="text-xs text-[#3b82f6] hover:text-blue-300 flex items-center gap-1 transition-colors duration-200"
                            >
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <JobFeed preview limit={3} />
                    </GlassCard>
                </div>
            </BentoGrid>
        </div>
    )
}
