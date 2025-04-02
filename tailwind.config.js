/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: {
          400: '#8B4513',
          500: '#654321',
          600: '#3B2515',
        },
      },
    },
  },
  plugins: [],
};