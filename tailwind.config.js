module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        dark: {
          50: '#f9fafb',
          100: '#1a1b1e',
          200: '#2c2e33',
          300: '#1f2024',
          400: '#18191c',
        },
        light: {
          100: '#ffffff',
          200: '#f3f4f6',
          300: '#e5e7eb',
          400: '#d1d5db',
        }
      }
    },
  },
  plugins: [],
} 