'use client'

import { AgentHeartbeatGrid } from '@/components/ui/AgentHeartbeatGrid'
import { GlassCard } from '@/components/ui/GlassCard'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { AgentAvatar } from '@/components/ui/AgentAvatar'
import { Search, FileText, Send, Zap, BarChart3, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SwarmPage() {
  return (
    <div className="min-h-screen bg-bg-base pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest">
            Protocol Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-content-primary uppercase">
            Meet the <span className="text-blue-600">Swarm.</span>
          </h1>
          <p className="text-content-muted text-lg max-w-2xl mx-auto">
            15 specialized Sanskrit-named agents synchronized to automate your entire 
            placement lifecycle.
          </p>
        </header>

        <section>
           <AgentHeartbeatGrid />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <GlassCard className="p-8 space-y-4 border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                 <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-content-primary uppercase">Discovery Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 Agents like <strong>Anveshan</strong> and <strong>Sankhya</strong> scan 8+ platforms 
                 simultaneously to find high-match opportunities before they hit the general public.
              </p>
           </GlassCard>

           <GlassCard className="p-8 space-y-4 border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                 <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-content-primary uppercase">Tailoring Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 <strong>Shilpakaar</strong> and <strong>Prerna</strong> rewrite your resume and cover 
                 letter for every single application, ensuring a 90%+ ATS score.
              </p>
           </GlassCard>

           <GlassCard className="p-8 space-y-4 border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                 <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-content-primary uppercase">Execution Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 <strong>Setu</strong> handles the heavy lifting of submissions, managing cap-compliant 
                 bursts to protect your platform reputation.
              </p>
           </GlassCard>
        </section>

        <div className="mt-20">
          <BentoGrid>
            <div className="md:col-span-4">
              <GlassCard glow="blue" className="p-8 h-full border-slate-200 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-4">
                      <AgentAvatar
                        icon={Fingerprint}
                        color="#2563eb"
                        name="Parichay"
                        className="w-14 h-14"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-content-primary mb-3">
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
                      className="h-1 flex-grow bg-blue-100 rounded-full overflow-hidden"
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
              <GlassCard glow="violet" className="p-8 h-full flex flex-col justify-center border-slate-200 bg-white">
                <p className="text-5xl font-extrabold text-content-primary mb-2 tracking-tighter">150K+</p>
                <p className="text-content-muted font-medium">jobs scored nightly by Sankhya</p>
                <div className="mt-4 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-content-muted italic">
                  "Only scores ≥ 40 reach your desk. Pure signal, zero noise."
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-3">
              <GlassCard className="p-8 h-full border-slate-200 bg-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="mb-4">
                    <AgentAvatar
                      icon={Zap}
                      color="#ea580c"
                      name="Setu"
                      className="w-12 h-12"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-content-primary">Setu: The Application Bridge</h3>
                </div>
                <p className="text-content-muted text-sm leading-relaxed mb-6">
                  Seamlessly applying through Indeed and LinkedIn Easy Apply. Setu handles 
                  the mechanics of submission during high-stability windows (8PM – 6AM).
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Execution Live</span>
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-3">
              <GlassCard glow="violet" className="p-8 h-full border-slate-200 bg-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="mb-4">
                    <AgentAvatar
                      icon={BarChart3}
                      color="#7c3aed"
                      name="Niti"
                      className="w-12 h-12"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-content-primary">Niti: Career Intelligence</h3>
                </div>
                <p className="text-content-muted text-sm leading-relaxed mb-6">
                  Salary benchmarking and market demand analysis for the Indian tech ecosystem. 
                  Know your worth before the first interview.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[40, 70, 90].map((_, i) => (
                    <div key={i} className="h-8 bg-violet-50 rounded border border-violet-100 flex items-center justify-center">
                      <div className="h-1 w-full max-w-[60%] bg-violet-400 rounded-full" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </BentoGrid>
        </div>
      </div>
    </div>
  )
}
