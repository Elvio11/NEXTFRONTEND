'use client'
import type { JobFitScore } from '@/types/job'
import { GlassCard } from '@/components/ui/GlassCard'
import { FitScoreBadge } from './FitScoreBadge'
import { ArrowLeft, MapPin, Globe, Briefcase } from 'lucide-react'

interface JobDetailProps {
    job: JobFitScore
    onBack?: () => void
}

export function JobDetail({ job, onBack }: JobDetailProps) {
    const { title, company, location, role_family, is_remote } = job.job

    return (
        <GlassCard className="p-6">
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#f1f5f9] mb-4 transition-colors duration-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to jobs
                </button>
            )}

            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-lg font-bold text-[#3b82f6] flex-shrink-0">
                    {company.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h2 className="font-bold text-[#f1f5f9] text-xl">{title}</h2>
                            <p className="text-[#64748b]">{company}</p>
                        </div>
                        <FitScoreBadge score={job.fit_score} />
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                            {is_remote ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {is_remote ? 'Remote' : location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                            <Briefcase className="w-3 h-3" />
                            {role_family.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {job.fit_reasons && (
                <div className="mt-6 p-4 bg-[rgba(59,130,246,0.06)] rounded-xl border border-[rgba(59,130,246,0.12)]">
                    <p className="text-xs font-semibold text-[#3b82f6] mb-2 uppercase tracking-wider">
                        Why you fit
                    </p>
                    <p className="text-sm text-[#64748b]">{job.fit_reasons}</p>
                </div>
            )}
        </GlassCard>
    )
}
