import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    'nuxt-svgo',
    '@nuxt/eslint',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/content',
  ],
  content: {
    experimental: { nativeSqlite: true },
  },
  css: ['~/assets/css/tailwind.css'],
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'stylesheet', href: 'https://use.typekit.net/kkn0crl.css' },
      ],
    },
  },
  build: {},
  compatibilityDate: '2024-04-03',
  vite: {
    plugins: [tailwindcss()],
  },
  sitemap: {
    sources: ['/api/__sitemap__'],
  },
  robots: {
    disallow: ['/kitchensink'],
  },
  svgo: {
    defaultImport: 'component',
  },
})
