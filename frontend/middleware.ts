import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
    '/dashboard',
    '/jobs',
    '/applications',
    '/skill-gap',
    '/coach',
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
                    // Step 1: Set on request so downstream server reads it
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    // Step 2: Rebuild the response and attach the cookies
                    // NOTE: We MUST NOT create a new NextResponse here — we
                    // will copy cookies onto whatever response we return below.
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

    // Helper: copy Supabase session cookies onto any redirect response
    function withCookies(response: NextResponse): NextResponse {
        supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
            response.cookies.set(name, value)
        })
        return response
    }

    // No user + protected route → redirect to login
    if (!user && isProtected) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return withCookies(NextResponse.redirect(url))
    }

    // Authed user + login page → redirect to dashboard
    if (user && path === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return withCookies(NextResponse.redirect(url))
    }

    // Onboarding check — only for protected non-onboarding routes
    if (user && isProtected && path !== '/onboarding') {
        const { data: profile } = await supabase
            .from('users')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

        // Redirect to onboarding if:
        // 1. No users row yet (new Google OAuth user — profile is null)
        // 2. Row exists but onboarding_complete is false
        if (!profile || !profile.onboarding_complete) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return withCookies(NextResponse.redirect(url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
