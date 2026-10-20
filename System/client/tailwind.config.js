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
          DEFAULT: '#2563EB',
          light: '#E0F2FE',
          dark: '#1D4ED8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        bgWhite: '#FFFFFF',
        cardBg: '#F8FAFC',
        textDark: '#1F2937',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 30px -5px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
