'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { StudentModeToggle } from '@/components/ui/StudentModeToggle'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const navLinks = [
    { href: '/swarm', label: 'Swarm' },
    { href: '/#how', label: 'How it works' },
    { href: '/pricing', label: 'Pricing' },
]

const MINIMAL_PAGES = ['/login', '/onboarding']

export function PublicHeader() {
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const isMinimal = MINIMAL_PAGES.some((p) => pathname.startsWith(p))

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
                scrolled
                    ? "backdrop-blur-xl bg-white/80 border-slate-200 py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                
                {/* Logo Section */}
                <div className="flex items-center gap-8">
                  <Link
                      href="/"
                      className="flex items-center group"
                  >
                      <Logo 
                        size="md" 
                        variant="light" 
                        className="transition-all duration-300"
                      />
                  </Link>

                  {!isMinimal && (
                    <nav className="hidden lg:flex items-center gap-8">
                        {navLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-[11px] font-bold uppercase tracking-widest text-content-subtle hover:text-content-primary transition-colors duration-200"
                            >
                                {l.label}
                            </a>
                        ))}
                    </nav>
                  )}
                </div>

                {/* Right side Actions */}
                <div className="flex items-center gap-6">
                    {!isMinimal && (
                      <div className="hidden md:flex items-center gap-4">
                        <StudentModeToggle />
                        <div className="w-px h-4 bg-slate-200" />
                        <Link
                            href="/login"
                            className="text-[11px] font-bold uppercase tracking-widest text-content-primary hover:text-blue-600 transition-colors"
                        >
                            Sign in
                        </Link>
                      </div>
                    )}
                    
                    {isMinimal ? (
                        <Link
                            href="/"
                            className="text-xs font-bold uppercase tracking-widest text-content-subtle hover:text-content-primary transition-colors flex items-center gap-2"
                        >
                            Back to Swarm
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                          <Link
                              href="/login"
                              className={cn(
                                "relative px-6 py-2.5 rounded-xl bg-accent-blue text-white",
                                "text-xs font-bold uppercase tracking-widest shadow-glow-blue",
                                "hover:brightness-110 transition-all duration-300"
                              )}
                          >
                              Initiate Switch
                          </Link>
                          {/* Mobile hamburger */}
                          <button
                              className="lg:hidden p-2 text-content-muted hover:text-content-primary transition-colors"
                              onClick={() => setMobileOpen((o) => !o)}
                          >
                              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                          </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile nav drawer */}
            {!isMinimal && mobileOpen && (
                <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl animate-in slide-in-from-top duration-300 shadow-xl">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-content-subtle">Persona</span>
                            <StudentModeToggle />
                        </div>
                        <div className="h-px bg-slate-200" />
                        {navLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-sm font-bold uppercase tracking-widest text-content-muted hover:text-content-primary transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                {l.label}
                            </a>
                        ))}
                        <Link
                            href="/login"
                            className="w-full py-4 rounded-xl bg-accent-blue text-center text-xs font-bold uppercase tracking-widest text-white"
                            onClick={() => setMobileOpen(false)}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
