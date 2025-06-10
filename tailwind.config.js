/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.

  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: 'var(--color-primary-default)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary-default)',
          light: 'var(--color-secondary-light)',
          dark: 'var(--color-secondary-dark)',
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
        },
        
        // Neutral Colors
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        
        // Background Colors
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        
        // Text Colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        
        // Border Colors
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          dark: 'var(--color-border-dark)',
        },
        
        // Status Colors
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
        
        // Overlay
        overlay: {
          DEFAULT: 'var(--color-overlay)',
          light: 'var(--color-overlay-light)',
        },
      },
      
      // Custom box shadows
      boxShadow: {
        'theme': '0 1px 3px 0 var(--color-shadow)',
        'theme-md': '0 4px 6px -1px var(--color-shadow)',
        'theme-lg': '0 10px 15px -3px var(--color-shadow)',
      },
    },
  },
  plugins: [],
};
