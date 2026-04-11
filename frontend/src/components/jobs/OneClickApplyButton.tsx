'use client'
import { useOptimistic, useTransition, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { PricingModal } from '@/components/upgrade/PricingModal'

async function applyToJob(jobId: string) {
    // Background ping to Server 3 Agent 12/13 API
    await fetch('http://localhost:8080/api/agents/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Secret': 'development_secret' },
        body: JSON.stringify({ jobId })
    })
}

export function OneClickApplyButton({ jobId, initialApplied = false }: { jobId: string, initialApplied?: boolean }) {
    const { canAutoApply } = usePermissions()
    const [isPending, startTransition] = useTransition()
    const [pricingOpen, setPricingOpen] = useState(false)
    const [optimisticApplied, addOptimisticApplied] = useOptimistic(
        initialApplied,
        (_state: boolean, update: boolean) => update
    )

    const handleApply = () => {
        if (!canAutoApply) {
            setPricingOpen(true)
            return
        }
        startTransition(async () => {
            addOptimisticApplied(true)
            await applyToJob(jobId)
        })
    }

    return (
        <>
            <button
                onClick={handleApply}
                disabled={optimisticApplied || isPending}
                className={`px-4 py-2 font-semibold text-sm rounded-full transition-all duration-300 ${optimisticApplied 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}
            >
                {optimisticApplied ? 'Applied ✓' : 'One-Click Apply'}
            </button>
            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </>
    )
}
