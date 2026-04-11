'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { Logo } from '@/components/ui/Logo'

export default function AdminLoginPage() {
    const [id, setId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        // Hardcoded for baseline calibration phase as requested
        if (id === 'admin@talvix.ai' && password === 'talvix-calib-2024') {
            localStorage.setItem('admin_auth', 'true')
            router.push('/admin/calibration')
        } else {
            setError('Invalid credentials for baseline calibration.')
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black opacity-50 pointer-events-none" />
            
            <GlassCard className="w-full max-max-w-md p-8 border-blue-500/30">
                <div className="flex flex-col items-center gap-6">
                    <Logo className="w-24 h-24 mb-2" />
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Calibration</h1>
                    <p className="text-blue-200/60 text-sm text-center">
                        Access restricted to system architects.
                    </p>

                    <form onSubmit={handleLogin} className="w-full space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider ml-1">Admin ID</label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="w-full bg-blue-950/20 border border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                placeholder="admin@talvix.ai"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-blue-950/20 border border-blue-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center font-medium animate-pulse">
                                {error}
                            </p>
                        )}

                        <GlowButton type="submit" className="w-full mt-6 py-4 rounded-xl font-bold text-lg">
                            IDENTIFY & ENTER
                        </GlowButton>
                    </form>

                    <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-500/40 uppercase tracking-[0.2em]">
                        <span className="w-8 h-[1px] bg-blue-500/20" />
                        SECURE BASELINE ACCESS
                        <span className="w-8 h-[1px] bg-blue-500/20" />
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}
