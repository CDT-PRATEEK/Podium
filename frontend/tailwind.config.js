/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // === ANIMATIONS ===
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
      },

      // === Typography Configuration ===
      typography: (theme) => ({
        DEFAULT: {
          css: {
            // LIGHT MODE DEFAULTS (Force Light Gray Background)
            pre: {
              backgroundColor: theme('colors.gray.100'),
              color: theme('colors.gray.800'),
              border: `1px solid ${theme('colors.gray.200')}`,
            },
          
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              color: theme('colors.pink.600'),
              backgroundColor: theme('colors.gray.100'),
              fontWeight: '600',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
            },
          },
        },
        // DARK MODE OVERRIDES (Triggered by dark:prose-invert)
        invert: {
          css: {
            pre: {
              backgroundColor: theme('colors.gray.900'),
              color: theme('colors.gray.200'),
              border: `1px solid ${theme('colors.gray.700')}`,
            },
            code: {
              color: theme('colors.pink.400'),
              backgroundColor: theme('colors.gray.800'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}