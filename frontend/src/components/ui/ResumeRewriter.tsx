'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const TRANSFORMS = [
  { before: 'Software Engineer', after: 'Senior Systems Architect' },
  { before: 'Built several apps using Java.', after: 'Architected high-throughput distributed systems in Java/Spring Boot (50k+ QPS).' },
  { before: 'Knows AWS and Docker.', after: 'Lead DevOps transformation with EKS, Terraform, and zero-downtime CI/CD.' }
]

export const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('')
  
  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 30) // Fast typing
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return <span>{displayedText}</span>
}

export const ResumeRewriter = ({ active }: { active: boolean }) => {
  return (
    <div className="space-y-6">
      {TRANSFORMS.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className={`text-[10px] font-mono transition-all duration-500 ${active ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
              {item.before}
            </span>
          </div>
          {active && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 1.5 }}
              className="pl-4 border-l-2 border-blue-500 py-1"
            >
              <p className="text-xs font-bold text-blue-600 leading-relaxed">
                <TypewriterText text={item.after} delay={i * 1500} />
              </p>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}
