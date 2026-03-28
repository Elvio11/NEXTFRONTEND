'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FitScoreMeterProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { radius: 18, stroke: 3, fontSize: 'text-[10px]' },
  md: { radius: 24, stroke: 4, fontSize: 'text-xs' },
  lg: { radius: 32, stroke: 6, fontSize: 'text-sm' },
}

export const FitScoreMeter: React.FC<FitScoreMeterProps> = ({ 
  score, 
  size = 'md',
  className 
}) => {
  const { radius, stroke, fontSize } = sizes[size]
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  const color = 
    score >= 80 ? 'text-green-500' : 
    score >= 60 ? 'text-accent-blue' : 
    'text-red-500'

  const glowColor = 
    score >= 80 ? 'shadow-glow-green' : 
    score >= 60 ? 'shadow-glow-blue' : 
    'shadow-glow-red'

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-white/5"
        />
        {/* Progress Circle */}
        <motion.circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={cn("transition-colors duration-500", color)}
        />
      </svg>
      {/* Percentage Center */}
      <div className={cn("absolute inset-0 flex items-center justify-center font-mono font-black italic tracking-tighter", fontSize, color)}>
        {score}
      </div>
      
      {/* Outer Glow */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-xl opacity-20 pointer-events-none",
        score >= 80 ? "bg-green-500" : score >= 60 ? "bg-accent-blue" : "bg-red-500"
      )} />
    </div>
  )
}
