'use client'
import type { JobApplication } from '@/types/job'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusConfig: Record<JobApplication['status'], { label: string; color: string }> = {
    queued: { label: 'Queued', color: 'text-[#64748b] bg-[rgba(255,255,255,0.04)]' },
    submitted: { label: 'Applied', color: 'text-blue-400 bg-blue-500/10' },
    callback: { label: 'Callback!', color: 'text-green-400 bg-green-500/10' },
    rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10' },
    expired: { label: 'Expired', color: 'text-[#334155] bg-[rgba(255,255,255,0.02)]' },
}

interface ApplicationRowProps {
    application: JobApplication
}

export function ApplicationRow({ application }: ApplicationRowProps) {
    const { status, apply_tier, applied_at, job } = application
    const config = statusConfig[status]

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f1f5f9] truncate">{job.title}</p>
                <p className="text-xs text-[#64748b] truncate">{job.company}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-[#334155]">
                    Tier {apply_tier}
                </span>
                <span
                    className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        config.color
                    )}
                >
                    {config.label}
                </span>
                <span className="text-xs text-[#334155] hidden sm:block">
                    {formatDate(applied_at)}
                </span>
            </div>
        </div>
    )
}
