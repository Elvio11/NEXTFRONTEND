'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/GlassCard'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useDashboardStore } from '@/stores/dashboardStore'
import { MessageSquare, Sparkles, Zap, ShieldCheck, History, Send, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface CoachMessage {
    id: string
    created_at: string
    message: string
    type: string
}

function formatISTDate(dateString: string): string {
    const date = new Date(dateString)
    const istOffset = 5.5 * 60 * 60 * 1000
    const istDate = new Date(date.getTime() + istOffset)
    return istDate.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export default function CoachPage() {
    const { canViewApplications, user } = usePermissions()
    const { studentMode } = useDashboardStore()
    const [messages, setMessages] = useState<CoachMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [pricingOpen, setPricingOpen] = useState(false)

    useEffect(() => {
        const supabase = getSupabaseClient()
        async function fetchMessages() {
            if (!user?.id) return

            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('type', 'coach')
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (error) throw error
                setMessages(data || [])
            } catch (err) {
                console.error('Error fetching coach messages:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()
    }, [user])

    if (!canViewApplications) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <GlassCard className="flex flex-col items-center justify-center min-h-[500px] text-center p-12 border-white/5 bg-white/[0.01]">
                    <div className={cn(
                      "p-6 rounded-full border mb-8 relative",
                      studentMode ? "bg-accent-violet/10 border-accent-violet/20" : "bg-accent-blue/10 border-accent-blue/20"
                    )}>
                        <Sparkles className={cn("w-12 h-12", studentMode ? "text-accent-violet" : "text-accent-blue")} />
                        <div className="absolute inset-0 blur-2xl opacity-20 bg-current rounded-full animate-pulse" />
                    </div>
                    
                    <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-4">
                        Daily Coach Guru
                    </h1>
                    <p className="text-content-muted text-sm max-w-md mx-auto mb-8 font-mono leading-relaxed">
                        Guru's intelligence protocol is currently offline for your tier. Upgrade to initiate daily career coaching and strategic market mapping.
                    </p>
                    
                    <UpgradeCTA
                        feature="coaching"
                        onUpgrade={() => setPricingOpen(true)}
                    />
                </GlassCard>
                <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 px-6">
            {/* Coach Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "p-4 rounded-2xl border",
                    studentMode ? "bg-accent-violet/10 border-accent-violet/20" : "bg-accent-blue/10 border-accent-blue/20"
                  )}>
                    <MessageSquare className={cn("w-6 h-6", studentMode ? "text-accent-violet" : "text-accent-blue")} />
                  </div>
                  <div>
                    <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">Daily Coach Hub</h1>
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                       Guru's Strategic Commands — Active on {studentMode ? 'Student' : 'Professional'} Protocol
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end mr-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">WhatsApp Mode</span>
                      <div className="flex items-center gap-1.5 mt-1 text-green-500">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Wired</span>
                      </div>
                   </div>
                   <div className="h-8 w-px bg-white/10" />
                   <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-content-subtle hover:text-white transition-all">
                      <Smartphone className="w-5 h-5" />
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-content-subtle" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-content-subtle">Command Log</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-content-muted">Last 7 Days</span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="p-5 rounded-full bg-white/[0.02] border border-white/5">
                          <Zap className="w-8 h-8 text-content-subtle opacity-20" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-white font-black uppercase tracking-widest text-xs">Waiting for Guru's signal</p>
                          <p className="text-content-muted font-mono text-[10px] tracking-tight max-w-xs mx-auto">
                            Daily coaching missions are dispatched every morning at 7 AM IST directly to your hub.
                          </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {messages.map((msg, i) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <GlassCard className="p-6 bg-white/[0.01] border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-start gap-5">
                                        <div className={cn(
                                          "p-2.5 rounded-xl border mt-1",
                                          studentMode ? "bg-accent-violet/10 border-accent-violet/20" : "bg-accent-blue/10 border-accent-blue/20"
                                        )}>
                                            <Sparkles className={cn("w-4 h-4", studentMode ? "text-accent-violet" : "text-accent-blue")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-content-subtle">
                                              <span>Guru Intelligence Dispatch</span>
                                              <span>{formatISTDate(msg.created_at)}</span>
                                            </div>
                                            <p className="text-[13px] text-white/90 leading-relaxed font-medium">
                                                {msg.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                              <button className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                                <Send className="w-3 h-3" />
                                                <span>Forward to WA</span>
                                              </button>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                    </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <GlassCard className="p-6 bg-accent-blue/5 border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-4">Guru's Mission</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-glow-blue" />
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        Identify market trends before they hit the mainstream boards.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-glow-blue" />
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        Calibrate your focus toward high-ROI skill acquisitions.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-glow-blue" />
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        Deliver tactical 1% improvements to your career trajectory.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">System Logs</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                      <span className="text-content-subtle">Last Analysis</span>
                      <span className="text-white">6h ago</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                      <span className="text-content-subtle">Success Rate</span>
                      <span className="text-green-400">+14% Target</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
    )
}
