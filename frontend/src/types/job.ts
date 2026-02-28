export interface Job {
    job_id: string
    title: string
    company: string
    location: string
    role_family: string
    is_remote: boolean
}

export interface JobFitScore {
    job_id: string
    fit_score: number
    fit_reasons: string | null
    job: Job
}

export type AppStatus =
    | 'queued'
    | 'submitted'
    | 'callback'
    | 'rejected'
    | 'expired'

export interface JobApplication {
    job_id: string
    status: AppStatus
    apply_tier: 1 | 2
    applied_at: string
    job: Pick<Job, 'title' | 'company'>
}
