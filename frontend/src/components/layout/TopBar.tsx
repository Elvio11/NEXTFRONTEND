'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { GlowButton } from '@/components/ui/GlowButton'
import { StudentModeToggle } from '@/components/ui/StudentModeToggle'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Command, LogOut, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Command Center',
    '/jobs': 'Job Swarm',
    '/applications': 'Deployment Tracker',
    '/skill-gap': 'Intelligence Growth',
    '/settings': 'System Config',
}

export function TopBar() {
    const pathname = usePathname()
    const { profile } = useAuthStore()
    const { studentMode } = useDashboardStore()
    const router = useRouter()
    const title = pageTitles[pathname] ?? 'Talvix OS'
    const isPaid = profile?.subscription_tier === 'paid'

    const handleSignOut = async () => {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
            {/* Left: Page Title & Mode Signal */}
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                <Command className="w-6 h-6 text-blue-500" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-mono font-black italic tracking-tighter text-white uppercase">
                  {title}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    studentMode ? "bg-accent-violet" : "bg-accent-blue"
                  )} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-content-subtle">
                    {studentMode ? 'Student Protocol' : 'Pro Swarm Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-4 md:gap-8">
                {/* Mode Toggle */}
                <div className="hidden lg:block">
                  <StudentModeToggle />
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider",
                    isPaid 
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                      : "bg-white/5 border-white/10 text-content-subtle"
                  )}>
                    {isPaid ? <ShieldCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    {isPaid ? 'Tier: Pro' : 'Tier: Free'}
                  </div>

                  {!isPaid && (
                      <GlowButton
                          variant="primary"
                          size="sm"
                          onClick={() => router.push('/settings')}
                          className="px-4 h-8 text-[10px] uppercase font-black"
                      >
                          Upgrade
                      </GlowButton>
                  )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                      Operational
                    </p>
                    <p className="text-[9px] text-content-subtle mt-1">
                      ID: {profile?.id?.slice(0, 8) || 'Unknown'}
                    </p>
                  </div>
                  <button
                      onClick={handleSignOut}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300",
                        "bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      )}
                      title="Initiate Logout"
                  >
                      <LogOut className="w-4 h-4" />
                  </button>
                </div>
            </div>
        </header>
    )
}
