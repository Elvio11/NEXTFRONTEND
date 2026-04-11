import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard'
import { CheckCircle2, Loader2, Zap } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'

interface ReadinessCardProps {
    ready: boolean
}

export function ReadinessCard({ ready }: ReadinessCardProps) {
    const { data: stats, isLoading } = useDashboardStats()

    return (
        <LiquidGlassCard glow className="min-h-[280px] flex flex-col justify-center">
            {ready ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">
                                {"Nominal Status"}
                            </h2>
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">AI Engine Active</span>
                        </div>
                    </div>
                    
                    <div className="py-2">
                        <p className="text-content-subtle text-[15px] font-medium leading-relaxed">
                            <span className="text-white font-black italic">
                                {isLoading ? "..." : stats?.jobsScored.toLocaleString()}
                            </span> jobs scored against your profile.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <Zap className="w-4 h-4 text-accent mt-0.5" />
                        <p className="text-content-muted text-[11px] font-bold leading-normal uppercase tracking-wider">
                            Top matches are ready. Auto-apply cycle: <span className="text-accent">20:00 IST</span>
                        </p>
                    </div>
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
        </LiquidGlassCard>
    )
}
