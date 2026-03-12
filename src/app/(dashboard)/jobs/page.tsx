'use client'
export const dynamic = 'force-dynamic'

import { JobFeed } from '@/components/jobs/JobFeed'
import { GlassCard } from '@/components/ui/GlassCard'

export default function JobsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <GlassCard className="p-6 mb-6">
                <h2 className="font-bold text-[#f1f5f9] text-xl mb-1">Your Job Feed</h2>
                <p className="text-[#64748b] text-sm">
                    Sorted by fit score. Updated nightly.
                </p>
            </GlassCard>
            <JobFeed />
        </div>
    )
}
