'use client'

'use client'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { useDashboardStore } from '@/stores/dashboardStore'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
    children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { studentMode } = useDashboardStore()

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans">
            <GridBackground />
            <RadialGlow color={studentMode ? 'violet' : 'blue'} position="top" />
            
            {/* Layout background orbs */}
            <div className={cn(
                "absolute top-0 -left-20 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-all duration-1000",
                studentMode ? "bg-violet-600/10" : "bg-blue-600/10"
            )} />
            <div className={cn(
                "absolute bottom-0 -right-20 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-all duration-1000",
                studentMode ? "bg-violet-600/10" : "bg-blue-600/10"
            )} />

            <main className="flex-1 lg:pl-64 pt-[72px] relative z-20">
                <div className="max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </div>
    )
}
