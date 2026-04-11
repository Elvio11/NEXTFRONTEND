'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { MapPin, Globe, Building2, IndianRupee, Sparkles, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
// No motion needed

interface PrernaProps {
  onComplete: (prefs: any) => void
}

export function Prerna({ onComplete }: PrernaProps) {
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('remote')
  const [salary, setSalary] = useState(12) // In LPA
  const [locations, setLocations] = useState<string[]>(['Bengaluru', 'Remote'])
  const [isAddingLoc, setIsAddingLoc] = useState(false)
  const [newLoc, setNewLoc] = useState('')

  const handleAddLoc = () => {
    if (newLoc.trim() && !locations.includes(newLoc.trim())) {
      setLocations(prev => [...prev, newLoc.trim()])
    }
    setNewLoc('')
    setIsAddingLoc(false)
  }

  const handleComplete = () => {
    onComplete({ workMode, salary, locations })
  }

  return (
    <GlassCard className="p-8 max-w-3xl mx-auto border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-glow-blue/5">
          <Navigation className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 05: Prerna Protocol</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Map your career trajectory and environmental preferences
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Work Mode */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle px-1">Engagement Model</p>
          <div className="grid grid-cols-3 gap-3">
             {[
               { id: 'remote', label: 'Remote', icon: Globe },
               { id: 'hybrid', label: 'Hybrid', icon: Building2 },
               { id: 'onsite', label: 'On-site', icon: MapPin }
             ].map((mode) => (
               <button
                 key={mode.id}
                 onClick={() => setWorkMode(mode.id as any)}
                 className={cn(
                   "p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-300",
                   workMode === mode.id 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-glow-blue/5" 
                    : "bg-white/[0.01] border-white/5 text-content-subtle hover:border-white/20"
                 )}
               >
                 <mode.icon className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
               </button>
             ))}
          </div>
        </div>

        {/* Salary Slider */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Salary Benchmark</p>
             <div className="flex items-center gap-1.5 text-blue-400">
               <IndianRupee className="w-3.5 h-3.5" />
               <span className="text-lg font-black tracking-tighter">{salary} LPA</span>
             </div>
          </div>
          <div className="relative h-2 w-full bg-white/5 rounded-full mt-4">
             <input 
               type="range"
               min="3"
               max="60"
               step="1"
               value={salary}
               onChange={(e) => setSalary(parseInt(e.target.value))}
               className="absolute w-full h-full bg-transparent appearance-none cursor-pointer z-10 accent-blue-500"
             />
             <div 
               className="absolute top-0 left-0 h-full bg-blue-500 shadow-glow-blue rounded-full"
               style={{ width: `${((salary - 3) / 57) * 100}%` }}
             />
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-content-muted">
            <span>Entry Level (3)</span>
            <span>Architect Level (60+)</span>
          </div>
        </div>

        {/* Location Tags */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle px-1">Target Citadels</p>
          <div className="flex flex-wrap gap-2.5">
            {locations.map(loc => (
              <div 
                key={loc}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white group"
              >
                <span>{loc}</span>
                <button 
                  onClick={() => setLocations(prev => prev.filter(l => l !== loc))}
                  className="p-1 rounded-md opacity-30 hover:opacity-100 hover:text-red-400 transition-all"
                >
                  {/* Small X */}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {isAddingLoc ? (
              <input
                type="text"
                autoFocus
                value={newLoc}
                onChange={e => setNewLoc(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddLoc()
                  if (e.key === 'Escape') setIsAddingLoc(false)
                }}
                onBlur={handleAddLoc}
                className="px-3 py-1.5 rounded-xl border border-blue-500/50 bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest text-white outline-none w-32"
                placeholder="CITY..."
              />
            ) : (
              <button 
                onClick={() => setIsAddingLoc(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-content-subtle hover:border-blue-500/50 hover:text-blue-400 transition-all"
              >
                Add City
              </button>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="pt-4">
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-glow-blue transition-all active:scale-[0.98]"
          >
            Map Career Coordinates
          </button>
          <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[8px] font-bold text-content-subtle uppercase tracking-widest text-balance">
              Prerna will customize cover letters to match your selected compensation level
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
