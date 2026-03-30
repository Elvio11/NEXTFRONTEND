import React from 'react'

export const SaarthiIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes saarthi-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes saarthi-pulse { 0%, 100% { r: 6px; opacity: 1; } 50% { r: 8px; opacity: 0.8; } }
            .saarthi-ring { animation: saarthi-rotate 8s linear infinite; transform-origin: 50px 50px; }
            .saarthi-core { animation: saarthi-pulse 2s ease-in-out infinite; }
        `}</style>
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
        <g className="saarthi-ring">
            <line x1="50" y1="12" x2="50" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="77.3" y1="22.7" x2="63.6" y2="36.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="88" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="77.3" y1="77.3" x2="63.6" y2="63.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="88" x2="50" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="22.7" y1="77.3" x2="36.4" y2="63.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="22.7" y1="22.7" x2="36.4" y2="36.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </g>
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="50" cy="50" r="6" fill="currentColor" className="saarthi-core"/>
    </svg>
)

export const PraveshIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes pravesh-beam { 0% { x: 15; opacity: 0; } 50% { opacity: 1; } 100% { x: 85; opacity: 0; } }
            .pravesh-beam { animation: pravesh-beam 3s ease-in-out infinite; }
        `}</style>
        <defs>
            <linearGradient id="pravesh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path d="M 35 25 L 25 25 L 25 75 L 35 75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 65 25 L 75 25 L 75 75 L 65 75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
        <line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
        <rect x="15" y="47" width="70" height="6" rx="3" fill="url(#pravesh-grad)" className="pravesh-beam"/>
    </svg>
)

export const ParichayIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes parichay-fill { 0%, 100% { stroke-dashoffset: 60; opacity: 1; } 50% { stroke-dashoffset: 0; opacity: 0.3; } }
            .parichay-line { animation: parichay-fill 3s ease-in-out infinite; stroke-dasharray: 60; }
        `}</style>
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <path d="M 30 30 Q 50 25 70 30" stroke="currentColor" strokeWidth="1.5" className="parichay-line" style={{ animationDelay: '0s' }}/>
        <path d="M 28 40 Q 50 35 72 40" stroke="currentColor" strokeWidth="1.5" className="parichay-line" style={{ animationDelay: '0.3s' }}/>
        <path d="M 28 50 Q 50 45 72 50" stroke="currentColor" strokeWidth="1.5" className="parichay-line" style={{ animationDelay: '0.6s' }}/>
        <path d="M 30 60 Q 50 55 70 60" stroke="currentColor" strokeWidth="1.5" className="parichay-line" style={{ animationDelay: '0.9s' }}/>
        <path d="M 35 70 Q 50 68 65 70" stroke="currentColor" strokeWidth="1.5" className="parichay-line" style={{ animationDelay: '1.2s' }}/>
        <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.8"/>
        <circle cx="50" cy="50" r="6" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    </svg>
)

export const KaushalIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes kaushal-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
            .kaushal-tri { animation: kaushal-breathe 2.5s ease-in-out infinite; transform-origin: 50px 50px; }
        `}</style>
        <polygon points="50,20 65,40 35,40" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="kaushal-tri" style={{ animationDelay: '0s' }}/>
        <polygon points="65,40 80,60 55,60" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="kaushal-tri" style={{ animationDelay: '0.4s' }}/>
        <polygon points="50,80 65,60 35,60" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="kaushal-tri" style={{ animationDelay: '0.8s' }}/>
        <polygon points="35,40 20,60 45,60" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="kaushal-tri" style={{ animationDelay: '1.2s' }}/>
        <circle cx="50" cy="50" r="3" fill="currentColor"/>
    </svg>
)

export const NitiIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes niti-bar1 { 0%, 100% { height: 30px; } 50% { height: 50px; } }
            @keyframes niti-bar2 { 0%, 100% { height: 20px; } 50% { height: 40px; } }
            @keyframes niti-bar3 { 0%, 100% { height: 40px; } 50% { height: 25px; } }
            .niti-bar1 { animation: niti-bar1 3s ease-in-out infinite; }
            .niti-bar2 { animation: niti-bar2 3s ease-in-out infinite; animation-delay: 0.2s; }
            .niti-bar3 { animation: niti-bar3 3s ease-in-out infinite; animation-delay: 0.4s; }
        `}</style>
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
        <rect x="32" y="50" width="8" height="30" rx="2" fill="currentColor" className="niti-bar1" opacity="0.8"/>
        <rect x="46" y="50" width="8" height="20" rx="2" fill="currentColor" className="niti-bar2" opacity="0.8"/>
        <rect x="60" y="50" width="8" height="40" rx="2" fill="currentColor" className="niti-bar3" opacity="0.8"/>
        <line x1="28" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    </svg>
)

export const SankhyaIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes sankhya-twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
            .sankhya-dot { animation: sankhya-twinkle 1.5s ease-in-out infinite; }
        `}</style>
        <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
        <circle cx="50" cy="25" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '0s' }}/>
        <circle cx="63" cy="32" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '0.2s' }}/>
        <circle cx="70" cy="45" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '0.4s' }}/>
        <circle cx="63" cy="58" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '0.6s' }}/>
        <circle cx="50" cy="68" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '0.8s' }}/>
        <circle cx="37" cy="58" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '1s' }}/>
        <circle cx="30" cy="45" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '1.2s' }}/>
        <circle cx="37" cy="32" r="2.5" fill="currentColor" className="sankhya-dot" style={{ animationDelay: '1.4s' }}/>
        <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.6"/>
    </svg>
)

export const ShuddhiIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes shuddhi-sweep { 0%, 100% { translateY: -25px; opacity: 0.3; } 50% { translateY: 25px; opacity: 1; } }
            .shuddhi-line { animation: shuddhi-sweep 2.5s ease-in-out infinite; }
        `}</style>
        <defs>
            <linearGradient id="shuddhi-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
        <polygon points="50,18 76,34 76,66 50,82 24,66 24,34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity="0.7"/>
        <polygon points="50,28 70,38 70,62 50,72 30,62 30,38" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
        <g className="shuddhi-line">
            <rect x="30" y="50" width="40" height="2" rx="1" fill="url(#shuddhi-grad)"/>
        </g>
    </svg>
)

export const GuruIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes guru-ripple1 { 0% { r: 8; opacity: 1; } 100% { r: 24; opacity: 0; } }
            @keyframes guru-ripple2 { 0% { r: 8; opacity: 0; } 50% { opacity: 1; } 100% { r: 28; opacity: 0; } }
            .guru-ripple1 { animation: guru-ripple1 2s ease-out infinite; }
            .guru-ripple2 { animation: guru-ripple2 2s ease-out infinite; animation-delay: 0.6s; }
        `}</style>
        <path d="M 35 30 L 35 70 Q 40 72 50 72 L 50 30 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M 50 30 Q 60 28 65 30 L 65 70 Q 60 72 50 72 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <line x1="50" y1="30" x2="50" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
        <circle cx="50" cy="51" r="8" stroke="currentColor" strokeWidth="1.5" className="guru-ripple1"/>
        <circle cx="50" cy="51" r="8" stroke="currentColor" strokeWidth="1.5" className="guru-ripple2"/>
    </svg>
)

export const AnveshanIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes anveshan-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes anveshan-blink { 0%, 90%, 100% { opacity: 0; } 95% { opacity: 1; } }
            .anveshan-needle { animation: anveshan-sweep 4s linear infinite; transform-origin: 50px 50px; }
            .anveshan-blip { animation: anveshan-blink 4s linear infinite; }
        `}</style>
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
        <text x="50" y="22" fontSize="8" fill="currentColor" textAnchor="middle" opacity="0.6" fontWeight="bold">N</text>
        <g className="anveshan-needle">
            <line x1="50" y1="50" x2="50" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="50" cy="50" r="4" fill="currentColor"/>
        </g>
        <circle cx="50" cy="35" r="2" className="anveshan-blip" fill="currentColor" style={{ animationDelay: '0s' }}/>
        <circle cx="65" cy="50" r="2" className="anveshan-blip" fill="currentColor" style={{ animationDelay: '1s' }}/>
        <circle cx="50" cy="65" r="2" className="anveshan-blip" fill="currentColor" style={{ animationDelay: '2s' }}/>
    </svg>
)

export const ShilpakaarIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes shilpakaar-draw { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
            .shilpakaar-edge { animation: shilpakaar-draw 3s ease-in-out infinite; stroke-dasharray: 100; stroke-linecap: round; stroke-linejoin: round; }
        `}</style>
        <rect x="28" y="38" width="30" height="30" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '0s' }}/>
        <rect x="42" y="28" width="30" height="30" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '0.5s' }}/>
        <line x1="28" y1="38" x2="42" y2="28" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '1s' }}/>
        <line x1="58" y1="38" x2="72" y2="28" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '1.2s' }}/>
        <line x1="28" y1="68" x2="42" y2="58" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '1.4s' }}/>
        <line x1="58" y1="68" x2="72" y2="58" stroke="currentColor" strokeWidth="2" className="shilpakaar-edge" style={{ animationDelay: '1.6s' }}/>
    </svg>
)

export const PrernaIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes prerna-spark { 0%, 100% { opacity: 0.6; r: 3; } 50% { opacity: 1; r: 5; } }
            .prerna-spark { animation: prerna-spark 1.8s ease-in-out infinite; }
        `}</style>
        <path d="M 45 75 Q 45 50 48 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="48" cy="20" r="3" fill="currentColor" className="prerna-spark"/>
        <line x1="48" y1="14" x2="48" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
        <line x1="54" y1="20" x2="58" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
        <line x1="54" y1="26" x2="57" y2="29" stroke="currentColor" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
    </svg>
)

export const SetuIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => {
    const particleStyle = {
        animation: 'setu-flow 2s linear infinite',
        offsetPath: "path('M 25 50 Q 50 35 75 50')",
    }
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
            <style>{`
                @keyframes setu-flow { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
                .setu-particle { offset-rotate: auto; }
            `}</style>
            <circle cx="25" cy="50" r="6" fill="currentColor"/>
            <circle cx="75" cy="50" r="6" fill="currentColor" opacity="0.8"/>
            <path d="M 25 50 Q 50 35 75 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
            <circle cx="0" cy="0" r="2.5" fill="currentColor" className="setu-particle" style={{ ...particleStyle, animationDelay: '0s' }}/>
            <circle cx="0" cy="0" r="2.5" fill="currentColor" className="setu-particle" style={{ ...particleStyle, animationDelay: '0.5s' }}/>
            <circle cx="0" cy="0" r="2.5" fill="currentColor" className="setu-particle" style={{ ...particleStyle, animationDelay: '1s' }}/>
        </svg>
    )
}

export const VachaIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes vacha-wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(2); } }
            .vacha-wave { animation: vacha-wave 1.2s ease-in-out infinite; transform-origin: center; }
        `}</style>
        <line x1="30" y1="40" x2="30" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="vacha-wave" style={{ animationDelay: '0s' }}/>
        <line x1="40" y1="35" x2="40" y2="65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="vacha-wave" style={{ animationDelay: '0.2s' }}/>
        <line x1="50" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="vacha-wave" style={{ animationDelay: '0.4s' }}/>
        <line x1="60" y1="35" x2="60" y2="65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="vacha-wave" style={{ animationDelay: '0.6s' }}/>
        <line x1="70" y1="40" x2="70" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="vacha-wave" style={{ animationDelay: '0.8s' }}/>
    </svg>
)

export const AnuvartanIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes anuvartan-move { 0% { transform: translateX(-5px); } 100% { transform: translateX(5px); } }
            .anuvartan-plane { animation: anuvartan-move 2s ease-in-out infinite alternate; }
        `}</style>
        <g className="anuvartan-plane">
            <polygon points="30,50 50,40 50,60" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <line x1="50" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4"/>
        </g>
    </svg>
)

export const SamanvayIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>{`
            @keyframes samanvay-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .samanvay-g1 { animation: samanvay-rot 10s linear infinite; transform-origin: 50px 50px; }
            .samanvay-g2 { animation: samanvay-rot 6s linear infinite reverse; transform-origin: 50px 50px; }
        `}</style>
        <g className="samanvay-g1">
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 10"/>
            <circle cx="50" cy="15" r="3" fill="currentColor"/>
        </g>
        <g className="samanvay-g2">
            <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 7"/>
            <circle cx="50" cy="30" r="2.5" fill="currentColor"/>
        </g>
        <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.8"/>
    </svg>
)
