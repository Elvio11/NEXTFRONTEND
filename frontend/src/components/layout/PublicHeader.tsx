'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Command } from 'lucide-react'
import { StudentModeToggle } from '@/components/ui/StudentModeToggle'
import { cn } from '@/lib/utils'

const navLinks = [
    { href: '/#features', label: 'Swarm' },
    { href: '/#how', label: 'How it works' },
    { href: '/#pricing', label: 'Pricing' },
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
                    ? "backdrop-blur-xl bg-bg-base/80 border-white/5 py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                
                {/* Logo Section */}
                <div className="flex items-center gap-8">
                  <Link
                      href="/"
                      className="flex items-center gap-2 group"
                  >
                      <div className="relative">
                        <Command className="w-6 h-6 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-mono font-black italic tracking-tighter text-2xl text-white">
                          TALVIX
                      </span>
                  </Link>

                  {!isMinimal && (
                    <nav className="hidden lg:flex items-center gap-8">
                        {navLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-[11px] font-bold uppercase tracking-widest text-content-subtle hover:text-white transition-colors duration-200"
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
                        <div className="w-px h-4 bg-white/10" />
                        <Link
                            href="/login"
                            className="text-[11px] font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors"
                        >
                            Sign in
                        </Link>
                      </div>
                    )}
                    
                    {isMinimal ? (
                        <Link
                            href="/"
                            className="text-xs font-bold uppercase tracking-widest text-content-subtle hover:text-white transition-colors flex items-center gap-2"
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
                              className="lg:hidden p-2 text-content-muted hover:text-white transition-colors"
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
                <div className="lg:hidden border-t border-white/5 bg-bg-base/95 backdrop-blur-xl animate-in slide-in-from-top duration-300">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-content-subtle">Persona</span>
                            <StudentModeToggle />
                        </div>
                        <div className="h-px bg-white/5" />
                        {navLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-sm font-bold uppercase tracking-widest text-content-muted hover:text-white transition-colors"
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
