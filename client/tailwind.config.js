/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff5f2',
          100: '#ffe6de',
          200: '#ffc9b8',
          300: '#ffa387',
          400: '#fb923c',
          500: '#f97316',
          600: '#e85d3f',
          700: '#c9472b',
          800: '#a33923',
          900: '#843120',
        },
        paper: {
          DEFAULT: '#F7F4EE',
          surface: '#FFFFFF',
          border: '#E5DFD5',
          ink: '#141210',
          muted: '#57534E',
        },
        obsidian: {
          DEFAULT: '#0D0D11',
          sidebar: '#111116',
          card: '#16161D',
          elevated: '#1C1C26',
        },
        copper: {
          DEFAULT: '#E85D3F',
          bright: '#F97316',
        },
        mint: {
          DEFAULT: '#10B981',
          electric: '#34D399',
        },
        success: {
          50:  '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(20 18 16 / 0.04), 0 1px 3px 0 rgb(20 18 16 / 0.06)',
        'card-hover': '0 8px 24px -4px rgb(20 18 16 / 0.08), 0 2px 6px -1px rgb(20 18 16 / 0.04)',
      },
    },
  },
  plugins: [],
};
