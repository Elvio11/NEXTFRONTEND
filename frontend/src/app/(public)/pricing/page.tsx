import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { Check, ShieldCheck } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    description: 'Perfect for exploring the swarm potential.',
    features: ['Top 3 Matches / Week', 'Standard Resume Parse', 'WhatsApp Alerts', 'Community Access'],
    cta: 'Enter Swarm',
    highlight: false
  },
  {
    name: 'Professional',
    price: '₹399',
    description: 'Unleash the full 15-agent execution swarm.',
    features: ['Top 25 Matches / Week', 'Tier 1 Auto-Apply', 'MNC Priority Filter', 'Daily Guru Coach', 'LinkedIn Networking'],
    cta: 'Upgrade to Pro',
    highlight: true
  },
  {
    name: 'Student',
    price: '₹99',
    description: 'Tailored for early career and internship hunts.',
    features: ['Top 10 Matches / Week', 'Internship Radar', 'Skill Gap Analysis', 'Verified Badges'],
    cta: 'Start Student Plan',
    highlight: false
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-base pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest">
            Pricing Protocols
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-content-primary uppercase">
            Fuel the <span className="text-blue-600">Swarm.</span>
          </h1>
          <p className="text-content-muted text-lg max-w-2xl mx-auto">
            Choose the protocol that fits your career velocity. 
            All plans include Sarvam-M intelligence.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <GlassCard 
                key={plan.name}
                className={`p-10 flex flex-col items-start relative overflow-hidden bg-white border ${plan.highlight ? 'border-blue-300 shadow-xl' : 'border-slate-200 shadow-sm'}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 p-3 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-glow-blue">
                    Most Popular Protocol
                  </div>
                )}
                
                <div className="mb-8 w-full">
                  <h3 className="text-xl font-black italic tracking-tighter text-content-primary uppercase mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-content-primary">{plan.price}</span>
                    <span className="text-content-muted text-[10px] font-bold uppercase tracking-widest">/ Month</span>
                  </div>
                  <p className="text-xs text-content-subtle mt-4 leading-relaxed group-hover:text-content-primary transition-colors">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 w-full">
                      <div className="p-0.5 mt-0.5 rounded-full bg-blue-100 text-blue-600">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-medium text-content-muted">{feature}</span>
                    </div>
                  ))}
                </div>

                <GlowButton 
                  variant={plan.highlight ? 'primary' : 'ghost'} 
                  className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em]" 
                  href="/login"
                >
                  {plan.cta}
                </GlowButton>
              </GlassCard>
            ))}
        </div>

        <div className="text-center p-12 rounded-3xl bg-slate-50 border border-slate-200">
           <ShieldCheck className="w-8 h-8 text-blue-500 mx-auto mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">
             All payments secured by Razorpay • AES-256 Protocol Encrypted
           </p>
        </div>
      </div>
    </div>
  )
}
