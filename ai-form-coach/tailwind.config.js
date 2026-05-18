/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        // Map Tailwind utilities to the CSS variables declared in globals.css.
        // Use font-sans for product UI, font-display for editorial / wordmark,
        // font-mono for eyebrows, HUD, plate labels.
        sans:    ['var(--font-sans)',    'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia',       'Times New Roman', 'serif'],
        mono:    ['var(--font-mono)',    'ui-monospace',  'SFMono-Regular',  'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
