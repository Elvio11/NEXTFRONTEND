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
  ZapOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboardStore'

const MENU_ITEMS = [
  { label: 'Command Center', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Job Swarm', icon: Briefcase, href: '/jobs' },
  { label: 'Deployments', icon: FileCheck, href: '/applications' },
  { label: 'Growth Hub', icon: GraduationCap, href: '/skill-gap' },
  { label: 'Daily Coach', icon: Zap, href: '/coach' },
  { label: 'System Config', icon: Settings, href: '/settings' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { studentMode } = useDashboardStore()

    return (
        <aside className="fixed left-0 top-[72px] bottom-0 w-64 bg-[#050505]/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-4 hidden lg:flex">
            {/* Swarm Status Indicator */}
            <div className="mb-8 p-4 rounded-3xl bg-blue-500/[0.02] border border-blue-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-700" />
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Swarm Health</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-black italic tracking-tighter text-blue-500 uppercase">Nominal</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 shadow-glow-blue animate-pulse" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-content-muted mb-4 px-2">Navigation Control</p>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group",
                                isActive 
                                    ? "bg-blue-600 text-white shadow-glow-blue" 
                                    : "text-content-subtle hover:bg-white/[0.03] hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-content-muted group-hover:text-blue-400")} />
                                <span className="text-[10px] font-black uppercase tracking-widest transition-all">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 text-white" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Footer */}
            <div className="mt-auto space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-2">Current Protocol</p>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow-green" />
                      <p className="text-[10px] font-black text-white italic tracking-tighter uppercase">Professional V1.4</p>
                   </div>
                </div>
                <p className="text-center text-[8px] font-black uppercase tracking-widest text-content-muted opacity-30">
                  Talvix Swarm &copy; 2026
                </p>
            </div>
        </aside>
    )
}
