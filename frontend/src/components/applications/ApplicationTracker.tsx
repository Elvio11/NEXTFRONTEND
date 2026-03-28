'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { JobApplication } from '@/types/job'
import { ApplicationRow } from './ApplicationRow'
import { Activity, ShieldCheck, Box, Loader2 } from 'lucide-react'

export function ApplicationTracker() {
    const { user } = useAuthStore()
    const supabase = getSupabaseClient()

    const { data: applications, isLoading } = useQuery<JobApplication[]>({
        queryKey: ['applications', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_applications')
                .select('job_id, status, apply_tier, applied_at, jobs(title, company)')
                .eq('user_id', user!.id)
                .order('applied_at', { ascending: false })
            if (error) throw error
            return (data ?? []) as any
        },
    })

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tracker Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Activity className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Deployment Tracker</h2>
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                      Active Swarm monitoring — {applications?.length ?? 0} Nodes Deployed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Setu Bridge Active</span>
                   </div>
                   <div className="h-6 w-px bg-white/10" />
                   <button className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-content-subtle hover:text-white transition-colors">
                      <Box className="w-4 h-4" />
                   </button>
                </div>
            </div>

            {/* Application List */}
            {!applications?.length ? (
                <div className="py-24 text-center space-y-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
                    <div className="p-5 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto relative">
                      <Loader2 className="w-8 h-8 text-blue-500/20 animate-spin" />
                      <Activity className="absolute inset-0 m-auto w-4 h-4 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-black uppercase tracking-widest text-xs">Awaiting Swarm Activation</p>
                      <p className="text-content-muted font-mono text-[10px] tracking-tight text-balance">
                         No active deployments detected. Setu routinely checks the job swarm at 8 PM IST.
                      </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {applications.map((app) => (
                        <ApplicationRow key={app.job_id} application={app} />
                    ))}
                </div>
            )}
        </div>
    )
}
