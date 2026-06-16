/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#bef264',
          hover: '#d9f99d',
        },
        background: '#09090b',
        surface: '#18181b',
      }
    },
  },
  plugins: [],
}
