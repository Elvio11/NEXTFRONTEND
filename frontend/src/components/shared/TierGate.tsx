'use client'

import { useAuthStore } from '@/stores/authStore'
import { TalvixUser } from '@/types/user'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlowButton } from '@/components/ui/GlowButton'
import { useRouter } from 'next/navigation'

interface TierGateProps {
  children: React.ReactNode
  requiredTier: TalvixUser['tier']
  className?: string
  fallback?: React.ReactNode
}

const tierWeights: Record<TalvixUser['tier'], number> = {
  'free': 1,
  'student': 2,
  'professional': 3,
  'executive': 4
}

export function TierGate({ children, requiredTier, className, fallback }: TierGateProps) {
  const { profile } = useAuthStore()
  const router = useRouter()
  const currentTier = profile?.tier || 'free'
  
  const hasAccess = tierWeights[currentTier] >= tierWeights[requiredTier]

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={cn(
      "relative group rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02] p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]",
      className
    )}>
      {/* Blurred Content Placeholder */}
      <div className="absolute inset-0 grayscale opacity-20 blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Access Denied Overlay */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.1)]">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        
        <div className="space-y-2 max-w-xs">
          <h3 className="text-lg font-black italic tracking-tighter text-white uppercase">
            Protocol Restricted
          </h3>
          <p className="text-[11px] text-content-subtle leading-relaxed font-medium">
            This module requires <span className="text-amber-400 font-bold uppercase tracking-widest">{requiredTier}</span> level clearance.
          </p>
        </div>

        <GlowButton 
          variant="primary" 
          size="sm" 
          onClick={() => router.push('/settings')}
          className="mt-2"
        >
          Upgrade Clearance
        </GlowButton>
      </div>
    </div>
  )
}
