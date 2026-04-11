'use client'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    glow?: 'blue' | 'violet' | 'green' | 'none'
    hover?: boolean
    as?: React.ElementType
}

export function GlassCard({
    children,
    className,
    glow = 'none',
    hover = false,
    as: Tag = 'div',
    ...props
}: GlassCardProps) {
    const TagComp = Tag as any
    return (
        <TagComp
            {...props}
            className={cn(
                'relative rounded-2xl overflow-hidden',
                'bg-glass border border-glass-border',
                'backdrop-blur-glass shadow-glass',
                glow === 'blue' &&
                'before:absolute before:inset-0 before:bg-card-glow before:pointer-events-none before:z-0',
                glow === 'violet' &&
                'before:absolute before:inset-0 before:bg-violet-glow before:pointer-events-none before:z-0',
                glow === 'green' &&
                'before:absolute before:inset-0 before:bg-green-glow before:pointer-events-none before:z-0',
                hover && [
                    'transition-all duration-300 cursor-pointer',
                    'hover:bg-glass-hover',
                    'hover:shadow-glass-lg',
                    'hover:border-white/20',
                ],
                className
            )}
        >
            {children}
        </TagComp>
    )
}
