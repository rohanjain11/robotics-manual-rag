/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        industrial: {
          DEFAULT: '#5B7FA6',
          dark: '#4A6FA5',
        },
        status: {
          warning: '#D97706',
          success: '#4D7C5F',
          error: '#B45252',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
