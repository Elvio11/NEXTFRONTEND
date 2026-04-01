'use client'

import { motion } from 'framer-motion'
import { Quote, Star, TrendingUp, CheckCircle2, User } from 'lucide-react'
import { GridBackground } from './GridBackground'

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    role: 'SDE-2 @ Zomato',
    quote: "Talvix's Agent 10 (Tailor) changed everything. My resume went from a 30% match to 98% in seconds. I got three interview calls in 3 days.",
    metrics: 'Active User #840'
  },
  {
    name: 'Priya Sharma',
    role: 'Frontend Dev @ Nykaa',
    quote: "The Daily Coach (Saarthi) sent me JD-specific talking points on WhatsApp that saved my interview. It's like having a senior dev in your pocket.",
    metrics: '4x Interview Rate'
  },
  {
    name: 'Ishaan Verma',
    role: 'SDE Intern @ Urban Company',
    quote: "As a student, I was lost in the mass-hiring noise. Talvix found me a core-engineering internship at a top Indian unicorn. Agent 12's automation is a lifesaver.",
    metrics: 'Placed in 12 Days'
  },
  {
    name: 'Rohan Gupta',
    role: 'Fullstack @ Swiggy',
    quote: "I was struggling with generic applications. Talvix found 400+ jobs I never saw on LinkedIn. The parallel processing is mental.",
    metrics: '14 Days to Offer'
  },
  {
    name: 'Ananya Iyer',
    role: 'SDE @ TCS',
    quote: "The Vault's security gave me peace of mind. Automated 200+ Indeed applications while I was at my day job. Seamless.",
    metrics: 'Top 5% Fit Score'
  },
  {
    name: 'Meera Das',
    role: 'DevOps Intern @ Ola',
    quote: "Agent 6 (Fit Scorer) pointed out a tiny gap in my AWS knowledge. I fixed it, and Agent 9 found me an internship at Ola the next week. Truly smart tech.",
    metrics: 'Internship Secured'
  },
  {
    name: 'Kabir Singh',
    role: 'Backend Intern @ Zepto',
    quote: "The agentic swarm handled the follow-ups while I was attending classes. Got my internship at Zepto without manual stress. Highly recommend for students.",
    metrics: 'Internship @ Zepto'
  },
  {
    name: 'Sana Khan',
    role: 'Product Designer @ CRED',
    quote: "Talvix's precision in JD cleaning helped me skip the junk and focus on high-impact design roles. The dashboard clarity is unmatched in India.",
    metrics: 'Landed @ CRED'
  }
]

const STATS = [
  { label: 'Alpha Placements', value: '250+', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Jobs Matched', value: '50k+', icon: <CheckCircle2 className="w-4 h-4" /> },
  { label: 'Interview Rate', value: '4x Avg', icon: <Star className="w-4 h-4" /> }
]

export const SuccessWall = () => {
  return (
    <section id="success" className="py-24 px-6 relative overflow-hidden bg-bg-base/20 border-y border-slate-200/50">
      <GridBackground />
      {/* Deep Atmospheric Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 mx-auto">
            Success Stories
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 font-medium">
            Documented Placement Wins from the Talvix Alpha
          </p>
        </div>

        {/* Dense Grid of Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {TESTIMONIALS.map((t, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="p-6 rounded-[2rem] border border-rose-200/50 bg-rose-50/40 backdrop-blur-xl relative overflow-hidden group hover:shadow-xl transition-all duration-500 shadow-sm flex flex-col justify-between h-full min-h-[260px] w-full min-w-0"
             >
               {/* Decorative Swarm Pip */}
               <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                 <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[7px] font-black uppercase tracking-widest text-blue-500">Nexus Confirmed</span>
               </div>

               <div className="space-y-4">
                 <Quote className="w-6 h-6 text-rose-400 opacity-20" />
                 <p className="text-[13px] font-medium leading-relaxed tracking-tight text-slate-700 italic">
                   "{t.quote}"
                 </p>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-rose-200/50 mt-6">
                 <div className="flex items-center gap-2.5">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-100 to-blue-100 flex items-center justify-center border border-white/50 overflow-hidden shadow-inner">
                      <User className="w-5 h-5 text-rose-400 opacity-40 translate-y-0.5" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-black text-slate-900 tracking-tight">{t.name}</span>
                     <span className="text-[9px] font-bold text-slate-400 truncate max-w-[90px] uppercase tracking-widest leading-none">{t.role}</span>
                   </div>
                 </div>
                 <div className="text-[9px] font-black text-rose-500 italic tracking-tighter uppercase whitespace-nowrap px-1.5 py-0.5 rounded-lg bg-rose-50/50 border border-rose-100/50">
                    {t.metrics}
                 </div>
               </div>
             </motion.div>
           ))}
        </div>

        {/* Stats Row at bottom for a cleaner finish */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
           {STATS.map((stat, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
             >
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{stat.value}</p>
               </div>
               <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                 {stat.icon}
               </div>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  )
}
