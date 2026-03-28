'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/axios'
import { GlassCard } from '@/components/ui/GlassCard'
import { X, Plus, Search, Star, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function DreamCompanies() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  const { data: companies, isLoading } = useQuery({
    queryKey: ['dream-companies', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_company_prefs')
        .select('company_name')
        .eq('user_id', user!.id)
        .eq('is_blacklist', false)
      return data?.map((d: { company_name: string }) => d.company_name) || []
    },
  })

  const addCompany = useMutation({
    mutationFn: (name: string) =>
      api.post('/api/users/companies', { name, is_blacklist: false }),
    onSuccess: () => {
      setQuery('')
      void queryClient.invalidateQueries({ queryKey: ['dream-companies'] })
    },
  })

  const removeCompany = useMutation({
    mutationFn: (name: string) =>
      api.delete(`/api/users/companies?name=${name}&is_blacklist=false`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dream-companies'] })
    },
  })

  return (
    <GlassCard className="p-8 border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Star className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Target Citadels</h2>
          <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
            Dream Companies — High Priority Matching
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Add company (e.g., Google, Microsoft...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && query && addCompany.mutate(query)}
            className="w-full pl-12 pr-12 py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-xs font-mono text-white placeholder:text-content-subtle focus:outline-none focus:border-blue-500/50 transition-all"
          />
          <button 
             onClick={() => query && addCompany.mutate(query)}
             className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-wrap gap-2.5">
          <AnimatePresence>
            {companies?.map((name: string) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-400 group"
              >
                <Sparkles className="w-3 h-3" />
                <span>{name}</span>
                <button
                  onClick={() => removeCompany.mutate(name)}
                  className="p-1 rounded-md hover:bg-blue-500/20 text-blue-400/50 hover:text-blue-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {companies?.length === 0 && !isLoading && (
            <p className="text-[10px] font-mono text-content-subtle py-4">
              Your target list is empty. Add companies to trigger high-priority swarm alerts.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
