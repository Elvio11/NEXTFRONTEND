'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const fetchJobs = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        const tier = profile?.tier ?? 'free'
        const limit = tier === 'free' ? 3 : tier === 'student' ? 10 : tier === 'professional' ? 25 : 50

        // Primary: try to fetch scored jobs from job_fit_scores
        let query = supabase
          .from('job_fit_scores')
          .select(`
            id, fit_score, fit_label, recommendation,
            fit_reasons, missing_skills, strengths,
            created_at,
            job_id,
            jobs (*)
          `)
          .eq('user_id', user.id)
          .order('fit_score', { ascending: false })
          .limit(limit)

        // Executive only sees high-end jobs (Tier check)
        if (tier === 'executive') {
          // If we have job metadata, we filter by plan_tier = 'executive'
          // However, job_fit_scores join syntax for filtering on related table is specific
          query = query.filter('jobs.plan_tier', 'eq', 'executive')
        }

        const { data: scored, error: scoredErr } = await query

        if (!scoredErr && scored && scored.length > 0) {
          setJobs(scored.map((item: any) => ({ ...item, job: item.jobs })))
          return
        }

        // Fallback: show recent active jobs from pool when no scores yet
        let fbQuery = supabase
          .from('jobs')
          .select('id, title, company, city_canonical, work_mode, role_family, apply_url, posted_at, plan_tier')
          .eq('is_active', true)
          .not('posted_at', 'is', null) // Ensure we only show real jobs with dates
          .neq('company', 'Talvix Corp') // Exclude internal test jobs

        if (tier === 'executive') {
          fbQuery = fbQuery.eq('plan_tier', 'executive')
        }

        const { data: rawJobs, error: rawErr } = await fbQuery
          .order('posted_at', { ascending: false })
          .limit(limit)

        if (rawErr) throw rawErr

        // Map to compatible shape with null fit_score (shows loading indicator instead of a score)
        const fallback = (rawJobs || []).map((j: any) => ({
          id: j.id,
          job_id: j.id,
          fit_score: null,
          fit_label: null,
          recommendation: null,
          fit_reasons: null,
          missing_skills: null,
          strengths: null,
          created_at: j.posted_at,
          job: {
            title: j.title,
            company: j.company,
            location: j.city_canonical,
            is_remote: j.work_mode === 'remote',
            work_mode: j.work_mode,
            apply_url: j.apply_url,
          }
        }))
        setJobs(fallback)
      } catch (err) {
        setError('Failed to fetch job matches from the swarm.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [user, profile?.tier])

  return { jobs, loading, error }
}
