// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: false
  },

  colorMode: {
    preference: 'light'
  },

  experimental: {
    appManifest: false
  },

  app: {
    head: {
      title: 'Guardiao do Estoque',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de Controle de Estoque para Centro de Distribuicao' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  }
})
