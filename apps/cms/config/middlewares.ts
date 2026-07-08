import type { Core } from '@strapi/strapi'

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'global::sentry',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', '*.supabase.co'],
          'media-src': ["'self'", 'data:', 'blob:', '*.supabase.co'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      headers: '*',
      origin: ['http://localhost:3000', process.env.NUXT_PUBLIC_SITE_URL ?? ''].filter(Boolean),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]

export default config
