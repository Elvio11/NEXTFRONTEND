import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import {
    computePermissionState,
    type PermissionState,
    type TalvixUser,
} from '@/types/user'

interface AuthState {
    user: User | null
    session: Session | null
    profile: TalvixUser | null
    permissionState: PermissionState | null
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setProfile: (profile: TalvixUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    profile: null,
    permissionState: null,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) =>
        set({
            profile,
            permissionState: profile
                ? computePermissionState(
                    profile.subscription_tier,
                    profile.wa_connected
                )
                : null,
        }),
}))
