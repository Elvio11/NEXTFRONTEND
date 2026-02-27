'use client'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { GlassCard } from '@/components/ui/GlassCard'

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative">
            <GridBackground />
            <RadialGlow color="blue" position="top" />

            <div className="relative z-10 w-full max-w-sm">
                <GlassCard className="p-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="font-bold text-2xl text-[#f1f5f9]">Talvix</span>
                        <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-glowPulse" />
                    </div>

                    <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">Welcome back</h1>
                    <p className="text-[#64748b] mb-8 text-sm">
                        Sign in to your AI job engine
                    </p>

                    <GoogleSignIn />

                    <p className="text-xs text-[#334155] mt-6">
                        Free to start · Cancel anytime · No card required
                    </p>
                </GlassCard>
            </div>
        </main>
    )
}
