'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { ApplicationTracker } from '@/components/applications/ApplicationTracker'
import { usePermissions } from '@/hooks/usePermissions'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { GlassCard } from '@/components/ui/GlassCard'

export default function ApplicationsPage() {
    const { canViewApplications } = usePermissions()
    const [pricingOpen, setPricingOpen] = useState(false)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="relative">
                <div className={!canViewApplications ? 'blur-sm pointer-events-none select-none' : ''}>
                    <ApplicationTracker />
                </div>
                {!canViewApplications && (
                    <GlassCard className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8">
                            <p className="text-[#f1f5f9] font-semibold text-lg mb-4">
                                Track your applications
                            </p>
                            <UpgradeCTA
                                feature="applications"
                                onUpgrade={() => setPricingOpen(true)}
                            />
                        </div>
                    </GlassCard>
                )}
            </div>
            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </div>
    )
}
