'use client'
import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { GlassCard } from '@/components/ui/GlassCard'
import { Star, Plus, X } from 'lucide-react'

export function DreamCompanies() {
    const { canViewDreamCompanies } = usePermissions()
    const [pricingOpen, setPricingOpen] = useState(false)
    const [input, setInput] = useState('')
    const [dreamList, setDreamList] = useState<string[]>([])

    const addCompany = () => {
        if (!input.trim()) return
        setDreamList((prev) => [...prev, input.trim()])
        setInput('')
    }

    return (
        <>
            <GlassCard className="p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h2 className="font-semibold text-[#f1f5f9]">Dream Companies</h2>
                </div>
                <p className="text-[#64748b] text-sm mb-4">
                    Lower fit threshold for these companies — more chances with your dream employers.
                </p>

                <div
                    className={`${!canViewDreamCompanies ? 'blur-sm pointer-events-none select-none' : ''}`}
                >
                    <div className="flex gap-2 mb-4">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addCompany() }}
                            placeholder="Company name..."
                            className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2 text-sm text-[#f1f5f9] placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
                        />
                        <button onClick={addCompany} className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#64748b] hover:text-[#f1f5f9]">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    {dreamList.map((company) => (
                        <div key={company} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] mb-2">
                            <span className="text-sm text-[#f1f5f9]">{company}</span>
                            <button onClick={() => setDreamList((p) => p.filter((c) => c !== company))} className="text-[#64748b] hover:text-red-400 transition-colors duration-200">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>

                {!canViewDreamCompanies && (
                    <UpgradeCTA feature="dream_companies" onUpgrade={() => setPricingOpen(true)} />
                )}
            </GlassCard>

            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </>
    )
}
