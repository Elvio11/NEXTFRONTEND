'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { GlowButton } from '@/components/ui/GlowButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { 
    LayoutDashboard, 
    Table as TableIcon, 
    Zap, 
    CheckCircle2,
    AlertCircle
} from 'lucide-react'

// Defined Role Families and Seniority for the Matrix
const ROLE_FAMILIES = ['Engineering', 'Product', 'Data Science', 'Design', 'Marketing', 'Sales', 'Operations']
const SENIORITY_LEVELS = ['Mid-Level', 'Senior', 'Staff', 'Principal', 'Executive']

interface BenchmarkLead {
    id: string
    role_title: string
    company_name: string
    location: string
    salary_lpa: number | null
    seniority_index: number | null
    role_family: string | null
    plan_tier: string | null
    work_mode: string | null
    value_score: number | null
    is_calibrated: boolean
    jd_raw_text?: string
    external_id?: string
    fingerprint?: string
}

export default function AdminCalibrationPage() {
    const [leads, setLeads] = useState<BenchmarkLead[]>([])
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedLead, setSelectedLead] = useState<BenchmarkLead | null>(null)
    const [filterTier, setFilterTier] = useState<string>('all')
    const [filterRemote, setFilterRemote] = useState<boolean>(false)
    
    const itemsPerPage = 50
    const router = useRouter()

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth')
        if (!auth) {
            router.push('/admin/login')
        } else {
            setAuthenticated(true)
            fetchLeads()
        }
    }, [])

    async function fetchLeads() {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('executive_benchmark_leads')
            .select('*')
            .order('value_score', { ascending: false })

        if (data) setLeads(data)
        if (error) console.error('Supabase Error:', error)
        setLoading(false)
    }

    const filteredLeads = leads.filter(l => {
        const matchesTier = filterTier === 'all' || l.plan_tier === filterTier
        const matchesRemote = !filterRemote || l.work_mode === 'remote'
        return matchesTier && matchesRemote
    })

    // Fingerprint Deduplication (Frontend Safety Layer)
    const uniqueLeads: BenchmarkLead[] = []
    const seenFp = new Set<string>()
    for (const l of filteredLeads) {
        if (l.fingerprint && seenFp.has(l.fingerprint)) continue
        if (l.fingerprint) seenFp.add(l.fingerprint)
        uniqueLeads.push(l)
    }

    const updateLead = async (id: string, updates: Partial<BenchmarkLead>) => {
        const supabase = getSupabaseClient()
        const { error } = await supabase
            .from('executive_benchmark_leads')
            .update({ ...updates, is_calibrated: true })
            .eq('id', id)
        
        if (!error) {
            setLeads(leads.map(l => l.id === id ? { ...l, ...updates, is_calibrated: true } : l))
        }
    }

    if (!authenticated || loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        </div>
    )

    // Calculate Heatmap Data using filtered list
    const matrix = ROLE_FAMILIES.map(role => {
        return SENIORITY_LEVELS.map(level => {
            return uniqueLeads.filter((l: BenchmarkLead) => l.role_family === role && (
                level === 'Mid-Level' ? (l.seniority_index || 0) < 6 :
                level === 'Senior' ? (l.seniority_index || 0) === 6 :
                level === 'Staff' ? (l.seniority_index || 0) === 7 :
                level === 'Principal' ? (l.seniority_index || 0) === 8 :
                level === 'Executive' ? (l.seniority_index || 0) >= 9 : false
            )).length
        })
    })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            {/* Header with Navigation Switch */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                        <Zap className="w-3 h-3" /> System Baseline
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white">
                        BENCHMARK <span className="text-blue-500">CALIBRATOR</span>
                    </h1>
                    <p className="text-white/70 text-sm">Targeted "Golden Truth" matrix for India Remote & Onboarding Tiers.</p>
                </div>
                
                <div className="flex bg-white/10 p-1 rounded-lg border border-white/20 backdrop-blur-md">
                    <button 
                        className="px-4 py-2 rounded bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Calibration
                    </button>
                    <button 
                        onClick={() => router.push('/admin/jobs')}
                        className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
                    >
                        Live Swarm
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Filter Tier</span>
                    <div className="flex gap-1">
                        {['all', 'student', 'professional', 'executive'].map(tier => (
                            <button
                                key={tier}
                                onClick={() => setFilterTier(tier)}
                                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${filterTier === tier ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-6 w-px bg-white/20 mx-2" />
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Global Remote Only</span>
                    <button
                        onClick={() => setFilterRemote(!filterRemote)}
                        className={`w-10 h-5 rounded-full transition-all relative ${filterRemote ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${filterRemote ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Matrix Heatmap */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <LayoutDashboard className="w-5 h-5 text-blue-500" /> Matrix Coverage
                    </h2>
                    <div className="flex gap-2">
                        <Badge variant="glass" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {uniqueLeads.length} UNIQUE LEADS
                        </Badge>
                        <Badge variant="glass" className="bg-green-500/10 text-green-400 border-green-500/20">
                            {uniqueLeads.filter(l => l.is_calibrated).length} CALIBRATED
                        </Badge>
                    </div>
                </div>

                <GlassCard className="p-6 border-white/10 overflow-x-auto bg-black/70 backdrop-blur-xl">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[150px_repeat(5,1fr)] gap-2 mb-4">
                            <div />
                            {SENIORITY_LEVELS.map(level => (
                                <div key={level} className="text-[10px] font-black uppercase text-center text-white/60 tracking-widest">
                                    {level}
                                </div>
                            ))}
                        </div>
                        {ROLE_FAMILIES.map((role, rIdx) => (
                            <div key={role} className="grid grid-cols-[150px_repeat(5,1fr)] gap-2 mb-2">
                                <div className="text-xs font-bold text-white/70 flex items-center uppercase tracking-wider">
                                    {role}
                                </div>
                                {SENIORITY_LEVELS.map((level, lIdx) => {
                                    const count = matrix[rIdx][lIdx]
                                    return (
                                <div 
                                    key={`${role}-${level}`}
                                    className="h-12 rounded-lg border border-white/5 flex items-center justify-center transition-all hover:border-blue-500/50 group relative bg-blue-500/5 cursor-pointer"
                                    style={{ backgroundColor: count > 0 ? `rgba(59, 130, 246, ${Math.min(count * 0.15, 0.6)})` : 'transparent' }}
                                    onClick={() => router.push(`/admin/calibration?tier=${filterTier}&family=${role}&seniority=${level}`)}
                                >
                                            <span className={`text-lg font-black ${count > 0 ? 'text-white' : 'text-white/10'}`}>
                                                {count}
                                            </span>
                                            {count === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <AlertCircle className="w-4 h-4 text-red-500/50" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Calibration Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <TableIcon className="w-5 h-5 text-blue-500" /> Calibration Records
                </h2>

                <GlassCard className="border-white/10 overflow-hidden bg-black/70 backdrop-blur-xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                                    <th className="px-6 py-4">Lead Detail</th>
                                    <th className="px-6 py-4">Plan Tier</th>
                                    <th className="px-6 py-4 text-center">Work Mode</th>
                                    <th className="px-6 py-4">Seniority</th>
                                    <th className="px-6 py-4">Salary</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {uniqueLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(lead => (
                                <tr key={lead.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase truncate max-w-[250px]">{lead.role_title}</div>
                                            <div className="text-[10px] text-white/60 uppercase tracking-wider font-medium">{lead.company_name} • {lead.location}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="glass" className={`text-[9px] font-black uppercase tracking-widest ${lead.plan_tier === 'executive' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : lead.plan_tier === 'student' ? 'border-cyan-500/30 text-cyan-500 bg-cyan-500/5' : 'border-blue-500/30 text-blue-500 bg-blue-500/5'}`}>
                                                {lead.plan_tier || 'PRO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {lead.work_mode === 'remote' ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] font-black">REMOTE</Badge>
                                            ) : (
                                                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">ONSITE</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="number" 
                                                value={lead.seniority_index || 0}
                                                onChange={(e) => updateLead(lead.id, { seniority_index: parseInt(e.target.value) })}
                                                className="w-12 bg-blue-950/20 border border-transparent hover:border-blue-500/30 rounded px-2 py-1 text-xs font-mono text-blue-400 focus:ring-0 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-white/80 font-bold">
                                            ₹{lead.salary_lpa || '0'}L
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-blue-500">{lead.value_score?.toFixed(1) || '0.0'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                {lead.is_calibrated ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-white/10" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="p-4 bg-white/5 flex items-center justify-between border-t border-white/5">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white disabled:opacity-30 uppercase tracking-widest"
                        >
                            PREVIOUS
                        </button>
                        <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-black">
                            PAGE {currentPage} OF {Math.ceil(uniqueLeads.length / itemsPerPage)} • {uniqueLeads.length} UNIQUE RECORDS
                        </p>
                        <button 
                            disabled={currentPage * itemsPerPage >= uniqueLeads.length}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-4 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-30 uppercase tracking-widest"
                        >
                            NEXT
                        </button>
                    </div>
                </GlassCard>
            </div>

            {/* Job Details Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
                    <div className="max-w-2xl w-full max-h-[80vh] flex flex-col border border-blue-500/20 bg-black/90 p-0 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 shrink-0">
                            <h2 className="text-2xl font-black italic tracking-tighter text-white mb-1">{selectedLead.role_title}</h2>
                            <div className="text-blue-400 text-sm font-bold uppercase tracking-wider">{selectedLead.company_name} • {selectedLead.location}</div>
                        </div>
                        <div className="p-6 overflow-y-auto w-full text-sm text-white/70 whitespace-pre-wrap font-sans">
                            {selectedLead.jd_raw_text || "No job description available for this role."}
                        </div>
                        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                            {selectedLead.external_id ? (
                                <a 
                                    href={selectedLead.external_id.startsWith('http') ? selectedLead.external_id : `https://${selectedLead.external_id}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-500 hover:text-blue-400 font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-2"
                                >
                                    OPEN ORIGINAL POST
                                </a>
                            ) : <span className="text-white/20 text-xs uppercase tracking-widest">No URL Available</span>}
                            <GlowButton variant="ghost" className="text-xs py-1.5 h-auto px-6 border border-white/20" onClick={() => setSelectedLead(null)}>CLOSE</GlowButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
