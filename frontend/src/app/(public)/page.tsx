'use client'

import { ArrowRight } from 'lucide-react'
import { SwarmStats } from '@/components/ui/SwarmStats'
import { SwarmCapabilities } from '@/components/ui/SwarmCapabilities'
import { ResumeComparison } from '@/components/ui/ResumeComparison'
import { VisualPOC } from '@/components/ui/VisualPOC'
import { ThreeStepDominance } from '@/components/ui/ThreeStepDominance'
import { motion } from 'framer-motion'
import { GlowButton } from '@/components/ui/GlowButton'
import { TheSwarmBrain } from '@/components/ui/TheSwarmBrain'
import { MNCWall } from '@/components/ui/MNCWall'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Logo } from '@/components/ui/Logo'
import { SuccessWall } from '@/components/ui/SuccessWall'

export default function LandingPage() {
  return (
    <main className="bg-bg-base min-h-screen text-content-primary font-sans w-full overflow-clip relative">
      
      {/* Global Atmospheric Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[40%] aspect-square bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[35%] aspect-square bg-violet-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[70%] -left-[5%] w-[30%] aspect-square bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Section 1 — Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] aspect-square bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Swarm-Native Job Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-content-primary">
              Hire the <span className="text-blue-600">Swarm</span>.
              <br />
              Secure your <span className="text-violet-600">Future</span>.
            </h1>

            <p className="text-lg md:text-xl text-content-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Talvix harnesses 15 specialized AI agents to discover, evaluate, and apply to 
              premium job opportunities and internships across the Indian market and global 
              remote positions, while you focus on what matters most.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <GlowButton variant="primary" size="lg" href="/login" className="px-10 h-14 text-base shadow-xl shadow-blue-500/20">
                Join the Swarm
                <ArrowRight className="w-5 h-5 ml-2" />
              </GlowButton>
              <GlowButton variant="ghost" size="lg" href="/swarm" className="h-14 text-base border-slate-200 bg-white text-content-primary hover:bg-slate-50 shadow-sm border">
                Explore the Network
              </GlowButton>
            </div>
          </motion.div>

          {/* Swarm Brain Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <TheSwarmBrain />
          </motion.div>
        </div>
      </section>

      {/* Section 2 — Trust Wall */}
      <MNCWall />

      {/* Section 3 — Three Step Dominance (How it works - Simple Promise) */}
      <ThreeStepDominance />

      {/* Section 4 — Visual POC (Swarm in Action - Technical Proof) */}
      <VisualPOC />

      {/* Section 5 — Resume Comparison (Tailoring Transformation - Tangible Value) */}
      <ResumeComparison />

      {/* Section 6 — Success Wall (Testimonials - Social Proof) */}
      <SuccessWall />

      {/* Section 7 — Swarm Stats (Scale & Reassurance) */}
      <SwarmStats />

      {/* Section 8 — Swarm Capabilities (Deep Features) */}
      <SwarmCapabilities />

      {/* Section 9 — CTA Band */}
      <section className="relative px-6 py-32 overflow-hidden border-t border-slate-200/50 z-10">
        <ScrollReveal className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold text-content-primary tracking-tight leading-tight">
            The Swarm is ready. <br /><span className="text-blue-600">Are you?</span>
          </h2>
          <p className="text-content-muted text-xl max-w-xl mx-auto">
            Join the elite circle of job seekers using agentic swarms to dominate 
            the placement season.
          </p>
          <GlowButton variant="primary" size="lg" href="/login" className="px-12 h-16 text-lg font-bold shadow-glow-blue">
            Create Free Account
          </GlowButton>
          <p className="text-sm text-content-subtle">
            ₹0 to start · No credit card · India-first ecosystem
          </p>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 px-6 py-12 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <Logo size="lg" variant="light" />
            <p className="text-sm text-content-muted max-w-sm">
              The world&apos;s first student-focused agent swarm for job placement automation. 
              Built with precision in India, for the global workforce.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-content-primary">The Swarm</h4>
            <ul className="space-y-2 text-sm text-content-muted">
              <li>Saarthi</li>
              <li>Parichay</li>
              <li>Anveshan</li>
              <li>Setu</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-content-primary">Trust</h4>
            <ul className="space-y-2 text-sm text-content-muted">
              <li>MNC Placements</li>
              <li>Privacy Vault</li>
              <li>Security Audit</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-[10px] text-content-subtle uppercase tracking-[0.2em]">
          © 2026 Talvix Technologies Private Limited · Swarm-Operating System v3.5
        </div>
      </footer>
    </main>
  )
}
