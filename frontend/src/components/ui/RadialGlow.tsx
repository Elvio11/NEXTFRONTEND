import { cn } from '@/lib/utils'

const positions: Record<string, string> = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    centre: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
}

const colors: Record<string, string> = {
    blue: 'bg-[rgba(59,130,246,0.15)]',
    violet: 'bg-[rgba(139,92,246,0.12)]',
}

interface RadialGlowProps {
    color?: 'blue' | 'violet'
    position?: 'top' | 'centre' | 'bottom-right'
    className?: string
}

export function RadialGlow({
    color = 'blue',
    position = 'top',
    className,
}: RadialGlowProps) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-30 pointer-events-none',
                positions[position],
                colors[color],
                className
            )}
        />
    )
}
