'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useDashboardStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <>{children}</>
}
