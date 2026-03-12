'use client'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'

// All dashboard pages use Supabase auth — prevent SSG
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <AppShell>{children}</AppShell>
}
