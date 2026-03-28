'use client'

import React from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { ShieldCheck, LogIn, Chrome, Mail, Sparkles, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <GridBackground />
      <RadialGlow color="blue" position="top" />
      
      {/* Dynamic Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 group hover:border-blue-500/40 transition-all cursor-default">
             <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Secure Swarm Entry</span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            Welcome to<br /><span className="text-blue-500">The Swarm.</span>
          </h1>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-[0.2em] mt-4">
            Aero-V3 Agent Intelligence Hub
          </p>
        </motion.div>

        <GlassCard className="p-10 border-white/5 bg-white/[0.01] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
          
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] group"
            >
              <Chrome className="w-4 h-4" />
              <span>Connect with Google Artifact</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-content-muted">Identity Protocol</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <button
              disabled
              className="w-full h-14 rounded-2xl bg-white/[0.02] border border-white/10 text-content-subtle font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>Email Protocol (Coming Soon)</span>
            </button>
          </div>

          <div className="mt-10 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-3">
               <UserCircle className="w-4 h-4 text-blue-400" />
               <p className="text-[9px] font-bold text-content-muted uppercase tracking-tight leading-relaxed">
                 Aero-V3 uses <span className="text-white">Supabase Auth</span> for AES-256 session encryption. Your talent artifacts remain secure within the swarm.
               </p>
            </div>
          </div>
        </GlassCard>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-8 text-center"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-content-muted">
            Talvix Intelligence &copy; 2026 • Phase 6.1 Stable
          </p>
        </motion.div>
      </div>
    </div>
  )
}
