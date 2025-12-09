import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#D4AF37',
        'brand-gold-light': '#F3E5AB',
        'brand-gold-dark': '#B8860B',
        'primary-black': '#050505',
        'secondary-black': '#121212',
      },
      fontFamily: {
        heading: ['var(--font-montserrat)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'pulse-custom': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-spin': 'border-spin 4s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;