import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
    '/dashboard',
    '/jobs',
    '/applications',
    '/skill-gap',
    '/settings',
    '/onboarding', // Re-added to ensure unauthenticated users are gated
]

/**
 * Talvix Middleware — Next.js 15 Architect Edition
 *
 * Enforces the state-based routing logic:
 *   1. No session -> /login
 *   2. onboarding_completed === false -> /onboarding
 *   3. onboarding_completed === true && dashboard_ready === false -> /onboarding/processing
 *   4. dashboard_ready === true -> /dashboard
 */
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
    const isProtectedRoute = PROTECTED.some((p) => path.startsWith(p))

    // 1. No user + protected route → redirect to login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. State-based routing for authenticated users
    if (user) {
        // Handle landing on /login while authenticated
        if (path === '/login') {
            return _routeAuthenticatedUser(request, supabase, user.id, supabaseResponse)
        }

        // Enforce state for all protected routes
        if (isProtectedRoute) {
            return _routeAuthenticatedUser(request, supabase, user.id, supabaseResponse)
        }
    }

    return supabaseResponse
}

/**
 * Fetches user profile and determines the correct destination based on state.
 *
 * Ensures refreshed Supabase cookies from the primary response are synced
 * to any redirect response to prevent intermittent session loss.
 */
async function _routeAuthenticatedUser(
    request: NextRequest,
    supabase: any,
    userId: string,
    originalResponse: NextResponse
) {
    const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed, dashboard_ready')
        .eq('id', userId)
        .single()

    const path = request.nextUrl.pathname
    const url = request.nextUrl.clone()

    let nextResponse: NextResponse

    // 1. Mandatory Onboarding Flow
    if (!profile?.onboarding_completed) {
        // Allow sub-routes of /onboarding (e.g. /onboarding/step-2)
        if (!path.startsWith('/onboarding')) {
            url.pathname = '/onboarding'
            nextResponse = NextResponse.redirect(url)
        } else {
            return originalResponse
        }
    }
    // 2. Waiting for Agents 4, 5, 6
    else if (!profile.dashboard_ready) {
        if (!path.startsWith('/onboarding/processing')) {
            url.pathname = '/onboarding/processing'
            nextResponse = NextResponse.redirect(url)
        } else {
            return originalResponse
        }
    }
    // 3. Fully Ready
    else {
        if (path.startsWith('/onboarding') || path === '/login') {
            url.pathname = '/dashboard'
            nextResponse = NextResponse.redirect(url)
        } else {
            return originalResponse
        }
    }

    // SYNC COOKIES: Copy set-cookie headers from originalResponse to the redirect
    // to ensure auth.getUser() cookie refresh isn't lost during the redirect.
    originalResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            nextResponse.headers.append(key, value)
        }
    })

    return nextResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
