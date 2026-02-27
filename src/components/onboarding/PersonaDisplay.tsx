'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/axios'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'

const personaOptions = [
    { value: 'student', label: 'Student' },
    { value: 'professional', label: 'Professional' },
    { value: 'switcher', label: 'Career Switcher' },
    { value: 'returning', label: 'Returning to Work' },
    { value: 'freelancer', label: 'Freelancer' },
] as const

const schema = z.object({
    persona: z.enum(['student', 'professional', 'switcher', 'returning', 'freelancer']),
})

type FormData = z.infer<typeof schema>

interface PersonaDisplayProps {
    detectedPersona: string | null
    onComplete: () => void
}

export function PersonaDisplay({ detectedPersona, onComplete }: PersonaDisplayProps) {
    const [saving, setSaving] = useState(false)

    const { handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { persona: (detectedPersona as FormData['persona']) ?? 'professional' },
    })

    const onSubmit = async (data: FormData) => {
        setSaving(true)
        try {
            await api.patch('/api/users/persona', { persona: data.persona })
            onComplete()
        } finally {
            setSaving(false)
        }
    }

    return (
        <GlassCard className="p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">Confirm your persona</h2>
            <p className="text-[#64748b] mb-6">
                We detected you as{' '}
                <span className="text-[#f1f5f9] font-medium capitalize">{detectedPersona}</span>.
                Update below if needed.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    control={control}
                    name="persona"
                    render={({ field }) => (
                        <select
                            {...field}
                            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-[#f1f5f9] text-sm focus:outline-none focus:border-[#3b82f6] mb-4"
                        >
                            {personaOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-[#0d0d0d]">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                />
                {errors.persona && (
                    <p className="text-red-400 text-sm mb-4">{errors.persona.message}</p>
                )}
                <GlowButton type="submit" variant="primary" size="md" disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Confirm & Continue'}
                </GlowButton>
            </form>
        </GlassCard>
    )
}
