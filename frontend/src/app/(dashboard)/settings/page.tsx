'use client'

import React from 'react'
import { ApplyPreferences } from '@/components/settings/ApplyPreferences'
import { DreamCompanies } from '@/components/settings/DreamCompanies'
import { BlacklistManager } from '@/components/settings/BlacklistManager'
import { GlassCard } from '@/components/ui/GlassCard'
import { ShieldCheck, Command, Lock, Smartphone, Globe, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboardStore'

export default function SettingsPage() {
  const { studentMode } = useDashboardStore()

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-6">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-500",
              studentMode ? "bg-accent-violet/10 border-accent-violet/20 shadow-glow-violet/5" : "bg-accent-blue/10 border-accent-blue/20 shadow-glow-blue/5"
            )}>
              <Command className={cn("w-6 h-6", studentMode ? "text-accent-violet" : "text-accent-blue")} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">System Config</h1>
              <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                 Swarm Orchestration Hub — v3.5.2-SWARM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-content-subtle">
              <Cloud className="w-3.5 h-3.5" />
              <span>Sync: Established</span>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Apply Logic */}
        <div className="space-y-8">
           <ApplyPreferences />
           
           {/* Platform Vault (Mock/Aero-V3 style) */}
           <GlassCard className="p-8 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Platform Vault</h2>
                  <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                    Secure Session Bridges
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-content-subtle" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white">LinkedIn Bridge</p>
                      <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-0.5">Active Session</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-content-subtle" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white">Indeed Bridge</p>
                      <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">Awaiting Vault Link</p>
                    </div>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-widest text-blue-400 border-b border-blue-400/30 pb-0.5">Secure Link</button>
                </div>
              </div>
           </GlassCard>
        </div>

        {/* Right Column: Company Preferences */}
        <div className="space-y-8">
           <DreamCompanies />
           <BlacklistManager />
           
           {/* Dangerous Operations */}
           <GlassCard className="p-8 border-red-500/10 bg-red-500/[0.01]">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-400/80 mb-4">Decommission Hub</h3>
              <p className="text-[10px] text-content-subtle font-mono tracking-tight mb-6">
                Irreversibly delete your talent profile and all application history.
              </p>
              <button className="w-full py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 transition-all">
                Deactivate Swarm Access
              </button>
           </GlassCard>
        </div>
      </div>
    </div>
  )
}
