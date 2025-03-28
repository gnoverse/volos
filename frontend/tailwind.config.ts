import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "mysticBlue": {
          50: 'var(--mysticBlue-50)',
          100: 'var(--mysticBlue-100)',
          200: 'var(--mysticBlue-200)',
          300: 'var(--mysticBlue-300)',
          400: 'var(--mysticBlue-400)',
          500: 'var(--mysticBlue-500)',
          600: 'var(--mysticBlue-600)',
          700: 'var(--mysticBlue-700)',
          800: 'var(--mysticBlue-800)',
          900: 'var(--mysticBlue-900)',
          950: 'var(--mysticBlue-950)',
        },
        "gray": {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },
      },
    },
  },
  plugins: [],
}

export default config
