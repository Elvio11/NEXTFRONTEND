'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AgentAvatar } from './AgentAvatar'
import { 
  SaarthiIcon, PraveshIcon, ParichayIcon, KaushalIcon, NitiIcon, 
  SankhyaIcon, ShuddhiIcon, GuruIcon, AnveshanIcon, ShilpakaarIcon, 
  PrernaIcon, SetuIcon, VachaIcon, AnuvartanIcon, SamanvayIcon 
} from './AgentIcons'

const AGENTS = [
  { id: 1, name: 'Saarthi', icon: SaarthiIcon, color: '#3b82f6', ring: 0 },
  { id: 2, name: 'Pravesh', icon: PraveshIcon, color: '#3b82f6', ring: 0 },
  { id: 3, name: 'Parichay', icon: ParichayIcon, color: '#60a5fa', ring: 0 },
  { id: 4, name: 'Kaushal', icon: KaushalIcon, color: '#8b5cf6', ring: 0 },
  { id: 5, name: 'Niti', icon: NitiIcon, color: '#8b5cf6', ring: 1 },
  { id: 6, name: 'Sankhya', icon: SankhyaIcon, color: '#3b82f6', ring: 1 },
  { id: 7, name: 'Shuddhi', icon: ShuddhiIcon, color: '#60a5fa', ring: 1 },
  { id: 8, name: 'Guru', icon: GuruIcon, color: '#22c55e', ring: 1 },
  { id: 9, name: 'Anveshan', icon: AnveshanIcon, color: '#3b82f6', ring: 1 },
  { id: 10, name: 'Shilpakaar', icon: ShilpakaarIcon, color: '#3b82f6', ring: 2 },
  { id: 11, name: 'Prerna', icon: PrernaIcon, color: '#8b5cf6', ring: 2 },
  { id: 12, name: 'Setu', icon: SetuIcon, color: '#f97316', ring: 2 },
  { id: 13, name: 'Vacha', icon: VachaIcon, color: '#f97316', ring: 2 },
  { id: 14, name: 'Anuvartan', icon: AnuvartanIcon, color: '#3b82f6', ring: 2 },
  { id: 15, name: 'Samanvay', icon: SamanvayIcon, color: '#60a5fa', ring: 2 },
]

const RINGS = [
  { radius: 110, duration: 25, direction: 1 },
  { radius: 210, duration: 40, direction: -1 },
  { radius: 310, duration: 60, direction: 1 },
]

export const TheSwarmBrain = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative w-full h-[400px] md:h-[650px] mx-auto flex items-center justify-center overflow-hidden select-none">
      <div className="relative w-[620px] h-[620px] shrink-0 scale-[0.6] sm:scale-75 md:scale-100 flex items-center justify-center">
      {/* Central Core */}
      <div className="absolute z-50">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 40px rgba(59,130,246,0.3)',
              '0 0 80px rgba(59,130,246,0.5)',
              '0 0 40px rgba(59,130,246,0.3)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full bg-slate-950 border border-blue-500/50 flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl animate-pulse" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-mono font-black tracking-widest text-blue-400 uppercase">Talvix</span>
            <span className="text-[12px] font-mono font-black tracking-widest text-white uppercase">Core</span>
          </div>
          
          {/* Internal rotating elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 border-t-2 border-blue-400/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 border-b-2 border-blue-600/20 rounded-full"
          />
        </motion.div>
      </div>

      {/* Orbital Rings */}
      {RINGS.map((ring, idx) => (
        <div key={idx} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: ring.direction * 360 }}
            transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
            style={{ width: ring.radius * 2, height: ring.radius * 2 }}
            className="relative pointer-events-none"
          >
            {/* The actual ring line */}
            <div className="absolute inset-0 rounded-full border border-slate-200 border-dashed opacity-20" />
            
            {/* Agents on this ring */}
            {AGENTS.filter(a => a.ring === idx).map((agent, i, arr) => {
              const angle = (i / arr.length) * Math.PI * 2
              const x = Math.cos(angle) * ring.radius
              const y = Math.sin(angle) * ring.radius
              
              return (
                <div 
                  key={agent.id}
                  className="absolute"
                  style={{ 
                    left: '50%', 
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  }}
                >
                  <motion.div
                    animate={{ rotate: ring.direction * -360 }}
                    transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
                    className="group relative flex items-center justify-center pointer-events-auto"
                  >
                    <AgentAvatar 
                      icon={agent.icon}
                      color={agent.color}
                      name={agent.name}
                      className="w-14 h-14"
                      glowIntensity="medium"
                    />
                    
                    {/* Floating Label */}
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full shadow-2xl">
                        <span className="text-[10px] font-mono font-black tracking-widest text-white uppercase">
                          {agent.name}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </motion.div>
        </div>
      ))}

      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
      </div>

      </div>
    </div>
  )
}
