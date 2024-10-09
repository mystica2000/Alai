/** @type {import('tailwindcss').Config} */


const plugin = require('tailwindcss/plugin');

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
        indigo: {
          DEFAULT: '#5c6ac4',
          dark: '#202e78'
        }
      },
    }
  },
  plugins: [require("tailwindcss-animate"),
  // https://stackoverflow.com/a/72900792
  plugin(({ addBase, theme }) => {
    addBase({
      '.scrollbar': {
        overflowY: 'auto',
        scrollbarColor: `${theme('colors.neutral.500')} transparent`, // For Firefox
        scrollbarWidth: 'thin',
      },
      '.scrollbar::-webkit-scrollbar': {
        width: '1px', // Adjust width as needed
      },
      '.scrollbar::-webkit-scrollbar-track': {
        borderRadius: '50px',
        backgroundColor: 'transparent',
      },
      '.scrollbar::-webkit-scrollbar-thumb': {
        borderRadius: '50px',
        backgroundColor: theme('colors.neutral.500'),
      },
    });
  })
  ],
}

