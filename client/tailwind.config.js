/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary:'#ff5252',
      },
      backgroundColor:{
        primary:'#ff5252',
      },
      borderRadius: {
        'sm': '8px',
        DEFAULT: '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 4px 16px rgba(0, 0, 0, 0.06)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.1)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}

