import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AgentAvatarProps {
  icon: React.ComponentType<{ className?: string, style?: React.CSSProperties }>
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
    low: 'opacity-10 blur-md',
    medium: 'opacity-15 blur-lg',
    high: 'opacity-20 blur-xl'
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer Cybernetic Ring */}
      <motion.div
        title={name}
        className="absolute inset-0 rounded-full border border-slate-200"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: color }}
        />
      </motion.div>

      {/* Main Glass Orb */}
      <div className="relative w-full h-full rounded-full bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center overflow-hidden group">
        
        {/* Internal Glow */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            intensityMap[glowIntensity]
          )}
          style={{ backgroundColor: color }}
        />

        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

        {/* The Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex items-center justify-center w-full h-full"
        >
          <Icon 
            className="w-[75%] h-[75%]"
            style={{ color, filter: `drop-shadow(0 0 15px ${color}90)` }}
          />
        </motion.div>
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
