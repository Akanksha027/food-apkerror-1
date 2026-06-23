/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E55A2B',
          light: '#FF8F66',
        },
        secondary: {
          DEFAULT: '#2D3436',
          light: '#636E72',
        },
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#D63031',
      },
    },
  },
  plugins: [],
};
