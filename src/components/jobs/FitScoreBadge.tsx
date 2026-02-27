'use client'
import { cn } from '@/lib/utils'

interface FitScoreBadgeProps {
    score: number
    className?: string
}

export function FitScoreBadge({ score, className }: FitScoreBadgeProps) {
    const colorClass =
        score >= 80
            ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-glow-green'
            : score >= 60
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20 opacity-70'

    return (
        <span
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
                colorClass,
                className
            )}
        >
            {score}%
        </span>
    )
}
