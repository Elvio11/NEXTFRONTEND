'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Search, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StudentModeToggle } from '@/components/ui/StudentModeToggle'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'

export function Navbar() {
    const pathname = usePathname()
    const { profile } = useAuthStore()
    const { studentMode } = useDashboardStore()
    const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/jobs') && !pathname.startsWith('/applications')

    return (
        <nav className={cn(
          "fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center px-6 transition-all duration-500",
          isPublic ? "bg-transparent backdrop-blur-sm" : "bg-[#050505]/50 backdrop-blur-xl border-b border-white/5"
        )}>
            <div className="flex-1 flex items-center justify-between max-w-7xl mx-auto w-full">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                   <div className={cn(
                     "p-2 rounded-xl border transition-all duration-500 shadow-glow-blue/10",
                     studentMode 
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400 group-hover:shadow-glow-violet/20" 
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400 group-hover:shadow-glow-blue/20"
                   )}>
                      <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-black italic tracking-tighter text-white uppercase group-hover:text-blue-400 transition-colors">Talvix</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Aero-V3 Swarm</span>
                   </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                   {isPublic ? (
                     <>
                        <Link href="/swarm" className="text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-white transition-colors">The Swarm</Link>
                        <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-white transition-colors">Pricing</Link>
                        <Link href="/success" className="text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-white transition-colors">Success Wall</Link>
                     </>
                   ) : (
                     <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-subtle group-focus-within:text-blue-400 transition-colors" />
                        <input 
                           type="text" 
                           placeholder="Search Swarm Activity..." 
                           className="h-9 w-64 bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-content-subtle/50 focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                        />
                     </div>
                   )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <StudentModeToggle />
                    
                    {!isPublic && (
                      <button className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-content-subtle hover:text-blue-400 hover:border-blue-500/20 transition-all group relative">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-glow-blue" />
                      </button>
                    )}

                    {profile ? (
                      <Link href="/dashboard" className="p-1 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all bg-white/[0.02]">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-black text-white text-[10px]">
                           {profile.id?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </Link>
                    ) : (
                      <Link 
                        href="/login" 
                        className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-glow-blue hover:bg-blue-500 transition-all flex items-center"
                      >
                        Enter Swarm
                      </Link>
                    )}

                    <button className="md:hidden p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white">
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </nav>
    )
}
