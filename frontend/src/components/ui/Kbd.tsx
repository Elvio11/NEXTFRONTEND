import { type ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/[0.05] px-1.5 font-mono text-[10px] font-black uppercase text-content-muted opacity-100">
            {children}
        </kbd>
    )
}
