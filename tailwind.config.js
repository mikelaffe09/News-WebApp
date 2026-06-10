/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: [
          'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        'news-red': {
          50: '#fff1f1',
          100: '#ffe0e0',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
      },
    },
  },
  plugins: [],
};
