import { AgentHeartbeatGrid } from '@/components/ui/AgentHeartbeatGrid'
import { GlassCard } from '@/components/ui/GlassCard'
import { Search, FileText, Send } from 'lucide-react'

export default function SwarmPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            Protocol Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase">
            Meet the <span className="text-blue-500">Swarm.</span>
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
           <GlassCard className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">Discovery Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 Agents like <strong>Anveshan</strong> and <strong>Sankhya</strong> scan 8+ platforms 
                 simultaneously to find high-match opportunities before they hit the general public.
              </p>
           </GlassCard>

           <GlassCard className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                 <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">Tailoring Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 <strong>Shilpakaar</strong> and <strong>Prerna</strong> rewrite your resume and cover 
                 letter for every single application, ensuring a 90%+ ATS score.
              </p>
           </GlassCard>

           <GlassCard className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                 <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">Execution Swarm</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                 <strong>Setu</strong> handles the heavy lifting of submissions, managing cap-compliant 
                 bursts to protect your platform reputation.
              </p>
           </GlassCard>
        </section>
      </div>
    </div>
  )
}
