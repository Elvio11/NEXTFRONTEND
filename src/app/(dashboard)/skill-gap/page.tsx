'use client'
export const dynamic = 'force-dynamic'

import { SkillGapPanel } from '@/components/skill-gap/SkillGapPanel'

export default function SkillGapPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <SkillGapPanel />
        </div>
    )
}
