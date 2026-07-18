/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070A12',
          900: '#0B0F1A',
          850: '#0F1422',
          800: '#141A2B',
          750: '#1A2138',
          700: '#222B47',
          600: '#2C375D',
        },
        brand: {
          50: '#EEF2FF',
          100: '#DCE3FF',
          200: '#B9C7FF',
          300: '#8FA6FF',
          400: '#7C9CFF',
          500: '#5C7BFF',
          600: '#3F5AE6',
          700: '#2E41B8',
          800: '#1F2E85',
        },
        mint: {
          300: '#7BE9B5',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,156,255,0.18), 0 10px 40px -10px rgba(92,123,255,0.35)',
        card: '0 10px 30px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C9CFF 0%, #4ADE80 100%)',
        'ink-gradient': 'linear-gradient(180deg, #0F1422 0%, #070A12 100%)',
        'card-gradient': 'linear-gradient(160deg, rgba(31,46,133,0.10) 0%, rgba(34,197,94,0.04) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'rise': 'rise 0.45s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
