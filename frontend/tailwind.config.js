/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sci-fi theme colors utilizing CSS variables
        'sc-dark': 'var(--color-sc-dark)',
        'sc-panel': 'var(--color-sc-panel)',
        'sc-blue': 'var(--color-sc-blue)',
        'sc-light-blue': 'var(--color-sc-light-blue)',
        'sc-grey': 'var(--color-sc-grey)',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
