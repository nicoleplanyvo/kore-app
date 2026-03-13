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
        display: ['clamp(4rem, 9vw, 8.5rem)', { lineHeight: '0.92', fontWeight: '300' }],
        h1: ['clamp(2.4rem, 4vw, 3.8rem)', { lineHeight: '1.1', fontWeight: '300' }],
        h2: ['1.8rem', { lineHeight: '1.2', fontWeight: '400' }],
        h3: ['1.45rem', { lineHeight: '1.3', fontWeight: '600' }],
        lead: ['1.35rem', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.8', fontWeight: '400' }],
        small: ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['0.72rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '8px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(28,26,23,0.06)',
        md: '0 4px 12px rgba(28,26,23,0.08)',
        lg: '0 12px 32px rgba(28,26,23,0.10)',
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
    },
  },
  plugins: [],
};
