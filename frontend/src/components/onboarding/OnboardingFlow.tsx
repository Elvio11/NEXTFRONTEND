'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  ShieldCheck, 
  Zap, 
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupabaseClient } from '@/lib/supabase/client'

// Swarm-Native Step Components
import { PersonaDisplay } from './PersonaDisplay' // Step 1: Saarthi
import { ResumeUpload } from './ResumeUpload'     // Step 2: Pravesh
import { Nishana } from './Nishana'               // Step 3: Nishana
import { Identity } from './Identity'             // Step 4: Identity
import { Prerna } from './Prerna'                 // Step 5: Prerna
import { Sankhya } from './Sankhya'               // Step 6: Sankhya
import { TheVault } from './TheVault'             // Step 7: The Vault

type StepId = 
  | 'welcome' 
  | 'persona'   
  | 'resume'    
  | 'roles'     
  | 'identity'  
  | 'prefs'     
  | 'verify'    
  | 'vault'     
  | 'complete'

const STEPS: StepId[] = [
  'welcome', 
  'persona', 
  'resume', 
  'roles', 
  'identity', 
  'prefs', 
  'verify', 
  'vault', 
  'complete'
]

export function OnboardingFlow() {
    const [currentStep, setCurrentStep] = useState<StepId>('welcome')
    const [formData, setFormData] = useState({
      persona: 'Professional',
      roles: [] as string[],
      identity: 'expert',
      prefs: { workMode: 'remote', salary: 12, locations: ['Bengaluru'] },
      resumeUploaded: false
    })
    
    const [detectedPersona, setDetectedPersona] = useState<string | null>(null)
    const router = useRouter()

    const stepIndex = STEPS.indexOf(currentStep)
    const progress = ((stepIndex) / (STEPS.length - 2)) * 100 

    const next = () => {
      const idx = STEPS.indexOf(currentStep)
      if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1])
    }

    const back = () => {
      const idx = STEPS.indexOf(currentStep)
      if (idx > 0) setCurrentStep(STEPS[idx - 1])
    }

    const updateData = (key: string, value: any) => {
      setFormData(prev => ({ ...prev, [key]: value }))
      next()
    }

    // Called when Sankhya (verification step) is confirmed
    // Upserts the users table so middleware sees onboarding_complete=true
    const completeOnboarding = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            persona: formData.persona,
            onboarding_complete: true,
          }, { onConflict: 'id' })
        }
      } catch (err) {
        console.error('[OnboardingFlow] Failed to write onboarding_complete:', err)
      } finally {
        next() // advance to 'complete' screen regardless
      }
    }

    return (
        <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden">
            <GridBackground />
            <RadialGlow color="blue" position="top" />
            
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-3xl py-12">
                <AnimatePresence>
                  {currentStep !== 'welcome' && currentStep !== 'complete' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-12 space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Aero-Swarm Sync</span>
                              <div className="h-4 w-px bg-slate-200" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-content-subtle">
                                Step {stepIndex} of 7: {currentStep.toUpperCase()}
                              </span>
                           </div>
                           <div className="flex items-center gap-2">
                              {currentStep !== 'persona' && (
                                <button onClick={back} className="p-2 rounded-lg hover:bg-slate-100 text-content-subtle transition-colors">
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              )}
                           </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden border border-slate-200">
                            <motion.div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-glow-blue"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            />
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative min-h-[500px]">
                  <AnimatePresence mode="wait">
                    {currentStep === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Initialize Swarm Protocol</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-content-primary uppercase leading-[0.9]">
                                Your Talent,<br /><span className="text-blue-500">Our Intelligence.</span>
                            </h1>
                            
                            <p className="text-content-muted text-sm md:text-base max-w-xl mx-auto font-mono leading-relaxed mt-6">
                                Experience the Aero-V3 Agent Swarm. 15 agents working 24/7 to parse, match, and deploy your career to top global citadels.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
                                {[
                                    { icon: Search, label: 'Anveshan', desc: 'Global Job Scraper', color: 'blue' },
                                    { icon: ShieldCheck, label: 'The Vault', desc: 'Secure Integration', color: 'green' },
                                    { icon: Zap, label: 'Setu', desc: 'Auto-Apply Bridge', color: 'orange' },
                                ].map((agent) => (
                                    <div key={agent.label} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm group hover:shadow-md transition-all">
                                        {/* @ts-ignore */}
                                        <agent.icon className={cn("w-6 h-6 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity", `text-${agent.color}-400`)} />
                                        <p className="font-black text-content-primary text-[10px] uppercase tracking-widest">{agent.label}</p>
                                        <p className="text-content-subtle text-[9px] mt-1 uppercase font-bold tracking-tighter">{agent.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-12">
                                <button
                                    onClick={() => setCurrentStep('persona')}
                                    className="px-12 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-xs shadow-glow-blue transition-all active:scale-95 group"
                                >
                                    <span className="flex items-center gap-3">
                                      Initiate Onboarding
                                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'persona' && (
                        <motion.div key="persona" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <PersonaDisplay 
                                detectedPersona={detectedPersona} 
                                onComplete={() => updateData('persona', formData.persona)} 
                            />
                        </motion.div>
                    )}

                    {currentStep === 'resume' && (
                        <motion.div key="resume" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <ResumeUpload
                                onComplete={(options) => {
                                    setDetectedPersona(options[0] ?? 'professional')
                                    updateData('resumeUploaded', true)
                                }}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'roles' && (
                      <motion.div key="roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Nishana onComplete={(roles) => updateData('roles', roles)} />
                      </motion.div>
                    )}

                    {currentStep === 'identity' && (
                      <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Identity 
                          detectedPersona={detectedPersona} 
                          onComplete={(id) => updateData('identity', id)} 
                        />
                      </motion.div>
                    )}

                    {currentStep === 'prefs' && (
                      <motion.div key="prefs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Prerna onComplete={(prefs) => updateData('prefs', prefs)} />
                      </motion.div>
                    )}

                    {currentStep === 'verify' && (
                      <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Sankhya data={formData} onComplete={completeOnboarding} />
                      </motion.div>
                    )}

                    {currentStep === 'vault' && (
                      <motion.div key="vault" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <TheVault onComplete={next} />
                      </motion.div>
                    )}

                    {currentStep === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-8 shadow-glow-blue">
                                <CheckCircle2 className="w-12 h-12 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-content-primary uppercase mb-4">Swarm Connection Active</h2>
                            <p className="text-content-muted text-sm font-mono max-w-md mx-auto mb-12">
                                Your profile is now synced with the 15-agent swarm. Anveshan has begun scanning 150K+ daily jobs for your {formData.persona} persona.
                            </p>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-12 py-4 rounded-2xl bg-content-primary text-bg-base font-black uppercase tracking-[0.3em] text-xs hover:bg-content-subtle transition-all shadow-xl"
                            >
                                Enter Command Center
                            </button>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
