'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Lock, ShieldCheck, Globe, Smartphone, ShieldAlert, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/axios'

interface TheVaultProps {
  onComplete: () => void
}

export function TheVault({ onComplete }: TheVaultProps) {
  const [linked, setLinked] = useState<string[]>([])
  const [linking, setLinking] = useState<string | null>(null)
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [activePlatform, setActivePlatform] = useState<'linkedin' | 'indeed' | null>(null)
  const [modalErr, setModalErr] = useState('')

  const handleOpenModal = (platform: 'linkedin' | 'indeed') => {
    setActivePlatform(platform)
    setModalErr('')
    setShowModal(true)
  }

  const handleInteractiveLink = async () => {
    if (!activePlatform) return
    
    setLinking(activePlatform)
    setModalErr('')
    
    try {
      // This hits Server 1, which forwards to Agent 16 on Server 3
      const { data } = await api.post('/api/vault/interactive-link', {
        platform: activePlatform
      })
      
      if (data.status === 'success') {
        setLinked(prev => [...prev, activePlatform])
        setTimeout(() => setShowModal(false), 1500)
      } else {
        setModalErr(data.error || 'Capture timed out or failed.')
      }
    } catch (err: any) {
      setModalErr(err.response?.data?.error || 'Failed to start interactive bridge.')
    } finally {
      setLinking(null)
    }
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
          Establish a secure session bridge to LinkedIn and Indeed. This allows Setu (Auto-Applier) to execute deployments directly from your account.
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
                  {linked.includes('linkedin') ? "Session ID: AES-256-Active" : "Protocol Offline"}
                </p>
              </div>

              {!linked.includes('linkedin') && (
                <button 
                  onClick={() => handleOpenModal('linkedin')}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-3 h-3" />
                  <span>Establish Bridge</span>
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
                  {linked.includes('indeed') ? "Session ID: AES-256-Active" : "Protocol Offline"}
                </p>
              </div>

              {!linked.includes('indeed') && (
                <button 
                  onClick={() => handleOpenModal('indeed')}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-3 h-3" />
                  <span>Establish Bridge</span>
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
                Vault sessions are ephemeral. If Setu detects a session disconnect, you will be notified via Telegram to re-link. No passwords are stored; only secure session artifacts.
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

      {/* Vault Credential Modal */}
      {showModal && activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="p-8 w-full max-w-md bg-[#0a0a0a] border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-content-subtle transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                {activePlatform === 'linkedin' ? <Globe className="w-5 h-5 text-blue-400" /> : <Smartphone className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Sync {activePlatform === 'linkedin' ? 'LinkedIn' : 'Indeed'}
                </h3>
                <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mt-0.5">
                   Interactive Vault Protocol v4
                </p>
              </div>
            </div>

            <p className="text-[11px] text-content-subtle leading-relaxed mb-8">
              Establish a secure bridge to your {activePlatform} account. This launches a guided login window; we only capture the session token, never your credentials.
            </p>

            <div className="space-y-6">
              <button
                onClick={handleInteractiveLink}
                disabled={linking === activePlatform || linked.includes(activePlatform)}
                className={cn(
                   "w-full p-6 rounded-2xl transition-all text-left flex items-center gap-5 group",
                   linked.includes(activePlatform) 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-blue-600 hover:bg-blue-500 shadow-glow-blue/20"
                )}
              >
                <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                  {linked.includes(activePlatform) ? <ShieldCheck className="w-6 h-6 text-green-400" /> : <Globe className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white">
                    {linked.includes(activePlatform) ? "Bridge Verified" : "Start Interactive Login"}
                  </p>
                  <p className={cn(
                    "text-[8px] font-bold uppercase tracking-tighter mt-1 opacity-80",
                    linked.includes(activePlatform) ? "text-green-300" : "text-blue-100"
                  )}>
                    {linked.includes(activePlatform) ? "AES-256 Encryption Active" : "Headed Session Capture (Standard)"}
                  </p>
                </div>
                {linking === activePlatform ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   !linked.includes(activePlatform) && <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              {modalErr && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake duration-300">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {modalErr}
                </div>
              )}

              <div className="pt-2">
                 <p className="text-[8px] font-bold text-center text-content-muted uppercase tracking-[0.3em]">
                    End-to-End Secure • ISO 27001 Logic
                 </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </GlassCard>
  )
}
