/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sci-fi theme colors
        'sc-dark': '#0b0c10',
        'sc-panel': '#1f2833',
        'sc-blue': '#66fcf1',
        'sc-light-blue': '#45a29e',
        'sc-grey': '#c5c6c7',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'], // Assuming we add a font later
      }
    },
  },
  plugins: [],
}