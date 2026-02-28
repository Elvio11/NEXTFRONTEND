'use client'
import { GlassCard } from '@/components/ui/GlassCard'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface ReadinessCardProps {
    ready: boolean
}

export function ReadinessCard({ ready }: ReadinessCardProps) {
    return (
        <GlassCard glow="blue" className="p-6 min-h-[280px] flex flex-col justify-center">
            {ready ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                        <h2 className="text-2xl font-bold text-[#f1f5f9]">
                            {"You're set."}
                        </h2>
                    </div>
                    <p className="text-[#64748b] text-lg">
                        847 jobs scored against your profile.
                    </p>
                    <p className="text-[#64748b] text-sm">
                        Top matches are ready in your job feed. Auto-apply runs at 8 PM IST.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-[#f1f5f9]">
                        Building your AI engine...
                    </h2>
                    <div className="space-y-3">
                        {[
                            'Parsing resume',
                            'Analysing skills',
                            'Scoring jobs',
                        ].map((step, i) => (
                            <div key={step} className="flex items-center gap-3">
                                <div
                                    className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse"
                                    style={{ animationDelay: `${i * 0.3}s` }}
                                />
                                <p className="text-[#64748b] text-sm">{step}</p>
                                <Loader2 className="w-3 h-3 text-[#3b82f6] animate-spin ml-auto" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[#334155] text-xs">
                        Usually takes 2–5 minutes on first login.
                    </p>
                </div>
            )}
        </GlassCard>
    )
}
