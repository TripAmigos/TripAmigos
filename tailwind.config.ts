import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A3532',
        accent: {
          DEFAULT: '#C86552',
          hover: '#b5574a',
          light: 'rgba(200, 101, 82, 0.08)',
        },
        sage: {
          DEFAULT: '#A3B7A0',
          light: 'rgba(163, 183, 160, 0.15)',
          dark: '#8a9e87',
        },
        cream: '#F7F4EE',
        'bg-soft': '#F7F4EE',
        'text-secondary': '#6b6560',
        'text-muted': '#9c9590',
        border: '#e0dbd4',
        success: {
          DEFAULT: '#A3B7A0',
          bg: '#f0f5ef',
          border: '#c5d4c3',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fef3c7',
        },
        info: {
          DEFAULT: '#C86552',
          bg: '#fdf0ed',
        },
      },
      borderRadius: {
        card: '16px',
        input: '10px',
      },
      fontFamily: {
        sans: ['"Red Hat Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
