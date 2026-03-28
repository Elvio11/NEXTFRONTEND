'use client'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { DashboardShell } from './DashboardShell'
import { usePathname } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { useAuthStore } from '@/stores/authStore'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname()
    const { initialized } = useAuthStore()
    
    const isDashboard = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/jobs') || 
                        pathname.startsWith('/applications') ||
                        pathname.startsWith('/skill-gap') ||
                        pathname.startsWith('/coach') ||
                        pathname.startsWith('/settings')

    // Initial session handshake — prevent UI flicker on protected routes
    if (isDashboard && !initialized) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/50">
                        Synchronizing Swarm Session...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#050505] selection:bg-blue-500/30">
                <Navbar />
                
                {isDashboard ? (
                    <>
                        <Sidebar />
                        <DashboardShell>{children}</DashboardShell>
                    </>
                ) : (
                    <main className="relative z-10 pt-[72px]">
                        {children}
                    </main>
                )}
            </div>
        </TooltipProvider>
    )
}
