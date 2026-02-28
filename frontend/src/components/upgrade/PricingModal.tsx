'use client'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { api } from '@/lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { X, Check } from 'lucide-react'

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => {
            open: () => void
        }
    }
}

const plans = [
    {
        id: 'monthly',
        label: 'Monthly',
        priceIncGst: 234,
        priceExGst: 199,
        months: 1,
    },
    {
        id: 'quarterly',
        label: 'Quarterly',
        priceIncGst: 588,
        priceExGst: 499,
        months: 3,
        popular: true,
    },
]

const freeFeatures = [
    'Job feed',
    'Career score',
    'Skill gap',
    'WhatsApp coaching',
]

const paidFeatures = [
    'Everything in Free',
    'Auto-apply (10/day)',
    'Full fit analysis',
    'Resume tailoring',
    'Cover letters',
    'Dream company boost',
]

interface PricingModalProps {
    open: boolean
    onClose: () => void
}

export function PricingModal({ open, onClose }: PricingModalProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) { resolve(true); return }
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    const handleUpgrade = async (planId: string) => {
        setLoading(planId)
        try {
            const loaded = await loadRazorpayScript()
            if (!loaded) {
                alert('Payment gateway failed to load. Please try again.')
                return
            }
            const res = await api.post<{ order_id: string; amount: number; currency: string }>(
                '/api/payments/create-order',
                { plan: planId }
            )
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: res.data.amount,
                currency: res.data.currency,
                order_id: res.data.order_id,
                name: 'Talvix',
                description: `${planId} plan`,
                handler: async (response: Record<string, string>) => {
                    await api.post('/api/payments/verify', response)
                    await queryClient.invalidateQueries({ queryKey: ['user-profile'] })
                    onClose()
                },
                theme: { color: '#3b82f6' },
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch {
            alert('Something went wrong. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl px-4">
                    <GlassCard className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <Dialog.Title className="text-2xl font-bold text-[#f1f5f9]">
                                Choose your plan
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Free card */}
                            <GlassCard className="p-6">
                                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                                    Free Forever
                                </p>
                                <p className="text-5xl font-extrabold text-[#f1f5f9] mb-1">₹0</p>
                                <p className="text-[#64748b] text-xs mb-6">No credit card needed</p>
                                <ul className="space-y-2 mb-6">
                                    {freeFeatures.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <Check className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <GlowButton variant="ghost" size="md" className="w-full">
                                    Current plan
                                </GlowButton>
                            </GlassCard>

                            {/* Pro cards */}
                            <div className="space-y-3">
                                {plans.map((plan) => (
                                    <GlassCard
                                        key={plan.id}
                                        glow="blue"
                                        className={`p-5 border ${plan.popular ? 'border-[rgba(59,130,246,0.3)]' : 'border-[rgba(255,255,255,0.08)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-semibold text-[#f1f5f9]">{plan.label}</p>
                                            {plan.popular && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border border-[rgba(59,130,246,0.3)]">
                                                    Most popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-2xl font-bold text-[#f1f5f9]">
                                            ₹{plan.priceIncGst}
                                            <span className="text-sm text-[#64748b] font-normal ml-1">
                                                inc GST
                                            </span>
                                        </p>
                                        <GlowButton
                                            variant="primary"
                                            size="sm"
                                            className="w-full mt-3"
                                            disabled={loading === plan.id}
                                            onClick={() => void handleUpgrade(plan.id)}
                                        >
                                            {loading === plan.id ? 'Loading...' : 'Upgrade to Pro'}
                                        </GlowButton>
                                    </GlassCard>
                                ))}

                                <div className="mt-3 space-y-1">
                                    {paidFeatures.map((f) => (
                                        <p key={f} className="flex items-center gap-2 text-xs text-[#64748b]">
                                            <Check className="w-3 h-3 text-[#3b82f6] flex-shrink-0" />
                                            {f}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
