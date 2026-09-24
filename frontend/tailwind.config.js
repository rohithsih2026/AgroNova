/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17231d',
        forest: '#1d5b45',
        leaf: '#2f8f63',
        mint: '#eaf7f0',
        sky: '#eaf4fb',
        amber: '#f59e0b',
        danger: '#dc4c4c',
      },
      boxShadow: {
        soft: '0 8px 28px rgba(24, 61, 43, 0.07)',
        lift: '0 16px 42px rgba(24, 61, 43, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
