'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Lock, ShieldCheck, Globe, Smartphone, ShieldAlert, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'


interface TheVaultProps {
  onComplete: () => void
}

export function TheVault({ onComplete }: TheVaultProps) {
  const [linked, setLinked] = useState<string[]>([])
  const [linking, setLinking] = useState<string | null>(null)

  const simulateLink = (platform: string) => {
    setLinking(platform)
    setTimeout(() => {
      setLinked(prev => [...prev, platform])
      setLinking(null)
    }, 2000)
  }

  return (
    <GlassCard className="p-8 max-w-3xl mx-auto border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-glow-blue/5">
          <Lock className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 07: The Vault Protocol</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Secure Platform Bridge — Tier 1 Auto-Deployment
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <p className="text-[10px] font-bold text-content-muted uppercase tracking-tighter leading-relaxed font-mono">
          Establish a secure session bridge to LinkedIn and Indeed. This allows Setu (Auto-Applier) to execute deployments directly from your account without manual intervention.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Section: LinkedIn */}
           <div className={cn(
             "p-6 rounded-3xl border transition-all duration-500 group relative overflow-hidden",
             linked.includes('linkedin') ? "bg-blue-500/10 border-blue-500/30" : "bg-white/[0.02] border-white/10"
           )}>
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-500",
                  linked.includes('linkedin') ? "bg-blue-500 text-white shadow-glow-blue" : "bg-white/5 text-content-subtle"
                )}>
                  <Globe className="w-5 h-5" />
                </div>
                {linked.includes('linkedin') && (
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-white">LinkedIn Swarm Bridge</p>
                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tighter">
                  {linked.includes('linkedin') ? "Session ID: AES-256-Active" : "Protocol Offline — Manual Required"}
                </p>
              </div>

              {!linked.includes('linkedin') && (
                <button 
                  onClick={() => simulateLink('linkedin')}
                  disabled={linking === 'linkedin'}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {linking === 'linkedin' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Linking Vault...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Establish Bridge</span>
                    </>
                  )}
                </button>
              )}
           </div>

           {/* Section: Indeed */}
           <div className={cn(
             "p-6 rounded-3xl border transition-all duration-500 group relative overflow-hidden",
             linked.includes('indeed') ? "bg-blue-500/10 border-blue-500/30" : "bg-white/[0.02] border-white/10"
           )}>
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-500",
                  linked.includes('indeed') ? "bg-blue-500 text-white shadow-glow-blue" : "bg-white/5 text-content-subtle"
                )}>
                  <Smartphone className="w-5 h-5" />
                </div>
                {linked.includes('indeed') && (
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-white">Indeed Swarm Bridge</p>
                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tighter">
                  {linked.includes('indeed') ? "Session ID: AES-256-Active" : "Protocol Offline — Manual Required"}
                </p>
              </div>

              {!linked.includes('indeed') && (
                <button 
                  onClick={() => simulateLink('indeed')}
                  disabled={linking === 'indeed'}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                   {linking === 'indeed' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Linking Vault...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Establish Bridge</span>
                    </>
                  )}
                </button>
              )}
           </div>
        </div>

        {/* Security Warning */}
        <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-start gap-4">
           <ShieldAlert className="w-5 h-5 text-orange-400 mt-0.5" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Security Notice</p>
              <p className="text-[9px] font-bold text-content-muted uppercase tracking-tight mt-1 leading-relaxed">
                Vault sessions are ephemeral. If Setu detects a session disconnect, you will be notified via Telegram to re-link your vault protocol. No passwords are stored; only secure session artifacts.
              </p>
           </div>
        </div>

        {/* Action */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onComplete}
            className="flex-1 py-4 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-blue transition-all active:scale-[0.98] group"
          >
           <span className="flex items-center justify-center gap-3">
              Finalize Swarm Sync
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </span>
          </button>
          
          <button 
            onClick={onComplete}
            className="py-4 px-8 rounded-3xl bg-white/[0.02] border border-white/10 text-[10px] font-black uppercase tracking-widest text-content-subtle hover:text-white transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
