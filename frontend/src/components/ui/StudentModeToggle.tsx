'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Briefcase } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { cn } from '@/lib/utils'

export const StudentModeToggle = () => {
  const { studentMode, setStudentMode } = useDashboardStore()

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
      <button
        onClick={() => setStudentMode(false)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
          !studentMode 
            ? "bg-accent-blue text-white shadow-glow-blue" 
            : "text-content-subtle hover:text-white"
        )}
      >
        <Briefcase className="w-3.5 h-3.5" />
        Pro
      </button>
      <button
        onClick={() => setStudentMode(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
          studentMode 
            ? "bg-accent-violet text-white shadow-glow-violet" 
            : "text-content-subtle hover:text-white"
        )}
      >
        <GraduationCap className="w-3.5 h-3.5" />
        Student
      </button>
    </div>
  )
}
