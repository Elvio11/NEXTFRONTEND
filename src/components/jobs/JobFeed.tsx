'use client'
import { useAuth } from '@/hooks/useAuth'
import { useJobs } from '@/hooks/useJobs'
import { JobCard } from './JobCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { Loader2 } from 'lucide-react'

interface JobFeedProps {
    preview?: boolean
    limit?: number
}

export function JobFeed({ preview = false, limit }: JobFeedProps) {
    const { user } = useAuth()
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useJobs(user?.id)

    const allJobs = data?.pages.flatMap((p) => p) ?? []
    const jobs = limit ? allJobs.slice(0, limit) : allJobs

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 text-[#64748b]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading jobs...
            </div>
        )
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 text-[#64748b]">
                <p className="text-sm">No jobs scored yet.</p>
                <p className="text-xs mt-1 text-[#334155]">
                    Jobs are scored nightly. Check back after 8 PM IST.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
            ))}

            {!preview && hasNextPage && (
                <div className="flex justify-center pt-4">
                    <GlowButton
                        variant="ghost"
                        size="sm"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load more'
                        )}
                    </GlowButton>
                </div>
            )}
        </div>
    )
}
