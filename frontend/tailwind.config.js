/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---------- Brand ----------
        brand: {
          DEFAULT: '#0B5FFF',   // electric blue — primary action
          dark:    '#0043C7',
          light:   '#3D82FF',
          soft:    'rgba(11,95,255,0.12)',
        },
        // ---------- Accent — warm amber ----------
        accent: {
          DEFAULT: '#FF7A18',
          dark:    '#E56600',
          light:   '#FFA24D',
          soft:    'rgba(255,122,24,0.14)',
        },
        // ---------- Neutral dark scale ----------
        ink: {
          950: '#05070D',
          900: '#0A0E17',
          850: '#0E1420',
          800: '#121A2A',
          700: '#1B2436',
          600: '#26314A',
          500: '#38445F',
          400: '#5A6885',
          300: '#8A96AE',
          200: '#B9C2D4',
          100: '#E1E6EF',
        },
        // ---------- Semantic ----------
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#38BDF8',

        // ---------- Legacy aliases used across the codebase ----------
        // Many older components use these class names:
        //   bg-dark-subtle / bg-dark-muted / bg-dark-elevated
        //   border-dark-border / border-dark-border-strong
        //   from-primary-light to-primary
        //   from-secondary to-secondary-light
        //   text-secondary-light
        // Defining them here makes every existing usage resolve
        // without editing any JSX file.
        dark: {
          DEFAULT:         '#05070D',
          subtle:          '#0A0E17',
          muted:           '#121A2A',
          elevated:        '#0E1420',
          elevated2:       '#121A2A',
          border:          '#1B2436',
          'border-strong': '#26314A',
          bg:              '#05070D',
        },
        primary: {
          DEFAULT: '#0B5FFF',
          light:   '#3D82FF',
          dark:    '#0043C7',
        },
        secondary: {
          DEFAULT: '#FF7A18',
          light:   '#FFA24D',
          dark:    '#E56600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':    '0 1px 2px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
        'card-lg': '0 10px 30px -12px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
        'glow':    '0 0 0 1px rgba(11,95,255,0.35), 0 8px 30px -8px rgba(11,95,255,0.45)',
        'glow-accent': '0 0 0 1px rgba(255,122,24,0.35), 0 8px 30px -8px rgba(255,122,24,0.5)',
      },
      backgroundImage: {
        'grid': "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        'radial-fade': 'radial-gradient(circle at center, rgba(11,95,255,0.18), transparent 65%)',
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
      animation: {
        'marquee':   'marquee 32s linear infinite',
        'float':     'float 7s ease-in-out infinite',
        'fade-up':   'fadeUp 700ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fadeIn 400ms ease-out both',
        'progress':  'heroProgress 6500ms linear forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
        'shimmer':   'shimmer 1.6s infinite',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        fadeUp:  { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        heroProgress: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        shimmer: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};