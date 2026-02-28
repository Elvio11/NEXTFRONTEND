'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how', label: 'How it works' },
    { href: '/#pricing', label: 'Pricing' },
]

// Pages where we hide the main nav links (show back button instead)
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
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
                        ? 'backdrop-blur-[16px] bg-[rgba(5,5,5,0.85)] border-[rgba(255,255,255,0.08)]'
                        : 'bg-transparent border-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Logo — always visible, always links home */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-bold text-xl text-[#f1f5f9] hover:opacity-80 transition-opacity"
                    >
                        Talvix
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
                    </Link>

                    {/* Centre nav — only on landing */}
                    {!isMinimal && (
                        <nav className="hidden md:flex items-center gap-8 text-sm text-[#64748b]">
                            {navLinks.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    className="hover:text-[#f1f5f9] transition-colors duration-200"
                                >
                                    {l.label}
                                </a>
                            ))}
                        </nav>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {isMinimal ? (
                            /* Minimal pages: back to home */
                            <Link
                                href="/"
                                className="text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200 flex items-center gap-1"
                            >
                                ← Back to home
                            </Link>
                        ) : (
                            /* Landing page: sign in + CTA */
                            <>
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold px-5 py-2 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                                >
                                    Get started free
                                </Link>
                                {/* Mobile hamburger */}
                                <button
                                    className="md:hidden ml-1 text-[#64748b] hover:text-[#f1f5f9] transition-colors"
                                    onClick={() => setMobileOpen((o) => !o)}
                                    aria-label="Toggle menu"
                                >
                                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile nav drawer — landing only */}
                {!isMinimal && mobileOpen && (
                    <div className="md:hidden border-t border-[rgba(255,255,255,0.08)] bg-[rgba(5,5,5,0.95)] backdrop-blur-[12px]">
                        <div className="px-6 py-4 flex flex-col gap-4">
                            {navLinks.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    className="text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200 py-1"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {l.label}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                className="text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors duration-200 py-1"
                                onClick={() => setMobileOpen(false)}
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Spacer so content starts below fixed header */}
            <div className="h-16" />
        </>
    )
}
