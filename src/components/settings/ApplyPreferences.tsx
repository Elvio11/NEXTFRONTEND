'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/axios'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { usePermissions } from '@/hooks/usePermissions'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { Settings2, Bell, Zap } from 'lucide-react'


export function ApplyPreferences() {
    const { user } = useAuthStore()
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
                .select('id, subscription_tier, wa_connected, onboarding_complete, persona, dashboard_ready')
                .eq('id', user!.id)
                .single()
            return data
        },
    })

    const toggleAutoApply = useMutation({
        mutationFn: (enabled: boolean) =>
            api.patch('/api/users/auto-apply', { auto_apply_enabled: enabled }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
        },
    })

    return (
        <>
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Settings2 className="w-5 h-5 text-[#3b82f6]" />
                    <h2 className="font-semibold text-[#f1f5f9]">Apply Preferences</h2>
                </div>

                {/* Auto-apply toggle — locked for state 1-2 */}
                <div className="relative mb-6">
                    <div
                        className={`flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] ${!canAutoApply ? 'blur-sm pointer-events-none select-none' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-[#3b82f6]" />
                            <div>
                                <p className="text-sm font-medium text-[#f1f5f9]">Auto-apply</p>
                                <p className="text-xs text-[#64748b]">8 PM – 6 AM IST window</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAutoApply.mutate(true)}
                            className="w-11 h-6 rounded-full bg-[#3b82f6] relative transition-colors duration-200"
                        >
                            <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                    </div>
                    {!canAutoApply && (
                        <UpgradeCTA
                            feature="auto_apply"
                            onUpgrade={() => setPricingOpen(true)}
                        />
                    )}
                </div>

                {/* Notifications */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                    <Bell className="w-4 h-4 text-[#64748b]" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[#f1f5f9]">WhatsApp Notifications</p>
                        <p className="text-xs text-[#64748b]">
                            {profile?.wa_connected ? 'Connected' : 'Not connected'}
                        </p>
                    </div>
                    {!profile?.wa_connected && (
                        <GlowButton variant="ghost" size="sm" href="/onboarding">
                            Connect
                        </GlowButton>
                    )}
                </div>
            </GlassCard>

            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </>
    )
}

