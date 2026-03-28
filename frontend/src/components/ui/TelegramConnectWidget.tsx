'use client'

'use client'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TelegramConnectWidgetProps {
  userId?: string
  isConnected?: boolean
}

export const TelegramConnectWidget: React.FC<TelegramConnectWidgetProps> = ({
  userId,
  isConnected = false,
}) => {
  const tgBotUrl = `https://t.me/TalvixBot?start=${userId || 'guest'}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group p-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-colors duration-500" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-glow-blue">
          <Send className="w-8 h-8 text-blue-400" />
        </div>

        <div className="flex-grow space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Telegram Command Center
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
              Primary
            </span>
          </div>
          <p className="text-sm text-content-muted max-w-md">
            Get instant job alerts, connection stability warnings, and control your swarm 
            directly from Telegram. No more missing opportunities.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            {[
              { text: 'Instant Alerts', icon: Zap },
              { text: 'Secure Link', icon: ShieldCheck },
              { text: 'Auto-Apply Control', icon: CheckCircle2 },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-blue-300/80 font-medium">
                <feature.icon className="w-3.5 h-3.5" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          {isConnected ? (
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Connected to Swarm
            </div>
          ) : (
            <a
              href={tgBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group/btn relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl",
                "bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-glow-blue",
                "text-white font-bold text-sm overflow-hidden"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              <Send className="w-4 h-4" />
              Connect TalvixBot
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
