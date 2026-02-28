'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { Plus, X } from 'lucide-react'

export function BlacklistManager() {
    const [input, setInput] = useState('')
    const [blacklist, setBlacklist] = useState<string[]>([])

    const addCompany = () => {
        if (!input.trim()) return
        setBlacklist((prev) => [...prev, input.trim()])
        setInput('')
    }

    return (
        <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <X className="w-5 h-5 text-red-400" />
                <h2 className="font-semibold text-[#f1f5f9]">Company Blacklist</h2>
            </div>
            <p className="text-[#64748b] text-sm mb-4">
                Companies added here will never receive auto-applications.
            </p>

            <div className="flex gap-2 mb-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addCompany()
                    }}
                    placeholder="Company name..."
                    className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2 text-sm text-[#f1f5f9] placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
                />
                <GlowButton variant="ghost" size="sm" onClick={addCompany}>
                    <Plus className="w-4 h-4" />
                </GlowButton>
            </div>

            {blacklist.map((company) => (
                <div
                    key={company}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] mb-2"
                >
                    <span className="text-sm text-[#f1f5f9]">{company}</span>
                    <button
                        onClick={() =>
                            setBlacklist((p) => p.filter((c) => c !== company))
                        }
                        className="text-[#64748b] hover:text-red-400 transition-colors duration-200"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </GlassCard>
    )
}
