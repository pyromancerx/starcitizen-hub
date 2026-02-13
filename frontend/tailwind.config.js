/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sci-fi theme colors utilizing CSS variables with alpha support
        'sc-dark': 'rgb(var(--color-sc-dark-rgb) / <alpha-value>)',
        'sc-panel': 'rgb(var(--color-sc-panel-rgb) / <alpha-value>)',
        'sc-blue': 'rgb(var(--color-sc-blue-rgb) / <alpha-value>)',
        'sc-light-blue': 'rgb(var(--color-sc-light-blue-rgb) / <alpha-value>)',
        'sc-grey': 'rgb(var(--color-sc-grey-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
