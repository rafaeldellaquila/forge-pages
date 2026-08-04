import type { Core } from '@strapi/strapi'

// Only content type with draftAndPublish + a Preview affordance today.
const PREVIEWABLE_UID = 'api::landing-page.landing-page'

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
  preview: {
    enabled: true,
    config: {
      // Frontend origin(s) Strapi trusts for the preview postMessage handshake.
      allowedOrigins: [env('NUXT_PUBLIC_SITE_URL', 'http://localhost:3000')],
      async handler(uid, { documentId, status }) {
        // Single previewable content type, single route per tenant (no slug tree) —
        // no per-uid pathname resolver needed.
        if (uid !== PREVIEWABLE_UID) return null

        const previewSecret = env('PREVIEW_SECRET')
        if (!previewSecret) return null

        const document = await strapi.documents(PREVIEWABLE_UID).findOne({ documentId })
        if (!document?.domain) return null

        const clientUrl = env('NUXT_PUBLIC_SITE_URL', 'http://localhost:3000')
        const params = new URLSearchParams({
          domain: document.domain,
          documentId,
          secret: previewSecret,
          status: status ?? 'published',
        })
        return `${clientUrl}/preview?${params}`
      },
    },
  },
})

export default config
