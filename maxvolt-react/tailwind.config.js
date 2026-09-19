/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#003366',
          dark: '#001f3f',
          light: '#0a4d8c',
        },
        secondary: {
          DEFAULT: '#ff6b00',
          dark: '#e55a00',
          light: '#ff8c3a',
        },
        accent: '#38bdf8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: {
          bg: '#0a0f1a',
          subtle: '#0f172a',
          muted: '#1e293b',
          elevated: '#16213a',
          border: '#1f2b45',
          'border-strong': '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'heroFadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'progress': 'heroProgress 6000ms linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        heroFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heroProgress: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};