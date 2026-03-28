import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    // Track every cookie written during the exchange so we can forward them
    const cookiesToForward: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToForward.push({ name, value, options })
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cookieStore.set(name, value, options as any)
              } catch {
                // ignore — Route Handler, not a Server Component
              }
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
      const response = NextResponse.redirect(`${siteUrl}${next}`)

      // Forward all session cookies written during the exchange onto the
      // redirect response so the browser stores them BEFORE hitting the middleware
      cookiesToForward.forEach(({ name, value, options }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any)
      })

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-exchange-failed`)
}
