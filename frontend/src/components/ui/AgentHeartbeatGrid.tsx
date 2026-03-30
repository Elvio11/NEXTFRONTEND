'use client'

'use client'
import { motion } from 'framer-motion'
import { 
  SaarthiIcon, PraveshIcon, ParichayIcon, KaushalIcon, NitiIcon, 
  SankhyaIcon, ShuddhiIcon, GuruIcon, AnveshanIcon, ShilpakaarIcon, 
  PrernaIcon, SetuIcon, VachaIcon, AnuvartanIcon, SamanvayIcon 
} from './AgentIcons'
import { AgentAvatar } from './AgentAvatar'

const AGENTS = [
  { name: 'Saarthi', icon: SaarthiIcon, color: '#3b82f6' },
  { name: 'Pravesh', icon: PraveshIcon, color: '#3b82f6' },
  { name: 'Parichay', icon: ParichayIcon, color: '#60a5fa' },
  { name: 'Kaushal', icon: KaushalIcon, color: '#8b5cf6' },
  { name: 'Niti', icon: NitiIcon, color: '#8b5cf6' },
  { name: 'Sankhya', icon: SankhyaIcon, color: '#3b82f6' },
  { name: 'Shuddhi', icon: ShuddhiIcon, color: '#60a5fa' },
  { name: 'Guru', icon: GuruIcon, color: '#22c55e' },
  { name: 'Anveshan', icon: AnveshanIcon, color: '#3b82f6' },
  { name: 'Shilpakaar', icon: ShilpakaarIcon, color: '#3b82f6' },
  { name: 'Prerna', icon: PrernaIcon, color: '#8b5cf6' },
  { name: 'Setu', icon: SetuIcon, color: '#f97316' },
  { name: 'Vacha', icon: VachaIcon, color: '#f97316' },
  { name: 'Anuvartan', icon: AnuvartanIcon, color: '#3b82f6' },
  { name: 'Samanvay', icon: SamanvayIcon, color: '#60a5fa' },
]

export const AgentHeartbeatGrid = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {AGENTS.map((agent, i) => (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="relative group p-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md"
        >
          {/* Animated Glow Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl pointer-events-none"
            style={{ backgroundColor: agent.color }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <AgentAvatar 
              icon={agent.icon} 
              color={agent.color} 
              name={agent.name}
              className="w-20 h-20"
              glowIntensity="high"
            />
            
            <div className="space-y-2">
              <h3 className="text-base font-mono font-black tracking-widest text-content-primary uppercase opacity-90 group-hover:opacity-100 transition-opacity">
                {agent.name}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-content-muted font-bold">
                  Network Active
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
