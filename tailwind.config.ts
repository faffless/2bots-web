import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bot-bg': '#1a1a2e',
        'bot-panel': '#16213e',
        'bot-settings': '#0f1a2e',
        'bot-claude': '#e77f67',
        'bot-gpt': '#78e08f',
        'bot-user': '#82ccdd',
        'bot-text': '#eeeeee',
        'bot-muted': '#888888',
        'bot-slider': '#2d3436',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
