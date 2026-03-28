'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'

export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const fetchJobs = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/jobs')
        setJobs(res.data.jobs || [])
      } catch (err) {
        setError('Failed to fetch job matches from the swarm.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [user])

  return { jobs, loading, error }
}
