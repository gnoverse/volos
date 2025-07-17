import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mysticBlue: {
          50:  '#e1e9f7',
          100: '#c2d3f0',
          200: '#93ace0',
          300: '#6b89d1',
          400: '#4a67c2',
          500: '#2f4ead',
          600: '#263e8b',
          700: '#1e3069',
          800: '#172348',
          900: '#0f162d',
          950: '#090e1a',
        },
        customGray: {
          50:  '#f8f8fc',
          100: '#f1f1f9',
          200: '#e5e4ed',
          300: '#d1d0de',
          400: '#9e9eb4',
          500: '#6d6f89',
          600: '#4e5173',
          700: '#3c3d5a',
          800: '#26243f',
          900: '#1a192e',
          950: '#12101d',
        },
        darkPurple: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        midnightPurple: {
          50:  '#eeedf2',
          100: '#d8d6e5',
          200: '#b3afd1',
          300: '#8c86bd',
          400: '#6b5fa6',
          500: '#553d94',
          600: '#472e83',
          700: '#3a226e',
          800: '#2c1857',
          900: '#1f1040',
          950: '#13072a',
        },
        neonPurple: {
          50: '#2e073f',
        },
        logo: {
          50:  '#FFF3E6',  // very light orange
          100: '#FFE0BF',
          200: '#FFC299',
          300: '#FFA366',
          400: '#FA6914', // main logo orange
          500: '#D95C12',
          600: '#B84F10',
          700: '#993F0D',
          800: '#7A320A',
          900: '#5C2507',
          950: '#3D1804',
        },
      },
    },
  },
  plugins: [],
}

export default config
