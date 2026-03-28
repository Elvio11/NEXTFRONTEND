import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
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

interface AgentNode {
  id: number
  name: string
  role: string
  color: string
  icon: any
}

const AGENTS: AgentNode[] = [
  { id: 1, name: 'Saarthi', role: 'Guide', color: '#3b82f6', icon: GraduationCap },
  { id: 2, name: 'Pravesh', role: 'Entry', color: '#3b82f6', icon: Shield },
  { id: 3, name: 'Parichay', role: 'Intel', color: '#60a5fa', icon: Fingerprint },
  { id: 4, name: 'Kaushal', role: 'Skills', color: '#8b5cf6', icon: Target },
  { id: 5, name: 'Niti', role: 'Career', color: '#8b5cf6', icon: BarChart3 },
  { id: 6, name: 'Sankhya', role: 'Scorer', color: '#3b82f6', icon: Code },
  { id: 7, name: 'Shuddhi', role: 'Cleaner', color: '#60a5fa', icon: RefreshCw },
  { id: 8, name: 'Guru', role: 'Coach', color: '#22c55e', icon: MessageSquare },
  { id: 9, name: 'Anveshan', role: 'Scraper', color: '#3b82f6', icon: Search },
  { id: 10, name: 'Shilpakaar', role: 'Tailor', color: '#3b82f6', icon: Briefcase },
  { id: 11, name: 'Prerna', role: 'Writer', color: '#8b5cf6', icon: FileText },
  { id: 12, name: 'Setu', role: 'Applier', color: '#f97316', icon: Zap },
  { id: 13, name: 'Vacha', role: 'Forms', color: '#f97316', icon: Brain },
  { id: 14, name: 'Anuvartan', role: 'FollowUp', color: '#3b82f6', icon: Send },
  { id: 15, name: 'Samanvay', role: 'Sync', color: '#60a5fa', icon: Activity },
]

// Connections between related agents
const CONNECTIONS = [
  [3, 4], [4, 5], [5, 6], [6, 12], [9, 6], [10, 12], [11, 12], [12, 13], [12, 14], [8, 5], [1, 2], [2, 3], [15, 6]
]

export const TheSwarmBrain = () => {
  const containerRef = useRef<SVGSVGElement>(null)
  const centerX = 400
  const centerY = 400
  const radius = 300

  const nodes = useMemo(() => {
    return AGENTS.map((agent, i) => {
      const angle = (i / AGENTS.length) * Math.PI * 2
      const x = Number((centerX + radius * Math.cos(angle)).toFixed(3))
      const y = Number((centerY + radius * Math.sin(angle)).toFixed(3))
      return { ...agent, x, y }
    })
  }, [])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!containerRef.current) return

    // Pulse animation for connections
    gsap.to('.connection-path', {
      strokeDashoffset: 0,
      duration: 3,
      repeat: -1,
      ease: 'linear',
      stagger: 0.2,
    })
  }, [])

  if (!mounted) return null

  return (
    <div className="relative w-full aspect-square max-w-[800px] mx-auto overflow-visible select-none">
      <svg
        ref={containerRef}
        viewBox="0 0 800 800"
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.1))' }}
      >
        <defs>
          <linearGradient id="pathGradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
            <stop offset="50%" stopColor="rgba(59,130,246,0.6)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.2)" />
          </linearGradient>
        </defs>

        {/* Connection Paths */}
        {CONNECTIONS.map(([startId, endId], i) => {
          const start = nodes.find((n) => n.id === startId)
          const end = nodes.find((n) => n.id === endId)
          if (!start || !end) return null

          return (
            <motion.path
              key={`path-${i}`}
              d={`M ${start.x} ${start.y} Q ${centerX} ${centerY} ${end.x} ${end.y}`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="connection-path"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
          )
        })}

        {/* Swarm Core */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={20}
          className="fill-accent-blue/20 stroke-accent-blue/40"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
        />
        <circle cx={centerX} cy={centerY} r={5} className="fill-accent-blue animate-pulse" />

        {/* Agent Nodes */}
        {nodes.map((node, i) => (
          <g key={node.id} className="cursor-pointer group">
            {/* Connection target (invisible but large for easier hover) */}
            <circle cx={node.x} cy={node.y} r={20} fill="transparent" />
            
            <foreignObject
              x={node.x - 20}
              y={node.y - 20}
              width="40"
              height="40"
              className="overflow-visible"
            >
              <AgentAvatar
                icon={node.icon}
                color={node.color}
                name={node.name}
                className="w-10 h-10"
                glowIntensity="low"
              />
            </foreignObject>

            {/* Labels */}
            <motion.g
              initial={{ opacity: 0, x: node.x > centerX ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.05 }}
            >
              <text
                x={node.x + (node.x > centerX ? 25 : -25)}
                y={node.y - 12}
                textAnchor={node.x > centerX ? 'start' : 'end'}
                className="fill-white/90 text-[14px] font-mono font-bold tracking-tight"
              >
                {node.name}
              </text>
              <text
                x={node.x + (node.x > centerX ? 25 : -25)}
                y={node.y + 12}
                textAnchor={node.x > centerX ? 'start' : 'end'}
                className="fill-white/30 text-[10px] uppercase tracking-widest font-sans font-bold"
              >
                {node.role}
              </text>
            </motion.g>
          </g>
        ))}
      </svg>
    </div>
  )
}
