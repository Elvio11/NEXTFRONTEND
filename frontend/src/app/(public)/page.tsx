'use client'

import { motion } from 'framer-motion'
import { TheSwarmBrain } from '@/components/ui/TheSwarmBrain'
import { MNCWall } from '@/components/ui/MNCWall'
import { AgentHeartbeatGrid } from '@/components/ui/AgentHeartbeatGrid'
import { TelegramConnectWidget } from '@/components/ui/TelegramConnectWidget'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import {
  Zap,
  BarChart3,
  ArrowRight,
  Fingerprint,
} from 'lucide-react'
import { AgentAvatar } from '@/components/ui/AgentAvatar'

export default function LandingPage() {
  return (
    <main className="bg-bg-base min-h-screen text-content-primary overflow-x-hidden font-sans">
      
      {/* Section 1 — Hero: The Swarm Brain */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 inset-x-0 h-screen bg-hero-glow pointer-events-none" />
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

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">
              Hire the <span className="text-blue-500">Swarm</span>.
              <br />
              Secure your <span className="text-violet-500">Future</span>.
            </h1>

            <p className="text-lg md:text-xl text-content-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Talvix deploys 15 specialized AI agents to find, score, and apply to 
              premium jobs from the Indian market while you sleep.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <GlowButton variant="primary" size="lg" href="/login" className="px-10 h-14 text-base">
                Join the Swarm
                <ArrowRight className="w-5 h-5 ml-2" />
              </GlowButton>
              <GlowButton variant="ghost" size="lg" href="#how" className="h-14 text-base border-white/5 bg-white/5">
                Explore the Network
              </GlowButton>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div key="stat-jobs">
                <p className="text-2xl font-bold text-white">150K+</p>
                <p className="text-[10px] uppercase tracking-widest text-content-muted font-bold">Live Jobs</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div key="stat-agents">
                <p className="text-2xl font-bold text-white">15</p>
                <p className="text-[10px] uppercase tracking-widest text-content-muted font-bold">AI Agents</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div key="stat-wa">
                <p className="text-2xl font-bold text-white">₹0</p>
                <p className="text-[10px] uppercase tracking-widest text-content-muted font-bold">WA Coaching</p>
              </div>
            </div>
          </motion.div>

          {/* Swarm Visualization Right Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <TheSwarmBrain />
          </motion.div>
        </div>
      </section>

      {/* Section 2 — The Success Wall */}
      <section className="border-y border-white/5">
        <MNCWall />
      </section>

      {/* Section 3 — The Agent Registry */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Meet the Swarm
          </h2>
          <p className="text-content-muted text-lg max-w-2xl mx-auto">
            15 specialised Sanskrit-named agents, each a master of one specific part 
            of your professional journey.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <AgentHeartbeatGrid />
        </ScrollReveal>

        <div className="mt-20">
          <BentoGrid>
            <div className="md:col-span-4">
              <GlassCard glow="blue" className="p-8 h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-4">
                      <AgentAvatar
                        icon={Fingerprint}
                        color="#60a5fa"
                        name="Parichay"
                        className="w-14 h-14"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Parichay: Identifying Your Potential
                    </h3>
                    <p className="text-content-muted mb-6 leading-relaxed">
                      Our Resume Intelligence agent parses your experience with deeper semantic 
                      understanding than any traditional ATS. It doesn't just read keywords; it builds 
                      your professional identity.
                    </p>
                  </div>
                  <div className="hidden lg:block w-48 h-48 bg-blue-500/5 rounded-full blur-2xl -mr-12" />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-grow bg-blue-500/20 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-2">
              <GlassCard glow="violet" className="p-8 h-full flex flex-col justify-center">
                <p className="text-5xl font-extrabold text-white mb-2 tracking-tighter">150K+</p>
                <p className="text-content-muted font-medium">jobs scored nightly by Sankhya</p>
                <div className="mt-4 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-content-muted italic">
                  "Only scores ≥ 40 reach your desk. Pure signal, zero noise."
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-3">
              <GlassCard className="p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="mb-4">
                    <AgentAvatar
                      icon={Zap}
                      color="#f97316"
                      name="Setu"
                      className="w-12 h-12"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">Setu: The Application Bridge</h3>
                </div>
                <p className="text-content-muted text-sm leading-relaxed mb-6">
                  Seamlessly applying through Indeed and LinkedIn Easy Apply. Setu handles 
                  the mechanics of submission during high-stability windows (8PM – 6AM).
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Execution Live</span>
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-3">
              <GlassCard glow="violet" className="p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="mb-4">
                    <AgentAvatar
                      icon={BarChart3}
                      color="#8b5cf6"
                      name="Niti"
                      className="w-12 h-12"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">Niti: Career Intelligence</h3>
                </div>
                <p className="text-content-muted text-sm leading-relaxed mb-6">
                  Salary benchmarking and market demand analysis for the Indian tech ecosystem. 
                  Know your worth before the first interview.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[40, 70, 90].map((_, i) => (
                    <div key={i} className="h-8 bg-violet-500/10 rounded border border-violet-500/20 flex items-center justify-center">
                      <div className="h-1 w-full max-w-[60%] bg-violet-500/40 rounded-full" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </BentoGrid>
        </div>
      </section>

      {/* Section 4 — The Primary Channel */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <TelegramConnectWidget />
      </section>

      {/* Section 5 — CTA Band */}
      <section className="relative px-6 py-32 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-hero-glow opacity-30 pointer-events-none" />
        <ScrollReveal className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            The Swarm is ready. <br /><span className="text-blue-500">Are you?</span>
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
      <footer className="border-t border-white/5 bg-white/[0.01] px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-4">
            <h2 className="text-2xl font-black italic tracking-tighter text-white">TALVIX</h2>
            <p className="text-sm text-content-muted max-w-sm">
              The world&apos;s first student-focused agent swarm for job placement automation. 
              Built with precision in India, for the global workforce.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">The Swarm</h4>
            <ul className="space-y-2 text-sm text-content-muted">
              <li>Saarthi</li>
              <li>Parichay</li>
              <li>Anveshan</li>
              <li>Setu</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Trust</h4>
            <ul className="space-y-2 text-sm text-content-muted">
              <li>MNC Placements</li>
              <li>Privacy Vault</li>
              <li>Security Audit</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-[10px] text-content-subtle uppercase tracking-[0.2em]">
          © 2026 Talvix Technologies Private Limited · Swarm-Operating System v3.5
        </div>
      </footer>
    </main>
  )
}
