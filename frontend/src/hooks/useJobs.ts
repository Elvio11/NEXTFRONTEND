'use client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { JobFitScore } from '@/types/job'

const PAGE_SIZE = 20

export function useJobs(userId: string | undefined) {
    const supabase = getSupabaseClient()
    return useInfiniteQuery<JobFitScore[], Error>({
        queryKey: ['jobs', userId],
        enabled: !!userId,
        initialPageParam: null as number | null,
        queryFn: async ({ pageParam }) => {
            let q = supabase
                .from('job_fit_scores')
                .select(
                    'job_id, fit_score, fit_reasons, jobs(title, company, location, role_family, is_remote)'
                )
                .eq('user_id', userId!)
                .order('fit_score', { ascending: false })
                .limit(PAGE_SIZE)
            if (pageParam !== null) {
                q = q.lt('fit_score', pageParam as number)
            }
            const { data, error } = await q
            if (error) throw error
            return (data ?? []) as unknown as JobFitScore[]
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.length < PAGE_SIZE) return undefined
            return lastPage[lastPage.length - 1].fit_score
        },
    })
}
