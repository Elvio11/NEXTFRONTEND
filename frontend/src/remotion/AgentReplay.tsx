'use client'

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { SwarmLiveFeed } from '@/components/ui/SwarmLiveFeed'

const AgentReplay = () => {
  const frame = useCurrentFrame()
  
  // Timeline setup for a 300-frame video (10 seconds @ 30fps)
  // We'll show a "Dashboard" feel with the live feed in the center
  
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const scale = interpolate(frame, [0, 60], [0.95, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill className="bg-[#020617] items-center justify-center p-20 overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div 
        style={{ opacity, transform: `scale(${scale})` }}
        className="w-full h-full max-w-5xl flex flex-col gap-6 relative z-10"
      >
        {/* Top Navigation Mockup */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black italic text-white text-xs">T</div>
              <span className="font-bold text-white tracking-tighter">TALVIX <span className="text-blue-500">SWARM</span></span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="text-blue-400">Dashboard</span>
              <span>Scout</span>
              <span>Tailor</span>
              <span>Apply</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-blue-500" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-6">
          {/* Left: Intelligence Stats */}
          <div className="col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Intelligence</p>
              <div className="space-y-4">
                {[
                  { label: 'Agent Shilpakaar', val: 'Tailoring Resume...', color: 'text-blue-400' },
                  { label: 'Agent Sankhya', val: 'Scoring FIT: 98%', color: 'text-violet-400' },
                  { label: 'Agent Setu', val: 'Applying Indeed', color: 'text-orange-400' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className={stat.color}>{stat.val}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full opacity-50 ${stat.color.replace('text', 'bg')}`}
                        style={{ width: `${60 + (i * 10) + (Math.sin(frame / 10) * 10)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-blue-600 border border-blue-500 space-y-1 shadow-lg shadow-blue-600/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Daily Goal</p>
              <h3 className="text-2xl font-black text-white">12 / 15</h3>
              <p className="text-[10px] text-blue-100/60 font-medium">Applications Sent Today</p>
            </div>
          </div>

          {/* Center/Right: The Live Feed */}
          <div className="col-span-8">
            <SwarmLiveFeed frame={frame} />
          </div>
        </div>
      </div>

      {/* Floating Cursor Animation */}
      <div 
        style={{
          position: 'absolute',
          top: interpolate(frame, [0, 100, 200, 300], [800, 400, 450, 400], { extrapolateRight: 'clamp' }),
          left: interpolate(frame, [0, 100, 200, 300], [1000, 1200, 1150, 1200], { extrapolateRight: 'clamp' }),
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: 'clamp' }),
          zIndex: 50
        }}
        className="pointer-events-none"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
    </AbsoluteFill>
  )
}

export default AgentReplay
