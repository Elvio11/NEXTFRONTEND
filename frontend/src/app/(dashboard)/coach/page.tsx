'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/GlassCard'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { PricingModal } from '@/components/upgrade/PricingModal'
import { usePermissions } from '@/hooks/usePermissions'
import { MessageCircle, Clock, Sparkles } from 'lucide-react'

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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export default function CoachPage() {
    const { canViewApplications, user } = usePermissions()
    const [messages, setMessages] = useState<CoachMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [pricingOpen, setPricingOpen] = useState(false)

    useEffect(() => {
        const supabase = getSupabaseClient()
        async function fetchMessages() {
            if (!user) return

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
            <div className="max-w-4xl mx-auto">
                <GlassCard className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center p-8">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#3b82f6]" />
                        <p className="text-[#f1f5f9] font-semibold text-lg mb-4">
                            Daily Career Coaching
                        </p>
                        <UpgradeCTA
                            feature="coaching"
                            onUpgrade={() => setPricingOpen(true)}
                        />
                    </div>
                </GlassCard>
                <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[rgba(59,130,246,0.1)]">
                    <MessageCircle className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#f1f5f9]">Daily Coach</h1>
                    <p className="text-sm text-[#64748b]">
                        Personalized career guidance delivered daily at 7 AM IST
                    </p>
                </div>
            </div>

            <GlassCard className="p-4">
                <div className="flex items-center gap-2 text-sm text-[#64748b] mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Coaching runs at 7 AM IST for paid users</span>
                </div>
            </GlassCard>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]" />
                </div>
            ) : messages.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageCircle className="w-12 h-12 text-[#334155] mb-4" />
                    <p className="text-[#f1f5f9] font-medium mb-2">
                        Your daily coaching messages will appear here
                    </p>
                    <p className="text-sm text-[#64748b]">
                        Coaching runs at 7 AM IST for paid users
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <GlassCard key={msg.id} className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[rgba(59,130,246,0.1)] mt-1">
                                    <Sparkles className="w-4 h-4 text-[#3b82f6]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#f1f5f9] whitespace-pre-wrap">
                                        {msg.message}
                                    </p>
                                    <p className="text-xs text-[#64748b] mt-2">
                                        {formatISTDate(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}
