'use client'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/axios'
import { getSupabaseClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { MessageCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const MAX_POLLS = 40

interface WhatsAppConnectProps {
    onComplete: () => void
    onSkip: () => void
}

export function WhatsAppConnect({ onComplete, onSkip }: WhatsAppConnectProps) {
    const [qrUrl, setQrUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(false)
    const [timeoutError, setTimeoutError] = useState(false)
    const [skipping, setSkipping] = useState(false)
    const pollCountRef = useRef(0)
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const { user } = useAuthStore()
    const supabase = getSupabaseClient()

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }
        setPolling(false)
        pollCountRef.current = 0
    }

    const startPolling = () => {
        setPolling(true)
        pollCountRef.current = 0
        pollTimerRef.current = setInterval(async () => {
            pollCountRef.current++
            if (pollCountRef.current >= MAX_POLLS) {
                stopPolling()
                setTimeoutError(true)
                return
            }
            const { data } = await supabase
                .from('users')
                .select('wa_connected')
                .eq('id', user!.id)
                .single()
            if (data?.wa_connected) {
                stopPolling()
                onComplete()
            }
        }, 3000)
    }

    const loadQR = async () => {
        setLoading(true)
        setTimeoutError(false)
        try {
            const res = await api.get<{ qr_url: string }>('/api/wa/qr')
            setQrUrl(res.data.qr_url)
            startPolling()
        } catch {
            setQrUrl(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadQR()
        return () => stopPolling()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSkip = async () => {
        setSkipping(true)
        try {
            await api.patch('/api/users/onboarding_complete', { onboarding_complete: true })
            onSkip()
        } finally {
            setSkipping(false)
        }
    }

    return (
        <GlassCard className="p-8 max-w-lg mx-auto text-center">
            <MessageCircle className="w-10 h-10 text-[#3b82f6] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">Connect WhatsApp</h2>
            <p className="text-[#64748b] mb-6">
                Get daily coaching and job alerts. ₹0/msg forever.
            </p>

            {loading ? (
                <div className="flex items-center justify-center gap-3 text-[#64748b] py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating QR code...
                </div>
            ) : qrUrl ? (
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={qrUrl}
                        alt="WhatsApp QR Code"
                        className="w-48 h-48 rounded-xl border border-[rgba(255,255,255,0.08)]"
                    />
                    {polling && (
                        <p className="text-[#64748b] text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Waiting for scan...
                        </p>
                    )}
                    {timeoutError && (
                        <div className="text-yellow-400 text-sm flex flex-col items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <p>QR code expired. Click to regenerate.</p>
                            <GlowButton
                                variant="ghost"
                                size="sm"
                                onClick={() => void loadQR()}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate QR
                            </GlowButton>
                        </div>
                    )}
                </div>
            ) : (
                <GlowButton variant="ghost" size="md" onClick={() => void loadQR()}>
                    <RefreshCw className="w-4 h-4" />
                    Load QR Code
                </GlowButton>
            )}

            <button
                onClick={() => void handleSkip()}
                disabled={skipping}
                className="mt-6 text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200 underline underline-offset-4"
            >
                {skipping ? 'Skipping...' : 'Skip for now'}
            </button>
        </GlassCard>
    )
}
