/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          400: '#00d4aa',
          500: '#00bfa0',
        },
        purple: {
          500: '#7b61ff',
        },
        dark: {
          900: '#040d14',
          800: '#0a1f2e',
          700: '#0d2d40',
        }
      }
    },
  },
  plugins: [],
}
