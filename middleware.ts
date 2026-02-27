import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
    '/dashboard',
    '/jobs',
    '/applications',
    '/skill-gap',
    '/settings',
    '/onboarding',
]

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Use getUser() not getSession() — server-validated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isProtected = PROTECTED.some((p) => path.startsWith(p))

    // No user + protected route → redirect to login
    if (!user && isProtected) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authed user + login page → redirect to dashboard
    if (user && path === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Onboarding check — only for protected non-onboarding routes
    if (user && isProtected && path !== '/onboarding') {
        const { data: profile } = await supabase
            .from('users')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

        if (profile && !profile.onboarding_complete) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
