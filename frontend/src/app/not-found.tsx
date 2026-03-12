'use client'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { GridBackground } from '@/components/ui/GridBackground'

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative">
            <GridBackground />
            <div className="relative z-10 max-w-md w-full">
                <GlassCard className="p-10 text-center">
                    <p className="text-7xl font-extrabold text-[#334155] mb-4">404</p>
                    <h1 className="text-2xl font-bold text-[#f1f5f9] mb-3">Page not found</h1>
                    <p className="text-[#64748b] mb-8 text-sm">
                        The page you&apos;re looking for doesn&apos;t exist.
                    </p>
                    <GlowButton variant="primary" size="md" href="/dashboard">
                        Back to Dashboard
                    </GlowButton>
                </GlassCard>
            </div>
        </main>
    )
}
