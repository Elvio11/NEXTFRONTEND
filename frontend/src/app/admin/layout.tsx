import { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 font-sans tracking-tight">
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent)] opacity-5 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-tr from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />
            
            <main className="relative z-10">
                {children}
            </main>

            {/* Admin-only subtle corner indicator */}
            <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">Admin Protocol Active</span>
            </div>
        </div>
    )
}
