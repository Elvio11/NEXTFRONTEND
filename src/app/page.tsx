'use client'
import { GridBackground } from '@/components/ui/GridBackground'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import {
  FileSearch,
  Zap,
  MessageCircle,
  Brain,
  TrendingUp,
  BarChart3,
  Search,
  Check,
} from 'lucide-react'
import { motion } from 'framer-motion'

const words = ['Applies', 'Tailors', 'Scores', 'Negotiates']

const statItems = [
  '150,000+ Live Jobs',
  '15 AI Agents',
  'Auto-Apply · Indeed + LinkedIn',
  '₹0/msg WhatsApp Coaching',
  '10 Applications/Day',
  'Self-Learning System',
]

export default function LandingPage() {
  return (
    <main className="bg-[#050505] min-h-screen text-[#f1f5f9] overflow-x-hidden">
      {/* Section 1 — Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <GridBackground />
        <RadialGlow color="blue" position="top" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Eyebrow pill */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          >
            <span className="inline-block text-sm px-4 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#64748b] mb-6">
              ✦&nbsp; {"India's First AI Job Automation Platform"}
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold leading-tight text-[#f1f5f9] mb-6"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          >
            Your AI that{' '}
            <AnimatedText words={words} className="min-w-[4ch] inline-block" />
            <br />
            while you sleep
          </motion.h1>

          {/* Subhead */}
          <motion.p
            className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-10"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          >
            Talvix scrapes 150,000+ jobs nightly, scores every one against your
            profile, and auto-applies to the best — all before you wake up.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4 justify-center mb-8"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          >
            <GlowButton variant="primary" size="lg" href="/login">
              Start Free — No Card Needed
            </GlowButton>
            <GlowButton variant="ghost" size="lg" href="#how">
              See How It Works ↓
            </GlowButton>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          >
            <span className="inline-block text-sm px-5 py-2 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#64748b]">
              ★★★★★&nbsp; Trusted by 2,000+ job seekers&nbsp;·&nbsp;₹0 to start&nbsp;·&nbsp;Cancel anytime
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2 — Stats Ticker */}
      <section className="bg-[#0d0d0d] border-y border-[rgba(255,255,255,0.08)] py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...statItems, ...statItems].map((item, i) => (
            <span
              key={i}
              className="inline-block mx-8 text-sm text-[#64748b] flex-shrink-0"
            >
              {item}
              <span className="mx-8 text-[rgba(255,255,255,0.12)]">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* Section 3 — Bento Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#f1f5f9] mb-4">
            Everything your job search needs. Automated.
          </h2>
          <p className="text-[#64748b] text-lg">
            15 specialised AI agents. Working 24/7 so you don&apos;t have to.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <BentoGrid>
            {/* Row 1 */}
            <div className="md:col-span-4">
              <GlassCard glow="blue" className="p-8 h-full">
                <FileSearch className="w-7 h-7 text-[#3b82f6] mb-4" />
                <h3 className="text-2xl font-bold text-[#f1f5f9] mb-3">
                  Knows your resume better than you do
                </h3>
                <p className="text-[#64748b] mb-6">
                  Parses every word. Generates 3 career persona variants. Finds
                  your strongest market angle for every role.
                </p>
                {/* Animated scan bar */}
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 bg-[rgba(59,130,246,0.4)] rounded-full animate-pulse"
                      style={{ width: `${60 + i * 10}%`, animationDelay: `${i * 0.3}s` }}
                    />
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-2">
              <GlassCard glow="violet" className="p-8 h-full">
                <p className="text-5xl font-extrabold text-[#f1f5f9] mb-2">150K+</p>
                <p className="text-[#64748b]">jobs scored against your profile every night</p>
                <p className="text-sm text-[#334155] mt-3">
                  Only scores ≥ 40 reach you. Signal not noise.
                </p>
              </GlassCard>
            </div>

            {/* Row 2 */}
            <div className="md:col-span-2">
              <GlassCard className="p-6 h-full">
                <Zap className="w-6 h-6 text-[#3b82f6] mb-3" />
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-2">
                  Applies while you sleep
                </h3>
                <p className="text-[#64748b] text-sm">
                  Indeed Easy Apply + LinkedIn Easy Apply. 8PM–6AM window. 10 per day.
                </p>
              </GlassCard>
            </div>

            <div className="md:col-span-2">
              <GlassCard className="p-6 h-full">
                <MessageCircle className="w-6 h-6 text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-2">
                  ₹0 per message. Forever.
                </h3>
                <p className="text-[#64748b] text-sm mb-3">
                  Baileys-powered. No Meta API costs. Daily coaching + application alerts.
                </p>
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#64748b]">
                  ₹0/msg vs ₹1.10/msg competitors
                </span>
              </GlassCard>
            </div>

            <div className="md:col-span-2">
              <GlassCard glow="violet" className="p-6 h-full">
                <Brain className="w-6 h-6 text-[#8b5cf6] mb-3" />
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-2">
                  Gets smarter with every result
                </h3>
                <p className="text-[#64748b] text-sm">
                  3-layer learning: real-time signals, daily micro-adjustments, weekly calibration.
                </p>
              </GlassCard>
            </div>

            {/* Row 3 */}
            <div className="md:col-span-3">
              <GlassCard className="p-6 h-full">
                <TrendingUp className="w-6 h-6 text-[#3b82f6] mb-3" />
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-2">
                  Know exactly what to learn next
                </h3>
                <p className="text-[#64748b] text-sm">
                  ROI-ranked skill gaps specific to your target roles and market salary data.
                </p>
              </GlassCard>
            </div>

            <div className="md:col-span-3">
              <GlassCard glow="blue" className="p-6 h-full">
                <BarChart3 className="w-6 h-6 text-[#3b82f6] mb-3" />
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-2">
                  Your 4-dimension career score
                </h3>
                <p className="text-[#64748b] text-sm">
                  Skills 30% · Experience 25% · Market Demand 25% · Salary Position 20%
                </p>
              </GlassCard>
            </div>
          </BentoGrid>
        </ScrollReveal>
      </section>

      {/* Section 4 — How It Works */}
      <section id="how" className="max-w-3xl mx-auto px-6 py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#f1f5f9] mb-4">
            From upload to auto-applied. 4 steps.
          </h2>
        </ScrollReveal>

        <div className="space-y-4">
          {[
            {
              n: 1,
              title: 'Upload resume',
              desc: 'PDF or DOCX. Agent 3 parses and builds your profile.',
              icon: FileSearch,
            },
            {
              n: 2,
              title: 'AI scores jobs',
              desc: '150K+ jobs ranked overnight. Best matches surface.',
              icon: Search,
            },
            {
              n: 3,
              title: 'You review',
              desc: 'See every job. Control the apply list. Approve in one click.',
              icon: Check,
            },
            {
              n: 4,
              title: 'Wake up to results',
              desc: 'Applied to the best. WhatsApp confirms each one.',
              icon: MessageCircle,
            },
          ].map(({ n, title, desc, icon: Icon }) => (
            <ScrollReveal key={n} delay={n * 0.1}>
              <GlassCard className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-[#3b82f6] flex-shrink-0">
                  {n}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#f1f5f9] mb-1">{title}</h3>
                  <p className="text-[#64748b] text-sm">{desc}</p>
                </div>
                <Icon className="w-5 h-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Section 5 — Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#f1f5f9] mb-4">Simple pricing.</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <GlassCard className="p-8">
              <p className="text-xs text-[#64748b] uppercase font-semibold tracking-wider mb-2">
                Free Forever
              </p>
              <p className="text-5xl font-extrabold text-[#f1f5f9] mb-1">₹0</p>
              <ul className="space-y-2 my-6">
                {['Job feed', 'Career score', 'Skill gap', 'WhatsApp coaching'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Check className="w-4 h-4 text-[#3b82f6]" />
                    {f}
                  </li>
                ))}
              </ul>
              <GlowButton variant="ghost" size="md" href="/login" className="w-full">
                Start Free
              </GlowButton>
            </GlassCard>

            {/* Pro */}
            <GlassCard glow="blue" className="p-8 border border-[rgba(59,130,246,0.3)] animate-borderGlow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#64748b] uppercase font-semibold tracking-wider">Pro</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border border-[rgba(59,130,246,0.3)]">
                  Most popular
                </span>
              </div>
              <p className="text-5xl font-extrabold text-[#f1f5f9] mb-1">
                ₹499{' '}
                <span className="text-xl font-normal text-[#64748b]">/month</span>
              </p>
              <ul className="space-y-2 my-6">
                {[
                  'All Free features',
                  'Auto-apply (10/day)',
                  'Full fit analysis',
                  'Resume tailoring',
                  'Cover letters',
                  'Dream company boost',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Check className="w-4 h-4 text-[#3b82f6]" />
                    {f}
                  </li>
                ))}
              </ul>
              <GlowButton variant="primary" size="md" href="/login" className="w-full">
                Upgrade to Pro
              </GlowButton>
            </GlassCard>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 6 — CTA Band */}
      <section className="relative px-6 py-24 overflow-hidden bg-hero-glow">
        <RadialGlow color="blue" position="centre" className="opacity-20" />
        <ScrollReveal className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-[#f1f5f9] mb-4">
            Your next job is already in our database.
          </h2>
          <p className="text-[#64748b] mb-8 text-lg">Start free. No card. No catch.</p>
          <GlowButton variant="primary" size="lg" href="/login">
            Create your free account
          </GlowButton>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.08)] px-6 py-8 text-center">
        <p className="text-[#334155] text-sm">
          © 2025 Talvix · Made in India for Indian job seekers
        </p>
      </footer>
    </main>
  )
}
