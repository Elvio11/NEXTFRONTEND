import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { FitScoreBento } from '@/components/dashboard/FitScoreBento'
import { Suspense } from 'react'

export const experimental_ppr = true

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={<div className="h-32 animate-pulse bg-white/5 rounded-2xl" />}>
                <FitScoreBento />
            </Suspense>
            <DashboardHome />
        </div>
    )
}
