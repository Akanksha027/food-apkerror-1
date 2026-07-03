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
        brand: {
          primary: '#7A0E22',
          accent: '#C4786A',
          dark: '#5A0A18',
        },
        primary: {
          DEFAULT: '#7A0E22',
          dark: '#5A0A18',
          light: '#C4786A',
        },
        secondary: {
          DEFAULT: '#2D3436',
          light: '#636E72',
        },
      },
    },
  },
  plugins: [],
};
