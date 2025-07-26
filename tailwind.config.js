/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
        logo: ['Pacifico', 'cursive'],
        sans: ['Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
