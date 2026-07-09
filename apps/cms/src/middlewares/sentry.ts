import * as Sentry from '@sentry/node'
import type { Core } from '@strapi/strapi'

const sentry: Core.MiddlewareFactory = () => {
  const dsn = process.env.SENTRY_DSN
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
    })
  }

  return async (_ctx, next) => {
    try {
      await next()
    } catch (error) {
      if (dsn) {
        Sentry.captureException(error)
      }
      throw error
    }
  }
}

export default sentry
