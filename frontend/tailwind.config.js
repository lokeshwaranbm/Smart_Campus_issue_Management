/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        background: '#F8FAFC',
        // Enhanced dark mode colors
        dark: {
          bg: '#0f172a',       // Main dark background
          card: '#1e293b',     // Card backgrounds
          border: '#334155',   // Borders
          text: {
            primary: '#f1f5f9',   // Primary text
            secondary: '#cbd5e1', // Secondary text
            muted: '#94a3b8',     // Muted text
          }
        }
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.08)',
        'card-dark': '0 8px 24px rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
