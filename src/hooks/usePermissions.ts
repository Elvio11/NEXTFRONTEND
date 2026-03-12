'use client'
import { useAuthStore } from '@/stores/authStore'

export function usePermissions() {
    const state = useAuthStore((s) => s.permissionState)
    return {
        canViewFitReasons: state !== null && state >= 3,
        canAutoApply: state !== null && state >= 3,
        canViewCoaching: state === 2 || state === 4,
        canViewApplications: state !== null && state >= 3,
        canViewDreamCompanies: state !== null && state >= 3,
        canResumeTailor: state !== null && state >= 3,
        isLoaded: state !== null,
    }
}
