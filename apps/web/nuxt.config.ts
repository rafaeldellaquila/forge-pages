import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['nuxt-security'],

  // @forge-pages/ui ships raw .vue/.ts (no build step) — transpile it for SSR
  build: {
    transpile: ['@forge-pages/ui'],
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // Multi-tenant ISR: cache each tenant page for 1 hour, revalidate in background
  routeRules: {
    '/**': { isr: 3600 },
  },

  runtimeConfig: {
    // Private — server-side only
    strapiUrl: process.env.STRAPI_URL,
    strapiApiToken: process.env.STRAPI_API_TOKEN,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    // Public — exposed to the client
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST,
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
        'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
        'img-src': ["'self'", 'data:', '*.supabase.co'],
        'connect-src': ["'self'", 'https://app.posthog.com', process.env.SUPABASE_URL ?? ''],
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    rateLimiter: false, // handled by Upstash in the lead server route
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
