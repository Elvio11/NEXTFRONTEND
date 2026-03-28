'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/axios'
import { GlassCard } from '@/components/ui/GlassCard'
import { UserCircle, GraduationCap, Briefcase, RefreshCw, Undo2, Laptop } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const personaOptions = [
    { value: 'Student', label: 'Student', icon: GraduationCap, desc: 'Fresher / Intern / Academic' },
    { value: 'Professional', label: 'Professional', icon: Briefcase, desc: '2+ Years Experience' },
    { value: 'Switcher', label: 'Career Switcher', icon: RefreshCw, desc: 'Changing domains' },
    { value: 'Returning', label: 'Returning to Work', icon: Undo2, desc: 'Gap / Sabbatical' },
    { value: 'Freelancer', label: 'Freelancer', icon: Laptop, desc: 'Independent Contractor' },
] as const

const schema = z.object({
    persona: z.string(),
})

type FormData = z.infer<typeof schema>

interface PersonaDisplayProps {
    detectedPersona: string | null
    onComplete: () => void
}

export function PersonaDisplay({ detectedPersona, onComplete }: PersonaDisplayProps) {
    const [saving, setSaving] = useState(false)

    const { handleSubmit, control, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { persona: detectedPersona ?? 'Professional' },
    })

    const selectedPersona = watch('persona')

    const onSubmit = async (data: FormData) => {
        setSaving(true)
        try {
            await api.post('/api/onboarding/persona', { persona: data.persona })
            onComplete()
        } catch (err) {
            console.error('Error saving persona:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <GlassCard className="p-8 max-w-2xl mx-auto border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-glow-blue/5">
                <UserCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 01: Saarthi Protocol</h2>
                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                  Identify your career persona for swarm calibration
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Controller
                    control={control}
                    name="persona"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {personaOptions.map((opt) => (
                           <button
                             type="button"
                             key={opt.value}
                             onClick={() => field.onChange(opt.value)}
                             className={cn(
                               "flex flex-col items-start p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group",
                               selectedPersona === opt.value 
                                 ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20" 
                                 : "bg-white/[0.02] border-white/5 hover:border-white/10"
                             )}
                           >
                              <div className={cn(
                                "p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform",
                                selectedPersona === opt.value ? "bg-blue-500 text-white" : "bg-white/5 text-content-subtle"
                              )}>
                                <opt.icon className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{opt.label}</p>
                              <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter">{opt.desc}</p>
                              
                              {selectedPersona === opt.value && (
                                <motion.div 
                                  layoutId="persona-glow"
                                  className="absolute inset-0 bg-blue-500/5 blur-2xl -z-10"
                                />
                              )}
                           </button>
                        ))}
                      </div>
                    )}
                />

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={saving} 
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-blue transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        {saving ? 'Calibrating...' : 'Confirm Swarm Persona'}
                    </button>
                    <p className="text-center text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-4">
                      Sathi agent will customize your experience based on this selection
                    </p>
                </div>
            </form>
        </GlassCard>
    )
}
