module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f0a5c0',
        secondary: '#e88dac',
        dark: {
          50: '#f9fafb',
          100: '#1a1b1e',
          200: '#2c2e33',
          300: '#1f2024',
          400: '#18191c',
        }
      }
    },
  },
  plugins: [],
} 