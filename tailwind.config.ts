import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        flip: 'flip 0.5s ease-in-out forwards',
        shake: 'shake 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        flip: {
          '0%':   { transform: 'rotateX(0deg)', backgroundColor: 'rgb(75 85 99)' },
          '49%':  { transform: 'rotateX(-90deg)', backgroundColor: 'rgb(75 85 99)' },
          '50%':  { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-6px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 12px 0 rgba(245,158,11,0.3)' },
          '50%':     { boxShadow: '0 0 24px 4px rgba(245,158,11,0.5)' },
        },
      },
      colors: {
        correct: '#22c55e',   // green-500
        close: '#eab308',     // yellow-500
        wrong: '#ef4444',     // red-500
      },
    },
  },
  plugins: [],
}
export default config
