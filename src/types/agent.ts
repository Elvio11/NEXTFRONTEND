export interface SkillGap {
    skill: string
    frequency_rank: number
    roi_score: number
}

export interface SkillGapResult {
    top_gaps: SkillGap[]
    updated_at: string
}

export interface CareerScores {
    skills: number
    experience: number
    demand: number
    salary: number
}

export interface CareerIntelligence {
    scores: CareerScores
    updated_at: string
}

export interface AgentResponse {
    status: 'success' | 'skipped' | 'failed'
    duration_ms: number
    records_processed: number | null
    error: string | null
}
