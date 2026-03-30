import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#f1f7fe',
          surface: '#ffffff',
          raised: '#f8fafc',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.8)',
          hover: 'rgba(255,255,255,0.95)',
          border: 'rgba(0,0,0,0.1)',
        },
        accent: {
          blue: '#3b82f6',
          'blue-glow': 'rgba(59,130,246,0.15)',
          violet: '#8b5cf6',
          'violet-glow': 'rgba(139,92,246,0.12)',
          green: '#22c55e',
          'green-glow': 'rgba(34,197,94,0.12)',
          orange: '#f97316',
          'orange-glow': 'rgba(249,115,22,0.12)',
        },
        content: {
          primary: '#0f172a',
          muted: '#475569',
          subtle: '#64748b',
        },
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.1), transparent)',
        'card-glow':
          'radial-gradient(ellipse at top left, rgba(59,130,246,0.05), transparent 60%)',
        'violet-glow':
          'radial-gradient(ellipse at bottom right, rgba(139,92,246,0.08), transparent 60%)',
        'green-glow':
          'radial-gradient(ellipse at center, rgba(34,197,94,0.03), transparent 70%)',
      },
      boxShadow: {
        glass:
          '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
        'glass-lg':
          '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
        'glow-blue':
          '0 0 20px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)',
        'glow-sm': '0 0 8px rgba(59,130,246,0.1)',
        'glow-green': '0 0 20px rgba(34,197,94,0.1), 0 0 40px rgba(34,197,94,0.03)',
        'glow-orange': '0 0 20px rgba(249,115,22,0.1), 0 0 40px rgba(249,115,22,0.03)',
      },
      backdropBlur: {
        glass: '16px',
        swarm: '6px',
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
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
