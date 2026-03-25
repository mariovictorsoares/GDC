// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    zapiInstanceId: process.env.ZAPI_INSTANCE_ID || '',
    zapiToken: process.env.ZAPI_TOKEN || '',
    zapiClientToken: process.env.ZAPI_CLIENT_TOKEN || '',
    zapiBaseUrl: process.env.ZAPI_BASE_URL || 'https://api.z-api.io',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeTaxaImplPriceId: process.env.STRIPE_TAXA_IMPL_PRICE_ID || '',
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: false,
    cookieName: 'sb-cmv360',
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  },

  colorMode: {
    preference: 'light'
  },

  experimental: {
    appManifest: false
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  },

  app: {
    head: {
      title: 'CMV360',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'CMV360 - Sistema de Controle de Estoque e CMV' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  }
})
