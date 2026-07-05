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
          DEFAULT: '#9E1B32',
          dark: '#6E0F1B',
          light: '#C24A5E',
        },
        secondary: {
          DEFAULT: '#1A1D1F',
          light: '#6B7280',
        },
        surface: '#F2F3F5',
        success: '#0EA968',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
