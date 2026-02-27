'use client'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
    children: ReactNode
    className?: string
    glow?: 'blue' | 'violet' | 'none'
    hover?: boolean
    as?: keyof JSX.IntrinsicElements
}

export function GlassCard({
    children,
    className,
    glow = 'none',
    hover = false,
    as: Tag = 'div',
}: GlassCardProps) {
    return (
        <Tag
            className={cn(
                'relative rounded-2xl overflow-hidden',
                'bg-[rgba(255, 255, 255, 0.04)] border border-[rgba(255,255,255,0.08)]',
                'backdrop-blur-[12px] shadow-glass',
                glow === 'blue' &&
                'before:absolute before:inset-0 before:bg-card-glow before:pointer-events-none before:z-0',
                glow === 'violet' &&
                'before:absolute before:inset-0 before:bg-violet-glow before:pointer-events-none before:z-0',
                hover && [
                    'transition-all duration-300 cursor-pointer',
                    'hover:bg-[rgba(255,255,255,0.07)]',
                    'hover:shadow-glass-lg',
                    'hover:border-[rgba(255,255,255,0.12)]',
                ],
                className
            )}
        >
            {children}
        </Tag>
    )
}
