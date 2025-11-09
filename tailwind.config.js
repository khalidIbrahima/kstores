/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Utilise la classe 'dark' pour le mode sombre
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small devices
      },
      colors: {
        primary: {
          DEFAULT: '#183153', // Bleu foncé principal
          dark: '#0f1f2e',
          light: '#2a4a6e',
        },
        secondary: {
          DEFAULT: '#ff6b00', // Orange vif
          dark: '#cc5500',
          light: '#ff8533',
        },
        accent: {
          DEFAULT: '#00a8e8', // Bleu clair
          dark: '#0077a8',
          light: '#33b9eb',
        },
        background: {
          DEFAULT: '#ffffff',
          light: '#f8f9fa',
          dark: '#e9ecef',
        },
        text: {
          DEFAULT: '#2c3e50',
          light: '#6c757d',
          dark: '#1a202c',
        }
      },
      fontFamily: {
        logo: ['Pacifico', 'cursive', 'system-ui', 'sans-serif'],
        sans: [
          // Modern system fonts
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          // Windows
          'Segoe UI',
          // Android
          'Roboto',
          // Ubuntu/Linux
          'Ubuntu',
          'Cantarell',
          // Fallbacks
          'Noto Sans',
          'Helvetica Neue',
          'Arial',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Source Code Pro',
          'Menlo',
          'Consolas',
          'DejaVu Sans Mono',
          'monospace'
        ]
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '0.005em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '0' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
};
