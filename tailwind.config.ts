import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#D4AF37',
        'altBrand': '#B8860B',
        'darkGold': '#DAA520',
        'brand-gold': '#D4AF37',
        'brand-gold-light': '#F3E5AB',
        'brand-gold-dark': '#b08d22',
        'primaryBg': '#0D0D0D',
        'secondaryBg': '#1A1A1A',
        'primary-black': '#050505',
        'secondary-black': '#121212',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 10px 40px -10px rgba(212, 175, 55, 0.4)',
      },
      animation: {
        'pulse-custom': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
};
export default config;