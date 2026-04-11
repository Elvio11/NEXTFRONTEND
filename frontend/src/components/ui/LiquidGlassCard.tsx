'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  glow?: boolean
}

export function LiquidGlassCard({ children, className, hoverable = true, glow = false }: LiquidGlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "relative group overflow-hidden rounded-[32px] p-px transition-all duration-300",
        glow && "shadow-[0_0_30px_var(--accent-glow)]",
        className
      )}
    >
      {/* Liquid Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      {/* Main Glass Surface */}
      <div className="relative h-full w-full rounded-[31px] bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--card-border)] p-6 md:p-8 flex flex-col">
        {/* Reflection Highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {children}
      </div>
    </motion.div>
  )
}
