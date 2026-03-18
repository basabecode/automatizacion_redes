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
        mint: {
          DEFAULT: '#9AF5E4',
          deep:    '#7EEEDD',
          light:   '#C8FFF5',
          faint:   '#EAFDF9',
        },
        forest: {
          DEFAULT: '#082C22',
          dark:    '#071C17',
          mid:     '#0D3D2E',
          text:    '#062014',
        },
        teal: {
          body:    '#164437',
          muted:   '#3D7A6B',
          faint:   '#72B0A0',
          border:  'rgba(6,32,20,0.1)',
        },
        accent: {
          DEFAULT: '#00C8A0',
          glow:    'rgba(0,200,160,0.25)',
        },
        coral:  '#FF5252',
        amber:  '#FFAA00',
        violet: '#7C4DFF',
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 2px 12px rgba(6,32,20,0.07)',
        'card-hover': '0 6px 24px rgba(6,32,20,0.13)',
        forest:  '0 4px 16px rgba(8,44,34,0.35)',
        mint:    '0 4px 20px rgba(0,200,160,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
