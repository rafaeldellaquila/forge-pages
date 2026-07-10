/**
 * Seed published Landing Page content into Strapi for local multi-tenant testing.
 *
 * Runs inside the Strapi app context (no API token needed) and uses the Document
 * Service with `status: 'published'` — the only reliable way to create *published*
 * entries programmatically on Strapi 5 (the REST content API creates drafts only).
 *
 * Idempotent: skips any domain that already has an entry. Each `domain` must match a
 * published `landing_pages.domain` row in Supabase for the Nuxt tenant to resolve.
 *
 *   cd apps/cms && node scripts/seed-content.cjs
 */
const { compileStrapi, createStrapi } = require('@strapi/strapi')

const UID = 'api::landing-page.landing-page'

const wa = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`

const tenants = [
  {
    domain: 'forge-motos.localhost',
    seoTitle: 'Forge Motos — Sua moto nova está aqui',
    seoDescription: 'Concessionária de motos com as melhores condições e entrega imediata.',
    primaryColor: '#e94560',
    secondaryColor: '#065a82',
    fontFamily: 'Inter',
    blocks: [
      {
        __component: 'blocks.hero',
        badgeText: 'Linha 2026 disponível',
        headline: 'Sua próxima moto está na Forge Motos',
        subheadline:
          'Modelos 0km com condições exclusivas, financiamento em minutos e entrega imediata.',
        ctaPrimaryLabel: 'Ver ofertas',
        ctaPrimaryLink: '#ofertas',
        ctaSecondaryLabel: 'Falar no WhatsApp',
        ctaSecondaryLink: wa('5511999999001', 'Olá! Quero saber sobre as motos disponíveis.'),
        imageAlt: 'Moto esportiva vermelha em destaque',
      },
      {
        __component: 'blocks.cta-form',
        headline: 'Fale com um consultor',
        subheadline: 'Deixe seus dados e retornamos com a melhor condição para você.',
        selectOptions: [
          { label: 'Motos de rua', value: 'street' },
          { label: 'Motos esportivas', value: 'sport' },
          { label: 'Scooters', value: 'scooter' },
        ],
        ctaLabel: 'Quero uma proposta',
        whatsappNumber: '5511999999001',
        whatsappMessage: 'Olá! Recebi seu contato pelo site da Forge Motos.',
      },
    ],
  },
  {
    domain: 'clinica.localhost',
    seoTitle: 'Clínica Exemplo — Cuidando de você',
    seoDescription: 'Atendimento médico humanizado com especialistas e agendamento online.',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0f766e',
    fontFamily: 'Poppins',
    blocks: [
      {
        __component: 'blocks.hero',
        badgeText: 'Agendamento online',
        headline: 'Cuidado que você merece',
        subheadline:
          'Especialistas em diversas áreas, exames no local e atendimento humanizado para toda a família.',
        ctaPrimaryLabel: 'Agendar consulta',
        ctaPrimaryLink: '#agendar',
        ctaSecondaryLabel: 'Nossas especialidades',
        ctaSecondaryLink: '#especialidades',
        imageAlt: 'Equipe médica sorrindo em consultório',
      },
      {
        __component: 'blocks.cta-form',
        headline: 'Agende sua consulta',
        subheadline: 'Informe a especialidade desejada e entraremos em contato.',
        selectOptions: [
          { label: 'Clínica Geral', value: 'general' },
          { label: 'Cardiologia', value: 'cardio' },
          { label: 'Pediatria', value: 'pediatrics' },
        ],
        ctaLabel: 'Agendar agora',
        whatsappNumber: '5511999999002',
        whatsappMessage: 'Olá! Gostaria de agendar uma consulta na Clínica Exemplo.',
      },
    ],
  },
  {
    domain: 'advocacia.localhost',
    seoTitle: 'Advocacia Prime — Defesa que faz a diferença',
    seoDescription: 'Escritório de advocacia com atuação estratégica e atendimento personalizado.',
    primaryColor: '#1e3a5f',
    secondaryColor: '#c9a227',
    fontFamily: 'Merriweather',
    blocks: [
      {
        __component: 'blocks.hero',
        badgeText: 'Atendimento personalizado',
        headline: 'Defesa jurídica de excelência',
        subheadline:
          'Atuação estratégica em direito civil, trabalhista e empresarial, com foco em resultados.',
        ctaPrimaryLabel: 'Solicitar consultoria',
        ctaPrimaryLink: '#consultoria',
        ctaSecondaryLabel: 'Áreas de atuação',
        ctaSecondaryLink: '#areas',
        imageAlt: 'Advogado em reunião com cliente',
      },
      {
        __component: 'blocks.cta-form',
        headline: 'Solicite uma consultoria',
        subheadline: 'Conte seu caso e um de nossos advogados entrará em contato.',
        selectOptions: [
          { label: 'Direito Civil', value: 'civil' },
          { label: 'Direito Trabalhista', value: 'labor' },
          { label: 'Direito Empresarial', value: 'business' },
        ],
        ctaLabel: 'Falar com um advogado',
        whatsappNumber: '5511999999003',
        whatsappMessage: 'Olá! Gostaria de uma consultoria com a Advocacia Prime.',
      },
    ],
  },
]

async function main() {
  const app = await createStrapi(await compileStrapi()).load()
  app.log.level = 'error'

  try {
    for (const tenant of tenants) {
      const existing = await app.documents(UID).findMany({
        filters: { domain: tenant.domain },
        status: 'draft',
        fields: ['domain'],
      })

      if (existing.length > 0) {
        process.stdout.write(`= skip   ${tenant.domain} (already exists)\n`)
        continue
      }

      await app.documents(UID).create({ data: tenant, status: 'published' })
      process.stdout.write(`+ create ${tenant.domain} (published, ${tenant.blocks.length} blocks)\n`)
    }
  } finally {
    // Teardown can abort background tasks when a dev server shares the DB — ignore it.
    await app.destroy().catch(() => {})
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    process.stderr.write(`${err?.stack || err}\n`)
    process.exit(1)
  },
)
