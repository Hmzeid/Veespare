/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        accent: '#e94560',
        gold: '#f5a623',
        'primary-light': '#16213e',
        'primary-dark': '#0f0f1a',
        'accent-light': '#ff6b81',
        'accent-dark': '#c73450',
        'gold-light': '#ffc857',
        'gold-dark': '#d4891a',
        surface: '#f8f9fa',
        'surface-dark': '#e9ecef',
        'text-primary': '#1a1a2e',
        'text-secondary': '#6c757d',
        'text-inverse': '#ffffff',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8',
      },
      fontFamily: {
        cairo: ['Cairo-Regular'],
        'cairo-bold': ['Cairo-Bold'],
        'cairo-semibold': ['Cairo-SemiBold'],
        'cairo-medium': ['Cairo-Medium'],
        'cairo-light': ['Cairo-Light'],
      },
    },
  },
  plugins: [],
};
