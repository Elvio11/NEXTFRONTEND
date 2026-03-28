'use client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlowButtonProps {
    children: ReactNode
    onClick?: () => void
    href?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'primary' | 'ghost'
    className?: string
    disabled?: boolean
    type?: 'button' | 'submit'
}

const sizes = {
    sm: 'px-4 py-2 text-sm h-9',
    md: 'px-6 py-3 text-base h-11',
    lg: 'px-8 py-4 text-lg h-14',
}

export function GlowButton({
    children,
    onClick,
    href,
    size = 'md',
    variant = 'primary',
    className,
    disabled = false,
    type = 'button',
}: GlowButtonProps) {
    const cls = cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-300 select-none',
        sizes[size],
        variant === 'primary' && [
            'bg-accent-blue text-white',
            'shadow-glow-blue',
            'hover:shadow-glow-blue hover:brightness-110',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        ],
        variant === 'ghost' && [
            'bg-glass border border-glass-border',
            'text-content-primary backdrop-blur-glass',
            'hover:bg-glass-hover hover:border-white/20',
        ],
        className
    )

    if (href) {
        return (
            <a href={href} className={cls}>
                {children}
            </a>
        )
    }

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cls}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {children}
        </motion.button>
    )
}
