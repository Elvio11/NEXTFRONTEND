'use client'
import { GlowButton } from '@/components/ui/GlowButton'

const featureCopy: Record<string, { title: string; cta: string }> = {
    fit_reasons: {
        title: 'Full match analysis',
        cta: 'Unlock full match analysis',
    },
    auto_apply: {
        title: 'Auto-apply',
        cta: 'Enable auto-apply',
    },
    coaching: {
        title: 'Daily coaching',
        cta: 'Unlock daily coaching',
    },
    applications: {
        title: 'Application tracker',
        cta: 'Track your applications',
    },
    dream_companies: {
        title: 'Dream companies',
        cta: 'Set dream companies',
    },
}

interface UpgradeCTAProps {
    feature: keyof typeof featureCopy
    compact?: boolean
    onUpgrade?: () => void
}

export function UpgradeCTA({ feature, compact = false, onUpgrade }: UpgradeCTAProps) {
    const copy = featureCopy[feature]

    if (compact) {
        return (
            <button
                onClick={onUpgrade}
                className="px-3 py-1.5 text-xs font-semibold bg-[#3b82f6] text-white rounded-lg shadow-glow-sm hover:shadow-glow-blue transition-all duration-200"
                title={copy.cta}
            >
                Upgrade
            </button>
        )
    }

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(5,5,5,0.7)] backdrop-blur-[4px] rounded-xl p-4 text-center z-10">
            <p className="text-[#f1f5f9] font-semibold text-sm mb-3">{copy.cta}</p>
            <GlowButton variant="primary" size="sm" onClick={onUpgrade}>
                Go Pro
            </GlowButton>
        </div>
    )
}
