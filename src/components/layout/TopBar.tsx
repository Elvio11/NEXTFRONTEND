'use client'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { GlowButton } from '@/components/ui/GlowButton'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/jobs': 'Job Feed',
    '/applications': 'Applications',
    '/skill-gap': 'Skill Gap',
    '/settings': 'Settings',
}

export function TopBar() {
    const pathname = usePathname()
    const { profile } = useAuthStore()
    const router = useRouter()
    const title = pageTitles[pathname] ?? 'Talvix'
    const isPaid = profile?.subscription_tier === 'paid'

    const handleSignOut = async () => {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const firstLetter =
        profile?.id?.charAt(0).toUpperCase() ?? '?'

    return (
        <header className="bg-[rgba(5,5,5,0.8)] backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.08)] px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
            <h1 className="font-semibold text-[#f1f5f9] text-base">{title}</h1>

            <div className="flex items-center gap-3">
                {/* Subscription badge */}
                <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${isPaid
                            ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border border-[rgba(59,130,246,0.3)]'
                            : 'bg-[rgba(255,255,255,0.04)] text-[#64748b] border border-[rgba(255,255,255,0.08)]'
                        }`}
                >
                    {isPaid ? 'Pro' : 'Free'}
                </span>

                {/* Upgrade button (free users) */}
                {!isPaid && (
                    <GlowButton
                        variant="primary"
                        size="sm"
                        onClick={() => router.push('/settings')}
                    >
                        Upgrade
                    </GlowButton>
                )}

                {/* Avatar */}
                <button
                    onClick={handleSignOut}
                    className="w-9 h-9 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-sm font-bold text-[#3b82f6] hover:bg-[rgba(59,130,246,0.25)] transition-colors duration-200"
                    title="Sign out"
                >
                    {firstLetter}
                </button>
            </div>
        </header>
    )
}
