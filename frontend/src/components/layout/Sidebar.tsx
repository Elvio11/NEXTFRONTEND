'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Briefcase, 
  FileCheck, 
  Zap, 
  GraduationCap, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  Palette,
  X,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboardStore'
import { Logo } from '@/components/ui/Logo'

const MENU_ITEMS = [
  { label: 'Command Center', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Job Swarm', icon: Briefcase, href: '/jobs' },
  { label: 'Deployments', icon: FileCheck, href: '/applications' },
  { label: 'Growth Hub', icon: GraduationCap, href: '/skill-gap' },
  { label: 'Daily Coach', icon: Zap, href: '/coach' },
  { label: 'System Config', icon: Settings, href: '/settings' },
]

const THEMES = [
  { id: 'master', label: 'Aero', color: '#3b82f6' },
  { id: 'swarm', label: 'Swarm', color: '#8b5cf6' },
  { id: 'cyber', label: 'Cyber', color: '#ca8a04' },
  { id: 'onyx', label: 'Onyx', color: '#64748b' },
] as const

export function Sidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useDashboardStore()
    const [isOpen, setIsOpen] = React.useState(false)

    // Listen for mobile drawer toggle events (to be triggered by Navbar)
    React.useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev)
        window.addEventListener('toggle-mobile-sidebar', handleToggle)
        return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle)
    }, [])

    const sidebarContent = (
        <>
            {/* Header / Brand (Mobile Only / Hefty Top) */}
            <div className="flex items-center justify-between mb-8 lg:mb-10 px-2">
                <Link href="/" className="flex items-center gap-3">
                    <Logo size="sm" iconOnly variant="dark" />
                    <div className="flex flex-col">
                        <span className="text-sm font-black italic tracking-tighter text-white uppercase">Talvix</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Aero-V3 Swarm</span>
                    </div>
                </Link>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Persona Summary */}
            <div className="mb-8 p-4 rounded-3xl bg-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all duration-700" />
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Protocol Alpha</span>
                        <span className="text-[8px] font-black text-accent uppercase tracking-widest">Active Sync</span>
                    </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[65%]" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-content-muted mb-4 px-2">Core Access</p>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group",
                                isActive 
                                    ? "bg-accent text-white shadow-[0_0_20px_var(--accent-glow)]" 
                                    : "text-content-subtle hover:bg-white/[0.03] hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-content-muted group-hover:text-accent")} />
                                <span className="text-[10px] font-black uppercase tracking-widest transition-all">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 text-white" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Theme & Meta */}
            <div className="mt-8 space-y-6">
                {/* Theme Switcher */}
                <div className="p-4 rounded-3xl bg-[#0a0a0a] border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-3.5 h-3.5 text-content-muted" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-content-muted">Visual Theme</span>
                    </div>
                    <div className="flex items-center justify-between">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                title={t.label}
                                className={cn(
                                    "w-8 h-8 rounded-xl border transition-all flex items-center justify-center group",
                                    theme === t.id 
                                        ? "border-accent scale-110 shadow-[0_0_10px_var(--accent-glow)]" 
                                        : "border-white/5 hover:border-white/20"
                                )}
                            >
                                <div 
                                    className="w-4 h-4 rounded-md" 
                                    style={{ backgroundColor: t.color }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Swarm Status */}
                <div className="p-4 rounded-3xl bg-accent/[0.02] border border-accent/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[14px] font-black italic tracking-tighter text-accent uppercase">Nominal</span>
                        </div>
                        <span className="flex h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)] animate-pulse" />
                    </div>
                </div>

                <p className="text-center text-[7px] font-black uppercase tracking-widest text-content-muted opacity-30">
                  Talvix Swarm Core &copy; 2026
                </p>
            </div>
        </>
    )

    return (
        <>
            {/* Desktop Hefty Panel */}
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#050505] border-r border-white/5 flex flex-col p-6 hidden lg:flex z-50">
                {sidebarContent}
            </aside>

            {/* Mobile Full-screen Drawer */}
            <div 
                className={cn(
                    "fixed inset-0 z-[100] bg-black/80 backdrop-blur-md lg:hidden transition-all duration-500",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            >
                <aside 
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#050505] p-6 flex flex-col transition-transform duration-500 ease-out",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {sidebarContent}
                </aside>
            </div>
        </>
    )
}
