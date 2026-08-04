import tailwindcss from '@tailwindcss/vite'

// Strapi admin origin, trusted to iframe /preview (frame-ancestors) — derived from
// STRAPI_URL so dev (localhost:1337) and prod (cms.forgecompany.example.com) both work
// without a separate "admin domain" env var.
const strapiOrigin = (() => {
  try {
    return new URL(process.env.STRAPI_URL ?? 'http://localhost:1337').origin
  } catch {
    return 'http://localhost:1337'
  }
})()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['nuxt-security', '@sentry/nuxt/module'],

  sentry: {
    sourceMapsUploadOptions: {
      org: 'forge-company',
      project: 'forge-pages',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  },

  // @forge-pages/ui ships raw .vue/.ts (no build step) — transpile it for SSR
  build: {
    transpile: ['@forge-pages/ui'],
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // Multi-tenant ISR: cache each tenant page for 1 hour, revalidate in background.
  // /preview and its data route are excluded — draft content must never enter the
  // public ISR/CDN cache, and the relaxed frame-ancestors CSP is scoped to /preview only.
  routeRules: {
    '/**': { isr: 3600 },
    '/preview': {
      isr: false,
      headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
      security: {
        headers: {
          xFrameOptions: false, // frame-ancestors below is the authoritative control here
          contentSecurityPolicy: {
            'frame-ancestors': ["'self'", strapiOrigin],
          },
        },
      },
    },
    '/api/preview-blocks': {
      isr: false,
      headers: { 'cache-control': 'no-store' },
    },
  },

  runtimeConfig: {
    // Private — server-side only
    strapiUrl: process.env.STRAPI_URL,
    strapiApiToken: process.env.STRAPI_API_TOKEN,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    previewSecret: process.env.PREVIEW_SECRET,
    // Public — exposed to the client
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST,
      strapiUrl: process.env.STRAPI_URL, // needed client-side for the PreviewBridge postMessage origin check
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
        'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
        'img-src': ["'self'", 'data:', '*.supabase.co', '*.storage.supabase.co'],
        'connect-src': [
          "'self'",
          process.env.SUPABASE_URL ?? '',
          process.env.NUXT_PUBLIC_POSTHOG_HOST ?? '',
          'https://*.i.posthog.com',
          'https://*.sentry.io',
          'https://*.ingest.sentry.io',
        ].filter(Boolean),
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
