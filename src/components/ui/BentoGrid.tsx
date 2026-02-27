import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BentoGridProps {
    children: ReactNode
    className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-6 gap-4 w-full', className)}>
            {children}
        </div>
    )
}
