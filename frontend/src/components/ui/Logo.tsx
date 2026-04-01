'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light' | 'mono'
}

export function Logo({ 
  className = "", 
  iconOnly = false, 
  size = 'md',
  variant = 'dark'
}: LogoProps) {
  
  const sizes = {
    sm: { iconWidth: 20, iconHeight: 24, text: 'text-lg', gap: 'gap-2' },
    md: { iconWidth: 28, iconHeight: 34, text: 'text-2xl', gap: 'gap-3' },
    lg: { iconWidth: 48, iconHeight: 58, text: 'text-4xl', gap: 'gap-4' },
    xl: { iconWidth: 62, iconHeight: 76, text: 'text-5xl', gap: 'gap-5' },
  }

  const { iconWidth, iconHeight, text, gap } = sizes[size]

  return (
    <div className={cn("flex items-center group", gap, className)}>
      {/* THE CRYSTAL MARK */}
      <svg 
        width={iconWidth} 
        height={iconHeight} 
        viewBox="0 0 62 76" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-500 group-hover:scale-110"
      >
        <defs>
          <linearGradient id="fa" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={variant === 'light' ? "#5B50B0" : "#E0D8FF"}/>
            <stop offset="100%" stopColor={variant === 'light' ? "#26215C" : "#7B6FD8"}/>
          </linearGradient>
          <linearGradient id="fb" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={variant === 'light' ? "#7B6FD8" : "#C4BCFF"}/>
            <stop offset="100%" stopColor={variant === 'light' ? "#3C3489" : "#3C3489"}/>
          </linearGradient>
        </defs>

        {/* Left top face */}
        <polygon 
          points="31,3 4,28 31,41" 
          fill="rgba(155,143,255,0.04)" 
          stroke="url(#fa)" 
          strokeWidth="1.5" 
          strokeLinejoin="miter"
        />
        {/* Right top face */}
        <polygon 
          points="31,3 58,28 31,41" 
          fill="rgba(100,80,200,0.06)" 
          stroke="url(#fb)" 
          strokeWidth="1.5" 
          strokeLinejoin="miter"
        />
        {/* Left bottom face */}
        <polygon 
          points="4,28 31,41 31,73" 
          fill="rgba(60,52,137,0.08)" 
          stroke="url(#fb)" 
          strokeWidth="1.5" 
          strokeLinejoin="miter"
        />
        {/* Right bottom face */}
        <polygon 
          points="58,28 31,73 31,41" 
          fill="rgba(155,143,255,0.04)" 
          stroke="url(#fa)" 
          strokeWidth="1.5" 
          strokeLinejoin="miter"
        />

        {/* Equator line */}
        <line x1="4" y1="28" x2="58" y2="28" stroke={variant === 'light' ? "#534AB7" : "#9B8FFF"} strokeWidth="1" opacity="0.4"/>

        {/* Apex node */}
        <circle cx="31" cy="3" r="3" fill={variant === 'light' ? "#534AB7" : "#E0D8FF"}/>
        <circle cx="31" cy="3" r="5.5" fill="none" stroke={variant === 'light' ? "#534AB7" : "#C4BCFF"} strokeWidth="0.75" opacity="0.3"/>

        {/* Nadir node */}
        <circle cx="31" cy="73" r="2.8" fill={variant === 'light' ? "#26215C" : "#7B6FD8"}/>

        {/* Equator side nodes */}
        <circle cx="4" cy="28" r="2" fill={variant === 'light' ? "#7B6FD8" : "#AFA9EC"} opacity="0.7"/>
        <circle cx="58" cy="28" r="2" fill={variant === 'light' ? "#7B6FD8" : "#AFA9EC"} opacity="0.7"/>

        {/* Waist node — the "core" */}
        <circle cx="31" cy="41" r="2.5" fill="none" stroke={variant === 'light' ? "#534AB7" : "#C4BCFF"} strokeWidth="1.5"/>
        <circle cx="31" cy="41" r="1.1" fill={variant === 'light' ? "#3C3489" : "#DDD8FF"}/>
      </svg>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn(
            "font-black tracking-widest leading-none transition-colors duration-300",
            text,
            variant === 'light' ? "text-[#1A1035]" : "text-white"
          )}>
            TALVIX
          </span>
          <div className={cn(
            "hidden md:block h-px mt-1.5 mb-1",
            variant === 'light' 
              ? "bg-gradient-to-r from-[#7B6FD8] to-transparent" 
              : "bg-gradient-to-r from-[#9B8FFF] to-transparent"
          )} style={{ width: '100%' }} />
          <span className={cn(
            "hidden md:block text-[7px] font-mono font-medium tracking-[0.3em] uppercase leading-none",
            variant === 'light' ? "text-[#534AB7]/60" : "text-[#9B8FFF]/60"
          )}>
            Career Intelligence
          </span>
        </div>
      )}
    </div>
  )
}
