import { create } from 'zustand'

interface DashboardState {
    dashboardReady: boolean
    setReady: (v: boolean) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
    dashboardReady: false,
    setReady: (dashboardReady) => set({ dashboardReady }),
}))
