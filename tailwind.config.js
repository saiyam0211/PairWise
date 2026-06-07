/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        manrope: ['Manrope_400Regular'],
        'manrope-medium': ['Manrope_500Medium'],
        'manrope-semibold': ['Manrope_600SemiBold'],
        'manrope-bold': ['Manrope_700Bold'],
        'manrope-extrabold': ['Manrope_800ExtraBold'],
      },
      colors: {
        // Semantic design tokens — resolved to light/dark vars in global.css
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        // Budget-specific accent colors (Buckwheat-inspired)
        'budget-good': 'rgb(var(--color-budget-good) / <alpha-value>)',
        'budget-good-text': 'rgb(var(--color-budget-good-text) / <alpha-value>)',
        'budget-card': 'rgb(var(--color-budget-card) / <alpha-value>)',
        'budget-card-text': 'rgb(var(--color-budget-card-text) / <alpha-value>)',
        'budget-over': 'rgb(var(--color-budget-over) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',
        'date-header': 'rgb(var(--color-date-header) / <alpha-value>)',
        'key-bg': 'rgb(var(--color-key-bg) / <alpha-value>)',
        'key-bg-dark': 'rgb(var(--color-key-bg-dark) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
