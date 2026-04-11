export type PersonaType =
    | 'student'
    | 'professional'
    | 'switcher'
    | 'returning'
    | 'freelancer'

export interface TalvixUser {
    id: string
    tier: 'free' | 'student' | 'professional' | 'executive'
    wa_opted_in: boolean
    onboarding_completed: boolean
    persona: PersonaType | null
    dashboard_ready: boolean
}

export type PermissionState = 1 | 2 | 3 | 4 | 5

export function computePermissionState(
    tier: TalvixUser['tier'],
    wa: boolean
): PermissionState {
    if (tier === 'executive') return 5
    if (tier === 'professional' && wa) return 4
    if (tier === 'professional' && !wa) return 3
    if (tier === 'student' || (tier === 'free' && wa)) return 2
    return 1
}
