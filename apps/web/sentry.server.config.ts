import * as Sentry from '@sentry/nuxt'

// No-op when NUXT_PUBLIC_SENTRY_DSN is unset (dsn: undefined disables Sentry)
Sentry.init({
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
