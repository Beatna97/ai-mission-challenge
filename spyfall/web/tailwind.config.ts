import type { Config } from 'tailwindcss';

// Night-steppe palette: tengri indigo, saffron, sky turquoise, ember red.
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#111a33', panel: '#1a2647', gold: '#f2b544', sky: '#4fc3d1', ember: '#ef6a5b' },
      fontFamily: { display: ['var(--font-display)', 'sans-serif'], body: ['var(--font-body)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
