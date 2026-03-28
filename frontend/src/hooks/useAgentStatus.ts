'use client'

import { useEffect, useRef } from 'react'
import { api } from '@/lib/axios'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'

const POLL_INTERVAL = 5000 // 5 seconds

export function useAgentStatus() {
  const { updateAgentPulse, setActiveDeployments } = useDashboardStore()
  const { user } = useAuthStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) return

    const poll = async () => {
      try {
        const res = await api.get('/api/dashboard/status')
        const { agents, deployments } = res.data
        
        // Update all agents in store
        Object.entries(agents).forEach(([id, pulse]: [string, any]) => {
          updateAgentPulse(id, pulse)
        })
        
        setActiveDeployments(deployments || 0)
      } catch (err) {
        console.error('Failed to poll agent status:', err)
      }
    }

    // Initial poll
    poll()
    
    // Set interval
    timerRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [user, updateAgentPulse, setActiveDeployments])
}
