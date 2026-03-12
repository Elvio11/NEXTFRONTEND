'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { ResumeUpload } from './ResumeUpload'
import { PersonaDisplay } from './PersonaDisplay'
import { WhatsAppConnect } from './WhatsAppConnect'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { Search, Zap, Target } from 'lucide-react'
import { motion } from 'framer-motion'

type Step = 'welcome' | 'resume' | 'persona' | 'whatsapp'

export function OnboardingFlow() {
    const [step, setStep] = useState<Step>('welcome')
    const [personaOptions, setPersonaOptions] = useState<string[]>([])
    const [detectedPersona, setDetectedPersona] = useState<string | null>(null)
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 relative">
            <GridBackground />
            <RadialGlow color="blue" position="top" />

            <div className="relative z-10 w-full max-w-2xl">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {(['welcome', 'resume', 'persona', 'whatsapp'] as Step[]).map((s, i) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s === step
                                    ? 'w-8 bg-[#3b82f6]'
                                    : i < (['welcome', 'resume', 'persona', 'whatsapp'] as Step[]).indexOf(step)
                                        ? 'w-4 bg-[#3b82f6]/50'
                                        : 'w-4 bg-[rgba(255,255,255,0.12)]'
                                }`}
                        />
                    ))}
                </div>

                {step === 'welcome' && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <GlassCard className="p-10 text-center">
                            <h1 className="text-4xl font-extrabold text-[#f1f5f9] mb-4">
                                {"Let's build your AI job engine"}
                            </h1>
                            <p className="text-[#64748b] mb-8 text-lg">
                                Talvix works while you rest. Upload your resume and we handle the rest.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                {[
                                    { icon: Search, label: 'Find', desc: '150K+ jobs nightly' },
                                    { icon: Target, label: 'Score', desc: 'AI fit analysis' },
                                    { icon: Zap, label: 'Apply', desc: 'Auto while you sleep' },
                                ].map(({ icon: Icon, label, desc }) => (
                                    <GlassCard key={label} className="p-4 text-center">
                                        <Icon className="w-6 h-6 text-[#3b82f6] mx-auto mb-2" />
                                        <p className="font-semibold text-[#f1f5f9] text-sm">{label}</p>
                                        <p className="text-[#64748b] text-xs mt-1">{desc}</p>
                                    </GlassCard>
                                ))}
                            </div>
                            <GlowButton
                                variant="primary"
                                size="lg"
                                onClick={() => setStep('resume')}
                            >
                                Get Started
                            </GlowButton>
                        </GlassCard>
                    </motion.div>
                )}

                {step === 'resume' && (
                    <ResumeUpload
                        onComplete={(options) => {
                            setPersonaOptions(options)
                            setDetectedPersona(options[0] ?? 'professional')
                            setStep('persona')
                        }}
                    />
                )}

                {step === 'persona' && (
                    <PersonaDisplay
                        detectedPersona={detectedPersona}
                        onComplete={() => setStep('whatsapp')}
                    />
                )}

                {step === 'whatsapp' && (
                    <WhatsAppConnect
                        onComplete={() => router.push('/dashboard')}
                        onSkip={() => router.push('/dashboard')}
                    />
                )}
            </div>

            {/* Show unused variable (personaOptions) */}
            {personaOptions.length > 0 && <span className="sr-only">{personaOptions.length} persona options</span>}
        </div>
    )
}
