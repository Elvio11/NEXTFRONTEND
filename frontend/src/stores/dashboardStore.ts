'use client'

import { create } from 'zustand'

export type AgentStatus = 'idle' | 'working' | 'failed' | 'completed'

interface AgentPulse {
  id: string
  name: string
  status: AgentStatus
  lastActive: string
  message?: string
}

interface DashboardState {
    dashboardReady: boolean
    studentMode: boolean
    agentHeartbeats: Record<string, AgentPulse>
    activeDeployments: number
    setReady: (v: boolean) => void
    setStudentMode: (v: boolean) => void
    updateAgentPulse: (id: string, pulse: Partial<AgentPulse>) => void
    setHeartbeats: (heartbeats: Record<string, AgentPulse>) => void
    setActiveDeployments: (count: number) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
    dashboardReady: false,
    studentMode: false,
    agentHeartbeats: {},
    activeDeployments: 0,
    setReady: (dashboardReady) => set({ dashboardReady }),
    setStudentMode: (studentMode) => set({ studentMode }),
    updateAgentPulse: (id, pulse) => set((state) => ({
      agentHeartbeats: {
        ...state.agentHeartbeats,
        [id]: { 
          ...(state.agentHeartbeats[id] || { id, name: id, status: 'idle', lastActive: new Date().toISOString() }), 
          ...pulse 
        }
      }
    })),
    setHeartbeats: (agentHeartbeats) => set({ agentHeartbeats }),
    setActiveDeployments: (activeDeployments) => set({ activeDeployments }),
}))
