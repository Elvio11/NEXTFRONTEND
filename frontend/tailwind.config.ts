import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#050505',
          surface: '#0d0d0d',
          raised: '#141414',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          border: 'rgba(255,255,255,0.08)',
        },
        accent: {
          blue: '#3b82f6',
          'blue-glow': 'rgba(59,130,246,0.15)',
          violet: '#8b5cf6',
          'violet-glow': 'rgba(139,92,246,0.12)',
        },
        content: {
          primary: '#f1f5f9',
          muted: '#64748b',
          subtle: '#334155',
        },
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.15), transparent)',
        'card-glow':
          'radial-gradient(ellipse at top left, rgba(59,130,246,0.08), transparent 60%)',
        'violet-glow':
          'radial-gradient(ellipse at bottom right, rgba(139,92,246,0.1), transparent 60%)',
      },
      boxShadow: {
        glass:
          '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg':
          '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-blue':
          '0 0 20px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)',
        'glow-sm': '0 0 8px rgba(59,130,246,0.2)',
        'glow-green': '0 0 8px rgba(34,197,94,0.25)',
      },
      backdropBlur: {
        glass: '12px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        borderGlow: {
          '0%': { borderColor: 'rgba(59,130,246,0.2)' },
          '100%': { borderColor: 'rgba(59,130,246,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease forwards',
        glowPulse: 'glowPulse 3s ease-in-out infinite',
        borderGlow: 'borderGlow 2s ease-in-out alternate infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
