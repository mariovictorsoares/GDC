// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    zapiInstanceId: process.env.ZAPI_INSTANCE_ID || '',
    zapiToken: process.env.ZAPI_TOKEN || '',
    zapiClientToken: process.env.ZAPI_CLIENT_TOKEN || '',
    zapiBaseUrl: process.env.ZAPI_BASE_URL || 'https://api.z-api.io'
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: false,
    cookieName: 'sb-estoque',
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: false
    }
  },

  colorMode: {
    preference: 'light'
  },

  experimental: {
    appManifest: false
  },

  app: {
    head: {
      title: 'Guardião do Estoque',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de Controle de Estoque para Centro de Distribuição' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  }
})
