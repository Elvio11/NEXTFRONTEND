'use client'
import { GlassCard } from '@/components/ui/GlassCard'
import { FitScoreBadge } from './FitScoreBadge'
import { UpgradeCTA } from '@/components/upgrade/UpgradeCTA'
import { usePermissions } from '@/hooks/usePermissions'
import type { JobFitScore } from '@/types/job'
import { MapPin, Globe } from 'lucide-react'

interface JobCardProps {
    job: JobFitScore
}

export function JobCard({ job }: JobCardProps) {
    const { canViewFitReasons } = usePermissions()
    const { fit_score, fit_reasons } = job
    const { title, company, location, is_remote } = job.job

    const initial = company.charAt(0).toUpperCase()

    return (
        <GlassCard hover className="p-4">
            <div className="flex items-start gap-3">
                {/* Company avatar */}
                <div className="w-10 h-10 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-sm font-bold text-[#3b82f6] flex-shrink-0">
                    {initial}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-medium text-[#f1f5f9] text-sm truncate">{title}</p>
                            <p className="text-[#64748b] text-xs truncate">{company}</p>
                            <div className="flex items-center gap-1 mt-1 text-[#64748b] text-xs">
                                {is_remote ? (
                                    <Globe className="w-3 h-3" />
                                ) : (
                                    <MapPin className="w-3 h-3" />
                                )}
                                <span>{is_remote ? 'Remote' : location}</span>
                            </div>
                        </div>
                        <FitScoreBadge score={fit_score} className="flex-shrink-0" />
                    </div>

                    {/* Fit reasons — locked for state < 3 */}
                    <div className="mt-3 relative">
                        <p
                            className={`text-xs text-[#64748b] leading-relaxed ${!canViewFitReasons
                                    ? 'blur-sm pointer-events-none select-none'
                                    : ''
                                }`}
                        >
                            {fit_reasons ??
                                'Python proficiency · Backend experience · Fast learner · Team fit'}
                        </p>
                        {!canViewFitReasons && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <UpgradeCTA feature="fit_reasons" compact />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}
