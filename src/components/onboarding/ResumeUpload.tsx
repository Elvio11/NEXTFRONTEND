'use client'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/axios'
import { getSupabaseClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

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
        .refine((f) => f.size <= 10_485_760, 'File must be 10MB or less'),
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
            formData.append('file', data.file)
            const res = await api.post('/api/agents/resume-intelligence', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                pollParseStatus(user.id, res.data.persona_options ?? [])
            }
        } catch (_err) {
            setUploadError('Upload failed. Please try again.')
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
        <GlassCard className="p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">Upload your resume</h2>
            <p className="text-[#64748b] mb-6">PDF or DOCX · Max 10MB</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        handleFileChange(e.dataTransfer.files[0] ?? null)
                    }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 mb-4 ${dragOver
                            ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.08)]'
                            : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.24)]'
                        }`}
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                >
                    <input
                        id="resume-file-input"
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                    {selectedFile ? (
                        <div className="flex items-center justify-center gap-3 text-[#f1f5f9]">
                            <FileText className="w-6 h-6 text-[#3b82f6]" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                    ) : (
                        <div>
                            <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                            <p className="text-[#64748b] text-sm">Drop your resume here or click to browse</p>
                        </div>
                    )}
                </div>

                {errors.file && (
                    <p className="text-red-400 text-sm flex items-center gap-1 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        {errors.file.message}
                    </p>
                )}
                {uploadError && (
                    <p className="text-red-400 text-sm flex items-center gap-1 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        {uploadError}
                    </p>
                )}

                {polling && (
                    <div className="flex items-center gap-3 text-[#64748b] text-sm mb-4 p-3 bg-[rgba(255,255,255,0.04)] rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin text-[#3b82f6]" />
                        Analysing your resume...
                    </div>
                )}

                {timeoutError && (
                    <p className="text-yellow-400 text-sm flex items-center gap-1 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        Resume analysis is taking longer than expected. Please refresh.
                    </p>
                )}

                {!polling && !timeoutError && (
                    <GlowButton
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={uploading || !selectedFile}
                        className="w-full"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Analyse Resume
                            </>
                        )}
                    </GlowButton>
                )}
            </form>
        </GlassCard>
    )
}
