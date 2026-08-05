// Runtime validation for the `landing_pages.blocks` JSONB array. Mirrors the
// interfaces in lib/types/blocks.ts — the two are edited together (CLAUDE.md §10).
//
// Two failure modes, deliberately different (ADR-0002 rule 2 vs CLAUDE.md §6):
//   - an unrecognised `variant` degrades to 'default', because content can be
//     published ahead of the deploy that renders it;
//   - anything else fails loudly, because the sole editor is technical and a
//     silently missing section on a paying client's page is the worse outcome.

import { z } from 'zod'

const imageSchema = z.object({
  url: z.string().min(1),
  alternativeText: z.string().optional(),
})

const backgroundColorTokenSchema = z.enum(['primary', 'secondary', 'custom'])

const backgroundSchema = z.object({
  type: z
    .enum(['transparent', 'solid', 'gradient', 'image', 'fine-line-texture', 'glass'])
    .optional(),
  colorToken: backgroundColorTokenSchema.optional(),
  customColor: z.string().optional(),
  gradientToToken: backgroundColorTokenSchema.optional(),
  gradientToCustom: z.string().optional(),
  image: imageSchema.optional(),
  effect: z.enum(['none', 'particles']).optional(),
})

// `.catch()` swallows an unknown value; `.default()` supplies one when the field
// is absent. Both land on 'default', which every block treats as its base layout.
const variantSchema = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).catch('default').default('default')

const headerSchema = z.object({
  type: z.literal('header'),
  variant: variantSchema(['default', 'centered']),
  background: backgroundSchema.optional(),
  logo: imageSchema.optional(),
  menuLinks: z.array(z.object({ label: z.string(), url: z.string() })),
  ctaLabel: z.string(),
  ctaWhatsapp: z.string().optional(),
  ctaMessage: z.string().optional(),
  ctaLink: z.string().optional(),
})

const heroSchema = z.object({
  type: z.literal('hero'),
  anchorId: z.string().optional(),
  variant: variantSchema(['default', 'centered']),
  background: backgroundSchema.optional(),
  badgeText: z.string().optional(),
  headline: z.string(),
  subheadline: z.string(),
  ctaPrimaryLabel: z.string(),
  ctaPrimaryLink: z.string(),
  ctaSecondaryLabel: z.string().optional(),
  ctaSecondaryLink: z.string().optional(),
  image: imageSchema.optional(),
  imageAlt: z.string().optional(),
})

const trustIconsSchema = z.object({
  type: z.literal('trust-icons'),
  items: z.array(z.object({ icon: z.string(), text: z.string() })),
})

const statsSchema = z.object({
  type: z.literal('stats'),
  items: z.array(z.object({ number: z.string(), label: z.string() })),
})

const valuePropositionSchema = z.object({
  type: z.literal('value-proposition'),
  anchorId: z.string().optional(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  text: z.string().optional(),
  cards: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
      stepLabel: z.string().optional(),
    }),
  ),
})

const servicesSchema = z.object({
  type: z.literal('services'),
  headline: z.string(),
  tabs: z.array(
    z.object({
      label: z.string(),
      title: z.string(),
      text: z.string(),
      ctaLabel: z.string().optional(),
      ctaLink: z.string().optional(),
      image: imageSchema.optional(),
    }),
  ),
})

const differentialsSchema = z.object({
  type: z.literal('differentials'),
  anchorId: z.string().optional(),
  background: backgroundSchema.optional(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  text: z.string().optional(),
  items: z.array(
    z.object({
      icon: z.string().optional(),
      tag: z.string().optional(),
      text: z.string(),
    }),
  ),
})

const testimonialsSchema = z.object({
  type: z.literal('testimonials'),
  headline: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      photo: imageSchema.optional(),
      text: z.string(),
      rating: z.number().min(0).max(5).optional(),
    }),
  ),
})

const ctaFormSchema = z.object({
  type: z.literal('cta-form'),
  anchorId: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  selectOptions: z.array(z.object({ label: z.string(), value: z.string() })),
  ctaLabel: z.string(),
  whatsappNumber: z.string(),
  whatsappMessage: z.string().optional(),
})

const footerSchema = z.object({
  type: z.literal('footer'),
  logo: imageSchema.optional(),
  description: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
  phones: z.array(z.object({ label: z.string().optional(), number: z.string() })),
  schedule: z.string().optional(),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })),
  copyright: z.string(),
  privacyLink: z.string().optional(),
})

const pricingSchema = z.object({
  type: z.literal('pricing'),
  anchorId: z.string().optional(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  plans: z.array(
    z.object({
      badge: z.string().optional(),
      eyebrow: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      price: z.string(),
      features: z.array(z.object({ text: z.string() })),
      ctaLabel: z.string(),
      ctaLink: z.string(),
      featured: z.boolean().optional(),
    }),
  ),
  note: z.string().optional(),
})

export const blockSchema = z.discriminatedUnion('type', [
  headerSchema,
  heroSchema,
  trustIconsSchema,
  statsSchema,
  valuePropositionSchema,
  servicesSchema,
  differentialsSchema,
  testimonialsSchema,
  ctaFormSchema,
  footerSchema,
  pricingSchema,
])

export const blocksSchema = z.array(blockSchema)

export const backgroundColumnSchema = backgroundSchema

/**
 * Validates the raw `blocks` JSONB for one tenant. Throws with the offending
 * JSON path so a malformed edit in Supabase Studio is traceable, rather than
 * rendering a silently broken page.
 */
export function parseBlocks(raw: unknown, domain: string) {
  const result = blocksSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `blocks.${issue.path.join('.')}: ${issue.message}`)
      .join('\n  ')

    throw new Error(`Invalid blocks JSON for tenant "${domain}":\n  ${issues}`)
  }

  return result.data
}
