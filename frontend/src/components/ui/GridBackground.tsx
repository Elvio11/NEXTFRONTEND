export function GridBackground() {
    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
                backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                maskImage:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
                WebkitMaskImage:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            }}
        />
    )
}
