'use client'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { DashboardShell } from './DashboardShell'
import { usePathname } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/Tooltip'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/jobs') || 
                        pathname.startsWith('/applications') ||
                        pathname.startsWith('/skill-gap') ||
                        pathname.startsWith('/coach') ||
                        pathname.startsWith('/settings')

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
