/**
 * Seed published Landing Page content into Strapi for local multi-tenant testing.
 *
 * Runs inside the Strapi app context (no API token needed) and uses the Document
 * Service with `status: 'published'` — the only reliable way to create *published*
 * entries programmatically on Strapi 5 (the REST content API creates drafts only).
 *
 * This script is the source of truth for the local demo content: each run REPLACES the
 * entry for every domain below (delete + recreate) so edits here always take effect.
 * Each `domain` must match a published `landing_pages.domain` row in Supabase for the
 * Nuxt tenant to resolve — see infra/supabase/seed/02_landing_pages.sql.
 *
 *   cd apps/cms && node scripts/seed-content.cjs
 */
const { compileStrapi, createStrapi } = require('@strapi/strapi')

const UID = 'api::landing-page.landing-page'

const wa = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`

/** A complete basic landing-page layout composed from the shared block library. */
function buildBlocks(c) {
  return [
    {
      __component: 'blocks.header',
      menuLinks: c.menu,
      ctaLabel: c.header.ctaLabel,
      ctaWhatsapp: c.whatsapp,
      ctaMessage: c.header.ctaMessage,
    },
    {
      __component: 'blocks.hero',
      badgeText: c.hero.badge,
      headline: c.hero.headline,
      subheadline: c.hero.subheadline,
      ctaPrimaryLabel: c.hero.ctaPrimaryLabel,
      ctaPrimaryLink: '#contato',
      ctaSecondaryLabel: 'Falar no WhatsApp',
      ctaSecondaryLink: wa(c.whatsapp, c.hero.waMessage),
      imageAlt: c.hero.imageAlt,
    },
    { __component: 'blocks.trust-icons', items: c.trust },
    { __component: 'blocks.stats', items: c.stats },
    {
      __component: 'blocks.value-proposition',
      headline: c.value.headline,
      text: c.value.text,
      cards: c.value.cards,
    },
    {
      __component: 'blocks.differentials',
      headline: c.differentials.headline,
      text: c.differentials.text,
      items: c.differentials.items,
    },
    { __component: 'blocks.testimonials', headline: c.testimonials.headline, items: c.testimonials.items },
    {
      __component: 'blocks.cta-form',
      headline: c.form.headline,
      subheadline: c.form.subheadline,
      selectOptions: c.form.options,
      ctaLabel: c.form.ctaLabel,
      whatsappNumber: c.whatsapp,
      whatsappMessage: c.form.waMessage,
    },
    {
      __component: 'blocks.footer',
      description: c.footer.description,
      links: c.menu,
      phones: [{ label: 'Atendimento', number: c.phone }],
      schedule: c.footer.schedule,
      socialLinks: c.footer.social,
      copyright: `© 2026 ${c.name}. Todos os direitos reservados.`,
      privacyLink: '/privacidade',
    },
  ]
}

const clients = [
  {
    domain: 'forge-motos.localhost',
    name: 'Forge Motos',
    seoTitle: 'Forge Motos — Sua moto nova está aqui',
    seoDescription: 'Concessionária de motos com as melhores condições e entrega imediata.',
    primaryColor: '#e94560',
    secondaryColor: '#065a82',
    fontFamily: 'Inter',
    whatsapp: '5511999999001',
    phone: '(11) 99999-9001',
    menu: [
      { label: 'Modelos', url: '#modelos' },
      { label: 'Diferenciais', url: '#diferenciais' },
      { label: 'Depoimentos', url: '#depoimentos' },
      { label: 'Contato', url: '#contato' },
    ],
    header: { ctaLabel: 'Fale conosco', ctaMessage: 'Olá! Quero saber sobre as motos disponíveis.' },
    hero: {
      badge: 'Linha 2026 disponível',
      headline: 'Sua próxima moto está na Forge Motos',
      subheadline: 'Modelos 0km com condições exclusivas, financiamento em minutos e entrega imediata.',
      ctaPrimaryLabel: 'Ver ofertas',
      waMessage: 'Olá! Quero saber sobre as motos disponíveis.',
      imageAlt: 'Moto esportiva vermelha em destaque',
    },
    trust: [
      { icon: '🏍️', text: 'Mais de 40 modelos' },
      { icon: '⚡', text: 'Entrega imediata' },
      { icon: '🛡️', text: 'Garantia de fábrica' },
      { icon: '💳', text: 'Financiamento próprio' },
    ],
    stats: [
      { number: '15+', label: 'Anos de mercado' },
      { number: '12k', label: 'Motos entregues' },
      { number: '4.9', label: 'Nota dos clientes' },
      { number: '48h', label: 'Aprovação de crédito' },
    ],
    value: {
      headline: 'Por que comprar na Forge Motos',
      text: 'Da escolha à entrega, cuidamos de cada detalhe para você sair pilotando.',
      cards: [
        { icon: '💰', title: 'Melhor preço', description: 'Condições exclusivas e parcelamento que cabe no seu bolso.' },
        { icon: '📄', title: 'Sem burocracia', description: 'Documentação e financiamento resolvidos no mesmo dia.' },
        { icon: '🔧', title: 'Revisão inclusa', description: 'Primeira revisão gratuita e assistência dedicada.' },
      ],
    },
    differentials: {
      headline: 'Nossos diferenciais',
      text: 'O que faz da Forge Motos a escolha certa.',
      items: [
        { icon: '✅', text: 'Estoque com pronta entrega' },
        { icon: '✅', text: 'Test-ride agendado' },
        { icon: '✅', text: 'Seguro com desconto' },
        { icon: '✅', text: 'Troca com avaliação justa' },
      ],
    },
    testimonials: {
      headline: 'O que dizem nossos clientes',
      items: [
        { name: 'Carlos Mendes', role: 'Cliente desde 2022', text: 'Comprei minha moto em um dia. Atendimento impecável!', rating: 5 },
        { name: 'Fernanda Lima', role: 'Motociclista', text: 'Melhor condição de financiamento que encontrei. Recomendo.', rating: 5 },
      ],
    },
    form: {
      headline: 'Fale com um consultor',
      subheadline: 'Deixe seus dados e retornamos com a melhor condição para você.',
      options: [
        { label: 'Motos de rua', value: 'street' },
        { label: 'Motos esportivas', value: 'sport' },
        { label: 'Scooters', value: 'scooter' },
      ],
      ctaLabel: 'Quero uma proposta',
      waMessage: 'Olá! Recebi seu contato pelo site da Forge Motos.',
    },
    footer: {
      description: 'Concessionária multimarcas com as melhores condições do mercado.',
      schedule: 'Seg a Sáb, 9h às 18h',
      social: [
        { platform: 'Instagram', url: 'https://instagram.com' },
        { platform: 'Facebook', url: 'https://facebook.com' },
      ],
    },
  },
  {
    domain: 'clinica.localhost',
    name: 'Clínica Exemplo',
    seoTitle: 'Clínica Exemplo — Cuidando de você',
    seoDescription: 'Atendimento médico humanizado com especialistas e agendamento online.',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0f766e',
    fontFamily: 'Poppins',
    whatsapp: '5511999999002',
    phone: '(11) 99999-9002',
    menu: [
      { label: 'Especialidades', url: '#especialidades' },
      { label: 'Sobre', url: '#sobre' },
      { label: 'Depoimentos', url: '#depoimentos' },
      { label: 'Agendar', url: '#contato' },
    ],
    header: { ctaLabel: 'Agendar consulta', ctaMessage: 'Olá! Gostaria de agendar uma consulta.' },
    hero: {
      badge: 'Agendamento online',
      headline: 'Cuidado que você merece',
      subheadline: 'Especialistas em diversas áreas, exames no local e atendimento humanizado para toda a família.',
      ctaPrimaryLabel: 'Agendar consulta',
      waMessage: 'Olá! Gostaria de agendar uma consulta na Clínica Exemplo.',
      imageAlt: 'Equipe médica sorrindo em consultório',
    },
    trust: [
      { icon: '🩺', text: 'Especialistas certificados' },
      { icon: '🏥', text: 'Estrutura completa' },
      { icon: '📅', text: 'Agendamento online' },
      { icon: '❤️', text: 'Atendimento humanizado' },
    ],
    stats: [
      { number: '20+', label: 'Especialidades' },
      { number: '50k', label: 'Pacientes atendidos' },
      { number: '4.8', label: 'Satisfação' },
      { number: '10', label: 'Unidades' },
    ],
    value: {
      headline: 'Por que escolher a Clínica Exemplo',
      text: 'Saúde de qualidade, perto de você e no seu tempo.',
      cards: [
        { icon: '👩‍⚕️', title: 'Time especializado', description: 'Profissionais experientes em cada área da medicina.' },
        { icon: '🔬', title: 'Exames no local', description: 'Diagnóstico rápido sem precisar se deslocar.' },
        { icon: '📱', title: 'Tudo online', description: 'Agende, remarque e receba resultados pelo celular.' },
      ],
    },
    differentials: {
      headline: 'Nossos diferenciais',
      text: 'O cuidado que faz diferença na sua saúde.',
      items: [
        { icon: '✅', text: 'Consultas no mesmo dia' },
        { icon: '✅', text: 'Convênios aceitos' },
        { icon: '✅', text: 'Telemedicina disponível' },
        { icon: '✅', text: 'Prontuário digital' },
      ],
    },
    testimonials: {
      headline: 'Histórias de quem confia na gente',
      items: [
        { name: 'Ana Souza', role: 'Paciente', text: 'Atendimento atencioso e sem filas. Me senti muito bem cuidada.', rating: 5 },
        { name: 'Roberto Dias', role: 'Paciente', text: 'Consegui consulta e exame no mesmo dia. Excelente!', rating: 5 },
      ],
    },
    form: {
      headline: 'Agende sua consulta',
      subheadline: 'Informe a especialidade desejada e entraremos em contato.',
      options: [
        { label: 'Clínica Geral', value: 'general' },
        { label: 'Cardiologia', value: 'cardio' },
        { label: 'Pediatria', value: 'pediatrics' },
      ],
      ctaLabel: 'Agendar agora',
      waMessage: 'Olá! Gostaria de agendar uma consulta na Clínica Exemplo.',
    },
    footer: {
      description: 'Clínica médica multidisciplinar com atendimento humanizado.',
      schedule: 'Seg a Sex, 7h às 20h · Sáb, 8h às 12h',
      social: [
        { platform: 'Instagram', url: 'https://instagram.com' },
        { platform: 'LinkedIn', url: 'https://linkedin.com' },
      ],
    },
  },
  {
    domain: 'advocacia.localhost',
    name: 'Advocacia Prime',
    seoTitle: 'Advocacia Prime — Defesa que faz a diferença',
    seoDescription: 'Escritório de advocacia com atuação estratégica e atendimento personalizado.',
    primaryColor: '#1e3a5f',
    secondaryColor: '#c9a227',
    fontFamily: 'Merriweather',
    whatsapp: '5511999999003',
    phone: '(11) 99999-9003',
    menu: [
      { label: 'Áreas de atuação', url: '#areas' },
      { label: 'O escritório', url: '#sobre' },
      { label: 'Depoimentos', url: '#depoimentos' },
      { label: 'Contato', url: '#contato' },
    ],
    header: { ctaLabel: 'Solicitar consultoria', ctaMessage: 'Olá! Gostaria de uma consultoria jurídica.' },
    hero: {
      badge: 'Atendimento personalizado',
      headline: 'Defesa jurídica de excelência',
      subheadline: 'Atuação estratégica em direito civil, trabalhista e empresarial, com foco em resultados.',
      ctaPrimaryLabel: 'Solicitar consultoria',
      waMessage: 'Olá! Gostaria de uma consultoria com a Advocacia Prime.',
      imageAlt: 'Advogado em reunião com cliente',
    },
    trust: [
      { icon: '⚖️', text: 'Atuação estratégica' },
      { icon: '🤝', text: 'Atendimento próximo' },
      { icon: '📚', text: 'Ampla experiência' },
      { icon: '🔒', text: 'Sigilo garantido' },
    ],
    stats: [
      { number: '25+', label: 'Anos de atuação' },
      { number: '3k', label: 'Casos conduzidos' },
      { number: '92%', label: 'Índice de êxito' },
      { number: '8', label: 'Áreas do direito' },
    ],
    value: {
      headline: 'Por que a Advocacia Prime',
      text: 'Compromisso, técnica e proximidade em cada caso.',
      cards: [
        { icon: '🎯', title: 'Estratégia sob medida', description: 'Cada caso recebe um plano jurídico personalizado.' },
        { icon: '💬', title: 'Comunicação clara', description: 'Você acompanha cada etapa do seu processo.' },
        { icon: '🏆', title: 'Resultados comprovados', description: 'Histórico sólido de decisões favoráveis.' },
      ],
    },
    differentials: {
      headline: 'Nossos diferenciais',
      text: 'O que nos torna referência.',
      items: [
        { icon: '✅', text: 'Primeira reunião sem custo' },
        { icon: '✅', text: 'Equipe multidisciplinar' },
        { icon: '✅', text: 'Atendimento 100% digital' },
        { icon: '✅', text: 'Honorários transparentes' },
      ],
    },
    testimonials: {
      headline: 'Clientes que confiaram em nós',
      items: [
        { name: 'Marina Costa', role: 'Empresária', text: 'Resolveram uma questão trabalhista complexa com maestria.', rating: 5 },
        { name: 'João Pereira', role: 'Cliente', text: 'Transparência do início ao fim. Recomendo de olhos fechados.', rating: 5 },
      ],
    },
    form: {
      headline: 'Solicite uma consultoria',
      subheadline: 'Conte seu caso e um de nossos advogados entrará em contato.',
      options: [
        { label: 'Direito Civil', value: 'civil' },
        { label: 'Direito Trabalhista', value: 'labor' },
        { label: 'Direito Empresarial', value: 'business' },
      ],
      ctaLabel: 'Falar com um advogado',
      waMessage: 'Olá! Gostaria de uma consultoria com a Advocacia Prime.',
    },
    footer: {
      description: 'Escritório de advocacia full-service com atuação em todo o país.',
      schedule: 'Seg a Sex, 9h às 19h',
      social: [
        { platform: 'LinkedIn', url: 'https://linkedin.com' },
        { platform: 'Instagram', url: 'https://instagram.com' },
      ],
    },
  },
]

async function main() {
  const app = await createStrapi(await compileStrapi()).load()
  app.log.level = 'error'

  try {
    for (const c of clients) {
      const existing = await app.documents(UID).findMany({
        filters: { domain: c.domain },
        status: 'draft',
        fields: ['documentId'],
      })
      for (const doc of existing) {
        await app.documents(UID).delete({ documentId: doc.documentId })
      }

      const data = {
        domain: c.domain,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        primaryColor: c.primaryColor,
        secondaryColor: c.secondaryColor,
        fontFamily: c.fontFamily,
        blocks: buildBlocks(c),
      }
      await app.documents(UID).create({ data, status: 'published' })

      const verb = existing.length > 0 ? 'replace' : 'create '
      process.stdout.write(`${verb} ${c.domain} (published, ${data.blocks.length} blocks)\n`)
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
