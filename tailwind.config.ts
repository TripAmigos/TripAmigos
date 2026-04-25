import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: 'rgba(37, 99, 235, 0.08)',
        },
        'bg-soft': '#f8f9fb',
        'text-secondary': '#6b7280',
        'text-muted': '#9ca3af',
        border: '#e5e7eb',
        success: {
          DEFAULT: '#10b981',
          bg: '#ecfdf5',
          border: '#a7f3d0',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fef3c7',
        },
        info: {
          DEFAULT: '#3b82f6',
          bg: '#eff6ff',
        },
      },
      borderRadius: {
        card: '16px',
        input: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
