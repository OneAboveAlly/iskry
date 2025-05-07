/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#f0f9ff',
          DEFAULT: '#0ea5e9',
          dark: '#0369a1',
        },
        secondary: {
          light: '#f5f3ff',
          DEFAULT: '#8b5cf6',
          dark: '#5b21b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
} 