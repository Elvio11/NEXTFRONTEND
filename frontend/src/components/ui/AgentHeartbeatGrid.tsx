'use client'

'use client'
import { motion } from 'framer-motion'
import {
  Activity,
  Shield,
  Search,
  Zap,
  MessageSquare,
  FileText,
  Send,
  RefreshCw,
  BarChart3,
  GraduationCap,
  Briefcase,
  Brain,
  Code,
  Target,
  Fingerprint
} from 'lucide-react'
import { AgentAvatar } from './AgentAvatar'

const AGENTS = [
  { name: 'Saarthi', icon: GraduationCap, color: '#3b82f6' },
  { name: 'Pravesh', icon: Shield, color: '#3b82f6' },
  { name: 'Parichay', icon: Fingerprint, color: '#60a5fa' },
  { name: 'Kaushal', icon: Target, color: '#8b5cf6' },
  { name: 'Niti', icon: BarChart3, color: '#8b5cf6' },
  { name: 'Sankhya', icon: Code, color: '#3b82f6' },
  { name: 'Shuddhi', icon: RefreshCw, color: '#60a5fa' },
  { name: 'Guru', icon: MessageSquare, color: '#22c55e' },
  { name: 'Anveshan', icon: Search, color: '#3b82f6' },
  { name: 'Shilpakaar', icon: Briefcase, color: '#3b82f6' },
  { name: 'Prerna', icon: FileText, color: '#8b5cf6' },
  { name: 'Setu', icon: Zap, color: '#f97316' },
  { name: 'Vacha', icon: Brain, color: '#f97316' },
  { name: 'Anuvartan', icon: Send, color: '#3b82f6' },
  { name: 'Samanvay', icon: Activity, color: '#60a5fa' },
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
          className="relative group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden"
        >
          {/* Animated Glow Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-3xl pointer-events-none"
            style={{ backgroundColor: agent.color }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <AgentAvatar 
              icon={agent.icon} 
              color={agent.color} 
              name={agent.name}
              className="w-16 h-16"
              glowIntensity="medium"
            />
            
            <div className="space-y-2">
              <h3 className="text-base font-mono font-black tracking-widest text-white uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                {agent.name}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
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
