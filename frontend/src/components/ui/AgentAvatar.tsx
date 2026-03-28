import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AgentAvatarProps {
  icon: LucideIcon
  color: string
  name: string
  className?: string
  glowIntensity?: 'low' | 'medium' | 'high'
}

export const AgentAvatar = ({
  icon: Icon,
  color,
  name,
  className,
  glowIntensity = 'medium'
}: AgentAvatarProps) => {
  const intensityMap = {
    low: 'opacity-20 blur-lg',
    medium: 'opacity-40 blur-xl',
    high: 'opacity-60 blur-2xl'
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer Cybernetic Ring */}
      <motion.div
        title={name}
        className="absolute inset-0 rounded-full border border-white/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: color }}
        />
      </motion.div>

      {/* Main Glass Orb */}
      <div className="relative w-full h-full rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center overflow-hidden group">
        
        {/* Internal Glow */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            intensityMap[glowIntensity]
          )}
          style={{ backgroundColor: color }}
        />

        {/* Diagonal Glass Sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

        {/* The Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10"
        >
          <Icon 
            className="w-1/2 h-1/2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ color, filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </motion.div>

        {/* Micro-sparkles or Noise */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Static Outer Glow */}
      <div 
        className={cn(
          "absolute inset-0 -z-10 rounded-full",
          intensityMap[glowIntensity]
        )}
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
