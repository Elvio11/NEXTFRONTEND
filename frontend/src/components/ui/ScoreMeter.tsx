'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreMeterProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  primaryColor?: string
}

export function ScoreMeter({ score, size = 120, strokeWidth = 10, label = 'Fit', primaryColor }: ScoreMeterProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 md:scale-100 scale-100">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          className="transition-all"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={primaryColor || "currentColor"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={cn(
            "transition-all duration-300 drop-shadow-glow",
            !primaryColor && (
              score >= 80 ? "text-blue-500 shadow-glow-blue" : score >= 60 ? "text-orange-500 shadow-glow-orange" : "text-red-500 shadow-glow-red"
            )
          )}
          style={{
            filter: primaryColor ? `drop-shadow(0 0 8px ${primaryColor}44)` : undefined
          }}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Centered Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">{score}%</span>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-content-muted mt-1">{label}</span>
      </div>
    </div>
  )
}
