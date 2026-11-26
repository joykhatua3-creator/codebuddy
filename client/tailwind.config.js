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
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        lucid: {
          light: '#F4F7FB',
          dark: '#070B14',
          cyan: '#38BDF8',
          indigo: '#6366F1',
          violet: '#818CF8',
          mint: '#34D399',
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
        card: '0 8px 32px -8px rgba(15, 23, 42, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'card-hover': '0 14px 36px -8px rgba(56, 189, 248, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.75)',
      },
    },
  },
  plugins: [],
};
