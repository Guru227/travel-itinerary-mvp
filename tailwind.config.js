/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
      },
      colors: {
        primary: '#FF9800',
        secondary: '#455A64',
        surface: '#F1F5F9',
        beige: '#F5F5DC',
      }
    },
  },
  plugins: [],
};