import type { Core } from '@strapi/strapi'

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
]

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
]

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  // Falls back to Strapi's local disk provider until Supabase Storage S3
  // credentials are configured (see the root .env.example) — otherwise every
  // upload hits the S3 client with empty credentials and fails.
  const hasSupabaseS3Credentials = Boolean(env('SUPABASE_S3_ACCESS_KEY_ID'))

  return {
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        sessions: {
          httpOnly: true,
        },
      },
    },
    upload: {
      config: hasSupabaseS3Credentials
        ? {
            provider: 'aws-s3',
            providerOptions: {
              // Supabase's public object URL is /object/public/<bucket>/<key> —
              // the provider only appends the file key to baseUrl, so the
              // bucket must be folded in here rather than left to SUPABASE_S3_BASE_URL.
              baseUrl: `${env('SUPABASE_S3_BASE_URL')}/${env('SUPABASE_S3_BUCKET', 'landing-page-assets')}`,
              s3Options: {
                endpoint: env('SUPABASE_S3_ENDPOINT'),
                region: env('SUPABASE_S3_REGION', 'sa-east-1'),
                forcePathStyle: true,
                credentials: {
                  accessKeyId: env('SUPABASE_S3_ACCESS_KEY_ID'),
                  secretAccessKey: env('SUPABASE_S3_SECRET_ACCESS_KEY'),
                },
                params: {
                  Bucket: env('SUPABASE_S3_BUCKET', 'landing-page-assets'),
                },
              },
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
            security: {
              allowedTypes: allowedMediaTypes,
              deniedTypes: deniedExecutableTypes,
            },
          }
        : {
            security: {
              allowedTypes: allowedMediaTypes,
              deniedTypes: deniedExecutableTypes,
            },
          },
    },
  }
}

export default config
