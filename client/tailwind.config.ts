import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-from': 'var(--bg-from)',
        'bg-to': 'var(--bg-to)',
        card: {
          DEFAULT: 'var(--card-bg)',
          bg: 'var(--card-bg)',
          border: 'var(--card-border)',
        },
        'card-border': 'var(--card-border)',
        heading: 'var(--heading)',
        body: 'var(--text)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        chip: {
          DEFAULT: 'var(--chip-bg)',
          bg: 'var(--chip-bg)',
        },
        'chip-bg': 'var(--chip-bg)',
        popover: {
          DEFAULT: 'var(--popover-bg)',
          bg: 'var(--popover-bg)',
          border: 'var(--popover-border)',
          text: 'var(--popover-text)',
          heading: 'var(--popover-heading)',
          muted: 'var(--popover-muted)',
          hover: 'var(--popover-hover)',
        },
        'popover-bg': 'var(--popover-bg)',
        'popover-border': 'var(--popover-border)',
        'popover-text': 'var(--popover-text)',
        'popover-heading': 'var(--popover-heading)',
        'popover-muted': 'var(--popover-muted)',
        'popover-hover': 'var(--popover-hover)',
        btn: {
          primary: {
            DEFAULT: 'var(--btn-primary-bg)',
            bg: 'var(--btn-primary-bg)',
            text: 'var(--btn-primary-text)',
          },
          secondary: {
            DEFAULT: 'var(--btn-secondary-bg)',
            bg: 'var(--btn-secondary-bg)',
            text: 'var(--btn-secondary-text)',
          },
        },
        // Keep campus palette backwards-compatible for any lingering utility usages
        campus: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
    },
  },
  plugins: [],
};

export default config;
