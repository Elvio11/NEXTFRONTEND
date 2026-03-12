'use client'
import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { TopBar } from './TopBar'

interface AppShellProps {
    children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const [, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-[#050505]">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-shrink-0">
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Tab Bar */}
            <div className="md:hidden">
                <BottomTabBar />
            </div>
        </div>
    )
}
