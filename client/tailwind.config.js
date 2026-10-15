/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf7f3',
          100: '#fbf0e7',
          200: '#f5dcce',
          300: '#ecbfa5',
          400: '#e19770',
          500: '#d97736', // Signature burnt copper / industrial amber
          600: '#c56426',
          700: '#a34e1c',
          800: '#833d1b',
          900: '#6c331a',
          950: '#3c1809',
        },
        slate: {
          50: '#f4f6f4',
          100: '#e5ebe6',
          200: '#d0dbd2',
          300: '#b2c1b5',
          400: '#8e9f93', // Muted sage/olive gray text
          500: '#6c7c71',
          600: '#506056',
          700: '#38463e', // Olive-charcoal borders and dividers
          800: '#25312a', // Elevated surface, input backgrounds, pill buttons
          850: '#1f2923',
          900: '#1a231d', // Dark olive card, topbar and sidebar surfaces
          950: '#131915', // Deep dark army olive base background
        },
      },
    },
  },
  plugins: [],
};
