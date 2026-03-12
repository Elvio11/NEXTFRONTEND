'use client'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'

export function useAgents() {
    const triggerResumeIntelligence = useMutation({
        mutationFn: (formData: FormData) =>
            api.post('/api/agents/resume-intelligence', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
    })
    const triggerAutoApply = useMutation({
        mutationFn: (jobId: string) =>
            api.post('/api/agents/auto-apply', { job_id: jobId }),
    })
    const triggerResumeTailor = useMutation({
        mutationFn: (jobId: string) =>
            api.post('/api/agents/resume-tailor', { job_id: jobId }),
    })
    return { triggerResumeIntelligence, triggerAutoApply, triggerResumeTailor }
}
