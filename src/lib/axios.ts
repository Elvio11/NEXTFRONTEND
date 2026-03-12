import axios from 'axios'
import { getSupabaseClient } from './supabase/client'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER2_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
    const supabase = getSupabaseClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    async (err: { response?: { status: number } }) => {
        if (err.response?.status === 401) {
            const supabase = getSupabaseClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)
