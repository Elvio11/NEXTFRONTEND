'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { GlowButton } from '@/components/ui/GlowButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { 
    Activity,
    Zap,
    BarChart3,
    CheckCircle2,
    Search,
    ExternalLink,
    FileText
} from 'lucide-react'

interface JobLead {
    id: string
    title: string
    company: string
    city_canonical: string | null
    plan_tier: string | null
    seniority_index: number | null
    remote_viability_score: number | null
    source: string | null
    work_mode: string | null
    last_seen_at: string
    apply_url: string | null
    jd_summary: string | null
    jd_full_clean: string | null
    fingerprint: string
    is_active: boolean
    jd_cleaned: boolean
    salary_max?: number | null
    is_scored?: boolean
}

export default function AdminJobsDashboard() {
    const [jobs, setJobs] = useState<JobLead[]>([])
    const [stats, setStats] = useState({ cleaned: 0, scored: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedJob, setSelectedJob] = useState<JobLead | null>(null)
    const [filterTier, setFilterTier] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    
    const itemsPerPage = 50
    const router = useRouter()

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth')
        if (!auth) {
            router.push('/admin/login')
        } else {
            setAuthenticated(true)
            fetchJobs()
        }
    }, [])

    async function fetchJobs() {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        // 1. Fetch RLS-bypassed stats via RPC
        const { data: adminStats, error: statsError } = await supabase.rpc('get_admin_dashboard_stats')
        
        if (adminStats && adminStats.length > 0) {
            const statsObj = adminStats[0]
            setStats({
                total: parseInt(statsObj.total_jobs),
                cleaned: parseInt(statsObj.cleaned_jobs),
                scored: parseInt(statsObj.total_scores)
            })
        }

        // 2. Fetch recent jobs with scoring info and full clean text
        const { data, error } = await supabase
            .from('jobs')
            .select('*, job_fit_scores(count)')
            .order('created_at', { ascending: false })
            .limit(500)

        if (data) {
            setJobs(data.map((j: any) => ({
                ...j,
                is_scored: (j.job_fit_scores?.[0]?.count || 0) > 0
            })))
        }
        if (error || statsError) console.error('Supabase Error:', error || statsError)
        setLoading(false)
    }

    const filteredJobs = jobs.filter(j => {
        const matchesTier = filterTier === 'all' || j.plan_tier === filterTier
        const matchesSearch = !searchTerm || 
            j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            j.company.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesTier && matchesSearch
    })

    if (!authenticated || loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header with Navigation Switch */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                        <Activity className="w-3 h-3 animate-pulse" /> Live Swarm Dashboard
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white">
                        PRODUCTION <span className="text-blue-500">JOBS</span>
                    </h1>
                    <p className="text-white/70 text-sm italic">Monitoring real-time ingestion across 12 platforms & 3 tiers.</p>
                </div>
                
                <div className="flex bg-white/10 p-1 rounded-lg border border-white/20 backdrop-blur-md">
                    <button 
                        onClick={() => router.push('/admin/calibration')}
                        className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
                    >
                        Calibration
                    </button>
                    <button 
                        className="px-4 py-2 rounded bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Live Swarm
                    </button>
                </div>
            </div>

            {/* Ingestion Stats Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-6 border-white/10 bg-black/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Pool</span>
                    <span className="text-3xl font-black text-white italic">{stats.total}+</span>
                    <Badge variant="glass" className="mt-2 text-[8px] border-blue-500/30 text-blue-400">ACTIVE LEADS</Badge>
                </GlassCard>
                <GlassCard className="p-6 border-white/10 bg-black/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Cleaned</span>
                    <span className="text-3xl font-black text-green-400 italic">{stats.cleaned}</span>
                    <div className="flex gap-1 mt-1">
                        <Badge className="bg-green-500/20 text-green-300 text-[8px]">AGENT 7 SUCCESS</Badge>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 border-white/10 bg-black/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Scored</span>
                    <span className="text-3xl font-black text-blue-400 italic">{stats.scored}</span>
                    <div className="flex gap-1 mt-1">
                        <Badge className="bg-blue-500/20 text-blue-300 text-[8px]">AGENT 6 READY</Badge>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 border-white/10 flex flex-col items-center justify-center text-center bg-blue-500/10 border-blue-500/30">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Swarm Pulse</span>
                    <GlowButton className="h-8 py-0 px-4 text-[9px] border-none" onClick={fetchJobs}>
                        FORCE PULSE
                    </GlowButton>
                </GlassCard>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Segmentation</span>
                    <div className="flex gap-1">
                        {['all', 'student', 'professional', 'executive'].map(tier => (
                            <button
                                key={tier}
                                onClick={() => setFilterTier(tier)}
                                className={`px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filterTier === tier ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="relative flex-1 max-w-md w-full">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <input 
                        placeholder="SEARCH ROLES OR COMPANIES..."
                        className="w-full bg-black/60 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/30 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <BarChart3 className="w-5 h-5 text-blue-500" /> Lead Stream
                    </h2>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        Showing {filteredJobs.length} results
                    </span>
                </div>

                <GlassCard className="border-white/10 overflow-hidden bg-black/70 backdrop-blur-xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/70">
                                    <th className="px-6 py-4">Position & Co.</th>
                                    <th className="px-6 py-4 text-center">Tier</th>
                                    <th className="px-6 py-4 text-center">Location</th>
                                    <th className="px-6 py-4 text-center">Source</th>
                                    <th className="px-6 py-4">Ingested</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(job => (
                                    <tr key={job.id} className="hover:bg-blue-500/10 transition-colors group">
                                        <td className="px-6 py-6 cursor-pointer" onClick={() => setSelectedJob(job)}>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase italic truncate max-w-[280px]">
                                                    {job.title}
                                                </div>
                                                <div className="flex gap-1">
                                                    {job.jd_cleaned && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                    {job.is_scored && <Zap className="w-3 h-3 text-blue-400 fill-blue-400/20" />}
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-white/60 uppercase font-bold tracking-widest mt-1 flex items-center gap-2">
                                                {job.company} 
                                                {job.salary_max && (
                                                    <span className="text-green-400/80 ml-2 font-mono">📊 ₹{(job.salary_max/100000).toFixed(0)}L</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="glass" className={`text-[9px] font-black uppercase tracking-widest border-2 ${
                                                job.plan_tier === 'executive' ? 'border-amber-500/60 text-amber-500 bg-amber-500/10' : 
                                                job.plan_tier === 'student' ? 'border-cyan-500/60 text-cyan-500 bg-cyan-500/10' : 
                                                'border-blue-500/40 text-blue-400 bg-blue-500/5'
                                            }`}>
                                                {job.plan_tier === 'student' ? 'Student / Fresher' : job.plan_tier?.toUpperCase() || 'PRO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-white/80 font-bold uppercase truncate max-w-[100px]">{job.city_canonical || 'India'}</span>
                                                {job.work_mode === 'remote' && <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[7px] py-0 font-black">REMOTE</Badge>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">{job.source || 'unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-white/70 font-bold uppercase tracking-tighter font-mono">
                                            {new Date(job.last_seen_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <GlowButton 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 rounded-full border border-white/20 flex items-center justify-center hover:bg-blue-500/20 shadow-lg shadow-blue-500/10"
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                                </GlowButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="p-4 bg-white/5 flex items-center justify-between border-t border-white/10">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 text-xs font-black text-white/70 hover:text-white disabled:opacity-30 uppercase tracking-widest"
                        >
                            REV
                        </button>
                        <p className="text-[9px] text-white/50 font-black uppercase tracking-[0.4em]">
                            PAGE {currentPage} • {filteredJobs.length} TOTAL
                        </p>
                        <button 
                            disabled={currentPage * itemsPerPage >= filteredJobs.length}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-4 py-2 text-xs font-black text-blue-400 hover:text-blue-300 disabled:opacity-30 uppercase tracking-widest"
                        >
                            FWD
                        </button>
                    </div>
                </GlassCard>
            </div>

            {/* Job Preview Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-3xl transition-all" onClick={() => setSelectedJob(null)}>
                    <GlassCard 
                        className="max-w-4xl w-full flex flex-col border-white/20 bg-black/90 p-0 overflow-hidden shadow-[0_0_150px_rgba(59,130,246,0.2)]" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-white/10 relative bg-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-blue-400 font-black text-[9px] uppercase tracking-[0.4em]">
                                    <Zap className="w-3 h-3" /> Intelligence Analysis
                                </div>
                                <div className="flex gap-2">
                                    <Badge className="bg-white/10 text-white/40 text-[7px] font-mono border-white/10 uppercase">
                                        ID: {selectedJob.id.slice(0,8)}
                                    </Badge>
                                    <Badge className="bg-white/10 text-white/40 text-[7px] font-mono border-white/10 uppercase">
                                        FPRINTE: {selectedJob.fingerprint.slice(0,8)}
                                    </Badge>
                                </div>
                            </div>
                            <h2 className="text-4xl font-black italic tracking-tighter text-white mb-2 uppercase leading-none">
                                {selectedJob.title}
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="text-white/80 text-sm font-black uppercase tracking-widest">{selectedJob.company}</span>
                                <div className="h-4 w-px bg-white/20" />
                                <span className="text-blue-400 text-sm font-black uppercase tracking-widest">{selectedJob.city_canonical || 'Remote'}</span>
                            </div>
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest border border-white/10 px-3 py-1 rounded hover:bg-white/10"
                            >
                                CLOSE [ESC]
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto max-h-[60vh] text-base text-white/90 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-blue-500/40">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Plan Tier</p>
                                    <p className="text-xs font-black text-white uppercase italic">{selectedJob.plan_tier || 'PRO'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Seniority Index</p>
                                    <p className="text-xs font-black text-blue-400 uppercase italic">Lvl {selectedJob.seniority_index || '?'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">MinIO Storage</p>
                                    <p className="text-[9px] font-mono text-green-400 lowercase italic">jds/{selectedJob.fingerprint.slice(0,10)}...</p>
                                </div>
                            </div>

                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Full Cleaned Description
                            </h4>
                            <div className="line-height-2.0 bg-white/5 p-8 rounded-2xl border border-white/10 text-white/80 font-medium whitespace-pre-wrap shadow-inner shadow-black/40 text-sm">
                                {selectedJob.jd_full_clean || selectedJob.jd_summary || "Processing full analysis. High-fidelity extraction queued."}
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/10 bg-white/10 flex gap-4 items-center justify-between">
                            <div className="flex gap-4">
                                {selectedJob.apply_url && (
                                    <GlowButton 
                                        className="px-8 border-none bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/30"
                                        onClick={() => window.open(selectedJob.apply_url || '', '_blank')}
                                    >
                                        OPEN LISTING
                                    </GlowButton>
                                )}
                                <GlowButton 
                                    variant="ghost" 
                                    className="px-6 border-white/20 text-white/60 hover:text-white"
                                    onClick={() => alert(`Raw JD is available on S3 at: talvix/jds/${selectedJob.fingerprint}.txt`)}
                                >
                                    INGEST LOG
                                </GlowButton>
                            </div>
                            <GlowButton variant="ghost" className="px-6 border-white/10 text-white/40 hover:text-white" onClick={() => setSelectedJob(null)}>
                                RETURN
                            </GlowButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    )
}
