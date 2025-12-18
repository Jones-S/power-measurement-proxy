module.exports = {
  theme: {
    colors: {
      black: '#000000',
      white: '#ffffff',
      gray: {
        100: '#f7fafc',
        500: '#c3c3c3',
        900: '#1a202c',
      },
      highlight: '#ff2e4d',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1280px',
      xl: '1440px',
    },
    fontFamily: {
      sans: ['IBM Plex Sans', 'sans-serif'],
      serif: ['Times New Roman', 'serif'],
    },
  },
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  plugins: [
    function ({ addBase, theme }) {
      if (process.env.NODE_ENV === 'production') return

      const screens = theme('screens', {})
      const breakpoints = Object.keys(screens)

      addBase({
        'body::after': {
          content: `"Current breakpoint default (< ${screens[breakpoints[0]]})"`,
          position: 'fixed',
          right: '.5rem',
          bottom: '.5rem',
          padding: '.5rem',
          border: '1px solid #cbd5e0',
          color: '#d53f8c',
          fontSize: '.875rem',
          fontWeight: '600',
          zIndex: '99999',
        },
        ...breakpoints.reduce((acc, current) => {
          acc[`@media (min-width: ${screens[current]})`] = {
            'body::after': {
              content: `"Current breakpoint: ${current}"`,
            },
          }
          return acc
        }, {}),
      })
    },
  ],
}
