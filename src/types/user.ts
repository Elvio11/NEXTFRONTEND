export type PersonaType =
    | 'student'
    | 'professional'
    | 'switcher'
    | 'returning'
    | 'freelancer'

export interface TalvixUser {
    id: string
    subscription_tier: 'free' | 'paid'
    wa_connected: boolean
    onboarding_complete: boolean
    persona: PersonaType | null
    dashboard_ready: boolean
}

export type PermissionState = 1 | 2 | 3 | 4

export function computePermissionState(
    tier: TalvixUser['subscription_tier'],
    wa: boolean
): PermissionState {
    if (tier === 'paid' && wa) return 4
    if (tier === 'paid' && !wa) return 3
    if (tier === 'free' && wa) return 2
    return 1
}
