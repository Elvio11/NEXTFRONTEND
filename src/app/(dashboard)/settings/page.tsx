'use client'
export const dynamic = 'force-dynamic'

import { ApplyPreferences } from '@/components/settings/ApplyPreferences'
import { BlacklistManager } from '@/components/settings/BlacklistManager'
import { DreamCompanies } from '@/components/settings/DreamCompanies'

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <ApplyPreferences />
            <BlacklistManager />
            <DreamCompanies />
        </div>
    )
}
