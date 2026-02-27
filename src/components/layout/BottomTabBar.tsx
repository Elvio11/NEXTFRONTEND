'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    TrendingUp,
    Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard, locked: false },
    { label: 'Jobs', href: '/jobs', icon: Briefcase, locked: false },
    { label: 'Apply', href: '/applications', icon: FileText, locked: true },
    { label: 'Skills', href: '/skill-gap', icon: TrendingUp, locked: false },
    { label: 'Settings', href: '/settings', icon: Settings2, locked: false },
]

export function BottomTabBar() {
    const pathname = usePathname()
    const { canViewApplications } = usePermissions()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#050505] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {navItems.map((item) => {
                const isLocked = item.locked && !canViewApplications
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                    <Link
                        key={item.href}
                        href={isLocked ? '#' : item.href}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1',
                            'h-11 min-w-[44px] px-2 text-xs rounded-lg transition-all duration-200',
                            isActive
                                ? 'text-[#3b82f6]'
                                : 'text-[#64748b] hover:text-[#f1f5f9]',
                            isLocked && 'opacity-40 cursor-not-allowed pointer-events-none'
                        )}
                        aria-disabled={isLocked}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="hidden sm:block">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
