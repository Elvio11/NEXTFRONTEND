'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/axios'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { usePermissions } from '@/hooks/usePermissions'
import { useDashboardStore } from '@/stores/dashboardStore'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { Settings2, Bell, Zap, ShieldCheck, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function ApplyPreferences() {
    const { user } = useAuthStore()
    const { studentMode } = useDashboardStore()
    const { canAutoApply } = usePermissions()
    const [pricingOpen, setPricingOpen] = useState(false)
    const supabase = getSupabaseClient()
    const queryClient = useQueryClient()

    const { data: profile } = useQuery({
        queryKey: ['user-profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('users')
                .select('id, subscription_tier, wa_connected, auto_apply_paused')
                .eq('id', user!.id)
                .single()
            return data as any
        },
    })

    const toggleAutoApply = useMutation({
        mutationFn: (enabled: boolean) =>
            api.patch('/api/users/auto-apply', { auto_apply_enabled: enabled }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
        },
    })

    const isAutoApplyActive = !profile?.auto_apply_paused

    return (
        <div className="space-y-6">
            <GlassCard className="p-8 border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl border",
                        studentMode ? "bg-accent-violet/10 border-accent-violet/20" : "bg-accent-blue/10 border-accent-blue/20"
                      )}>
                        <Settings2 className={cn("w-5 h-5", studentMode ? "text-accent-violet" : "text-accent-blue")} />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Apply Preferences</h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                          Configure Swarm Execution & Alerts
                        </p>
                      </div>
                  </div>
                  
                  {isAutoApplyActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] font-bold uppercase tracking-widest text-green-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Setu Bridge Ready</span>
                    </div>
                  )}
                </div>

                {/* Auto-apply Control */}
                <div className="relative mb-8">
                    <div
                        className={cn(
                          "flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/10 transition-all duration-500",
                          !canAutoApply && "blur-md pointer-events-none select-none",
                          isAutoApplyActive && "border-blue-500/30 bg-blue-500/5 shadow-glow-blue/5"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                              "p-3 rounded-2xl transition-all duration-500",
                              isAutoApplyActive ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-content-subtle"
                            )}>
                              <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest text-white">Auto-Deployment (Setu)</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-content-subtle" />
                                  <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                                    8 PM – 6 AM IST Active Window
                                  </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 md:mt-0">
                          <button
                              onClick={() => toggleAutoApply.mutate(!isAutoApplyActive)}
                              className={cn(
                                "group relative w-16 h-8 rounded-full transition-all duration-500 p-1 flex items-center",
                                isAutoApplyActive ? "bg-blue-500 shadow-glow-blue" : "bg-white/10"
                              )}
                          >
                              <motion.div 
                                animate={{ x: isAutoApplyActive ? 32 : 0 }}
                                className="w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center"
                              >
                                {isAutoApplyActive && <Check className="w-3 h-3 text-blue-500" />}
                              </motion.div>
                          </button>
                        </div>
                    </div>

                    {!canAutoApply && (
                        <UpgradeCTA
                            feature="auto_apply"
                            onUpgrade={() => setPricingOpen(true)}
                        />
                    )}
                </div>

                {/* Notifications & Connectivity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 group-hover:scale-105 transition-transform">
                        <Bell className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">WhatsApp Hub</p>
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mt-1",
                            profile?.wa_connected ? "text-green-500" : "text-content-subtle"
                          )}>
                              {profile?.wa_connected ? 'Encrypted Connection Active' : 'Gateway Offline'}
                          </p>
                      </div>
                      {!profile?.wa_connected && (
                          <GlowButton variant="ghost" size="sm" href="/onboarding" className="h-8 text-[9px]">
                              Secure
                          </GlowButton>
                      )}
                  </div>

                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <Zap className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">Telegram Bridge</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-blue-400">
                             Primary Protocol Ready
                          </p>
                      </div>
                  </div>
                </div>
            </GlassCard>

            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </div>
    )
}
