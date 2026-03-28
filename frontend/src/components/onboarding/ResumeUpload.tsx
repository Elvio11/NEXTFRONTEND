'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/axios'
import { getSupabaseClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const schema = z.object({
    file: z
        .instanceof(File)
        .refine(
            (f) => [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(f.type),
            'Only PDF or DOCX files are accepted'
        )
        .refine((f) => f.size <= 5_242_880, 'File must be 5MB or less'),
})

type FormData = z.infer<typeof schema>

const MAX_POLLS = 40

interface ResumeUploadProps {
    onComplete: (personaOptions: string[]) => void
}

export function ResumeUpload({ onComplete }: ResumeUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [polling, setPolling] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [timeoutError, setTimeoutError] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const pollCountRef = useRef(0)
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const supabase = getSupabaseClient()

    const {
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) })

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }
        setPolling(false)
        pollCountRef.current = 0
    }

    const pollParseStatus = (userId: string, personaOptions: string[]) => {
        setPolling(true)
        pollTimerRef.current = setInterval(async () => {
            pollCountRef.current++
            if (pollCountRef.current >= MAX_POLLS) {
                stopPolling()
                setTimeoutError(true)
                return
            }

            const { data } = await supabase
                .from('resumes')
                .select('parse_status')
                .eq('user_id', userId)
                .single()

            if (data?.parse_status === 'done') {
                stopPolling()
                onComplete(personaOptions)
            }
        }, 3000)
    }

    const onSubmit = async (data: FormData) => {
        setUploading(true)
        setUploadError(null)
        try {
            const formData = new FormData()
            formData.append('resume', data.file)
            const res = await api.post('/api/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                pollParseStatus(user.id, res.data.persona_options ?? [])
            }
        } catch (_err) {
            setUploadError('Security gate rejected the file. Ensure it is a valid PDF/DOCX.')
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = (file: File | null) => {
        if (!file) return
        setSelectedFile(file)
        setValue('file', file, { shouldValidate: true })
    }

    return (
        <GlassCard className="p-8 max-w-2xl mx-auto border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 shadow-glow-green/5">
                <Upload className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Step 02: Pravesh Protocol</h2>
                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                  Secure Talent Entry & Intelligence Parsing
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        handleFileChange(e.dataTransfer.files[0] ?? null)
                    }}
                    className={cn(
                      "group border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 relative overflow-hidden",
                      dragOver 
                        ? "border-blue-500 bg-blue-500/10 shadow-glow-blue/10" 
                        : "border-white/10 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/20"
                    )}
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                >
                    <input
                        id="resume-file-input"
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                    
                    <AnimatePresence mode="wait">
                      {selectedFile ? (
                          <motion.div 
                            key="file"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-glow-blue/10">
                                <FileText className="w-8 h-8 text-blue-400" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-black uppercase tracking-widest text-white">{selectedFile.name}</p>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Pravesh Gate
                                </p>
                              </div>
                          </motion.div>
                      ) : (
                          <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 mx-auto flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 group-hover:scale-110 transition-all">
                                <Upload className="w-6 h-6 text-content-subtle group-hover:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-black uppercase tracking-widest text-white">Upload Resume Artifact</p>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                                  PDF or DOCX • Max 10MB • AES-256 Encrypted
                                </p>
                              </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                </div>

                {/* Security Indicators */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Macro Check', active: !!selectedFile, icon: ShieldCheck },
                    { label: 'Sandboxed', active: uploading || polling, icon: Lock },
                    { label: 'Parichay L3', active: polling, icon: Zap },
                  ].map((s) => (
                    <div key={s.label} className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-500",
                      s.active ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-white/[0.02] border-white/5 text-content-muted opacity-30"
                    )}>
                      <s.icon className="w-4 h-4" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Error States */}
                {(errors.file || uploadError || timeoutError) && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Security Alert</p>
                      <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-tighter mt-1">
                        {errors.file?.message || uploadError || 'Analysis delay. Swarm is retrying protocol sync.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={uploading || polling || !selectedFile}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 group relative overflow-hidden shadow-glow-blue",
                          uploading || polling ? "bg-white/5 border border-white/10 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                    >
                        {uploading || polling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span>{uploading ? 'Initiating Phase 2...' : 'Parichay Analyzing...'}</span>
                            </>
                        ) : (
                            <>
                                <span>Dispatch to Swarm</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                        
                        {(uploading || polling) && (
                           <motion.div 
                             className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                             initial={{ width: 0 }}
                             animate={{ width: uploading ? '40%' : '90%' }}
                             transition={{ duration: 15 }}
                           />
                        )}
                    </button>
                </div>
            </form>
        </GlassCard>
    )
}
