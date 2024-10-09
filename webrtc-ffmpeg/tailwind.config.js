/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        black: '#000000',
        badge: "#4338ca",
        indigo: {
          DEFAULT: '#5c6ac4',
          dark: '#202e78'
        }
      },
      scale: {
        '175': '1.75',
      }
    }
  },
  plugins: [require("tailwindcss-animate"), require('tailwind-scrollbar'),],
}

