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
          primary: '#FF5A41',
          accent: '#FF8A75',
          dark: '#E8482F',
        },
        primary: {
          DEFAULT: '#FF5A41',
          dark: '#E8482F',
          light: '#FF7A66',
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
