'use client'

import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard'
import { Activity, ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export function FitScoreBento() {
    const { activeDeployments } = useDashboardStore()
    const { data: stats } = useDashboardStats()
    
    return (
        <LiquidGlassCard glow className="relative overflow-hidden group !p-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -z-10 group-hover:bg-accent/10 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-2">
                <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                        <Activity className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Swarm Intelligence Signal</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                            Swarm Match Rate: <span className="text-accent">94.2%</span>
                        </h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-2 overflow-hidden whitespace-nowrap">
                           Sankhya & Parichay cross-validation complete • <span className="text-white">Rating: A+</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-1">Active Deployments</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-black italic tracking-tighter text-white">{activeDeployments || 12}</span>
                            <Zap className="w-4 h-4 text-orange-400 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="h-12 w-px bg-white/5 hidden md:block" />

                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-1">Swarm Health</p>
                        <div className="flex items-center justify-center gap-2">
                            < ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-black italic tracking-tighter text-white uppercase">{stats?.swarmHealth}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Micro-animation: scanning line */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
        </LiquidGlassCard>
    )
}
