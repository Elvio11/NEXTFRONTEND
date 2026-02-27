'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    TrendingUp,
    Settings2,
    Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, locked: false },
    { label: 'Jobs', href: '/jobs', icon: Briefcase, locked: false },
    { label: 'Applications', href: '/applications', icon: FileText, locked: true },
    { label: 'Skill Gap', href: '/skill-gap', icon: TrendingUp, locked: false },
    { label: 'Settings', href: '/settings', icon: Settings2, locked: false },
]

interface SidebarProps {
    onClose?: () => void
}

export function Sidebar({ onClose: _onClose }: SidebarProps) {
    const pathname = usePathname()
    const { canViewApplications } = usePermissions()

    return (
        <aside className="flex flex-col w-full h-screen bg-[#050505] border-r border-[rgba(255,255,255,0.08)] sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-2 px-6 py-5 border-b border-[rgba(255,255,255,0.08)]">
                <span className="font-bold text-xl text-[#f1f5f9] tracking-tight">
                    Talvix
                </span>
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-glowPulse" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isLocked = item.locked && !canViewApplications
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon

                    if (isLocked) {
                        return (
                            <div
                                key={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                                    'text-[#334155] cursor-not-allowed'
                                )}
                                title="Upgrade to unlock"
                            >
                                <Lock className="w-4 h-4 flex-shrink-0" />
                                <span>{item.label}</span>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'border-l-2 border-[#3b82f6] bg-[rgba(255,255,255,0.04)] text-[#f1f5f9] pl-[10px]'
                                    : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.04)]'
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
