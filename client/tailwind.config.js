/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kore: {
          bg: '#F7F4EF',
          surface: '#EDEAE4',
          border: '#D8D4CC',
          ink: '#1C1A17',
          mid: '#524E46',
          faint: '#C4BFB7',
          white: '#FDFCFA',
          brass: '#9E8460',
          'brass-lt': '#C9B898',
          'brass-dk': '#7A6347',
          success: '#6B8C6B',
          warning: '#B8935A',
          error: '#9E5252',
        },
      },
      fontFamily: {
        display: ['Cormorant', 'serif'],
        body: ['Jost', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(3rem, 7vw, 6rem)', { lineHeight: '0.95', fontWeight: '300' }],
        h1: ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.15', fontWeight: '300' }],
        h2: ['1.5rem', { lineHeight: '1.25', fontWeight: '400' }],
        h3: ['1.2rem', { lineHeight: '1.35', fontWeight: '600' }],
        lead: ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['0.9375rem', { lineHeight: '1.7', fontWeight: '400' }],
        small: ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(28,26,23,0.04), 0 1px 2px rgba(28,26,23,0.06)',
        md: '0 4px 16px rgba(28,26,23,0.06), 0 2px 4px rgba(28,26,23,0.04)',
        lg: '0 12px 40px rgba(28,26,23,0.08), 0 4px 8px rgba(28,26,23,0.04)',
        card: '0 1px 3px rgba(28,26,23,0.04)',
        'card-hover': '0 8px 24px rgba(28,26,23,0.08), 0 2px 4px rgba(28,26,23,0.04)',
        bottom: '0 -1px 12px rgba(28,26,23,0.06)',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        'md-sm': '12px',
        md: '16px',
        'md-lg': '20px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        section: '96px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
