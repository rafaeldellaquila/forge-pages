-- One landing page per client, each on its own *.localhost subdomain so multiple
-- tenants can be tested side-by-side locally (browsers resolve *.localhost to loopback).
-- Content lives in the `blocks` JSONB column; the shape is defined by
-- lib/types/blocks.ts and validated by lib/schemas/blocks.ts.
--
-- Only forge-motos gets a populated `blocks` array below — it is the reference
-- shape for the renderer. The others intentionally keep the `'[]'` default, which
-- renders a themed-but-empty page (useful for testing the empty state). Real
-- tenant content is authored in Supabase Studio.
insert into public.landing_pages
  (id, client_id, domain, status, seo_title, primary_color, secondary_color, font_family, blocks) values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'forge-motos.localhost',
    'published',
    'Forge Motos — Sua moto nova está aqui',
    '#e94560',
    '#065a82',
    'Inter',
    '[
      {
        "type": "hero",
        "variant": "default",
        "badgeText": "Financiamento em até 48x",
        "headline": "Sua próxima moto está aqui",
        "subheadline": "Seminovas revisadas, com garantia de 12 meses e entrada a partir de R$ 2.000.",
        "ctaPrimaryLabel": "Ver estoque",
        "ctaPrimaryLink": "#estoque",
        "ctaSecondaryLabel": "Falar com um consultor",
        "ctaSecondaryLink": "#contato"
      },
      {
        "type": "trust-icons",
        "items": [
          { "icon": "shield", "text": "Garantia de 12 meses" },
          { "icon": "wrench", "text": "Revisão completa inclusa" },
          { "icon": "file-text", "text": "Documentação sem custo" }
        ]
      },
      {
        "type": "cta-form",
        "headline": "Receba as ofertas da semana",
        "subheadline": "Deixe seu WhatsApp que um consultor entra em contato.",
        "selectOptions": [
          { "label": "Quero comprar", "value": "comprar" },
          { "label": "Quero vender a minha", "value": "vender" }
        ],
        "ctaLabel": "Quero receber",
        "whatsappNumber": "5511999999999",
        "whatsappMessage": "Olá! Vi a página e quero saber mais sobre as motos disponíveis."
      }
    ]'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'clinica.localhost',
    'published',
    'Clínica Exemplo — Cuidando de você',
    '#0ea5e9',
    '#0f766e',
    'Poppins',
    '[]'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'advocacia.localhost',
    'published',
    'Advocacia Prime — Defesa que faz a diferença',
    '#1e3a5f',
    '#c9a227',
    'Merriweather',
    '[]'::jsonb
  );

-- Forge Company's own landing page — locally on *.localhost for review before promoting
-- to the real forgecompany.example.com domain in production.
--
-- Content ported from forge-company/forge_company_apresentacao.html (Fase 1): the six
-- sections of that page become eight blocks here. The header carries no `background`, so
-- it takes the glass fallback in lib/background.ts; the hero opts into the ember particle
-- effect (ADR-0005) and the page background is `fine-line-texture`, which reproduces the
-- source's radial glow over a hairline weave.
--
-- The cta-form's whatsappNumber is still the placeholder from 01_clients.sql — replace it
-- before this row is promoted to the real domain.
insert into public.landing_pages
  (id, client_id, domain, status, seo_title, seo_description,
   primary_color, secondary_color, font_family, secondary_font_family,
   background_type, background_color_token, background_color_custom, divider_glyph, blocks) values
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'forgecompany.localhost',
    'published',
    'Forge Co. — Marketing forjado sob medida',
    'Marketing digital forjado, não copiado. Estratégia, tráfego pago e criativos feitos sob medida para o seu negócio.',
    '#FF6A2C',
    '#FFBA4A',
    'Montserrat',
    'JetBrains Mono',
    'fine-line-texture',
    'custom',
    '#141009',
    '⚒',
    '[
      {
        "type": "header",
        "variant": "default",
        "logo": { "url": "/brand/logo_negative.svg", "alternativeText": "Forge Co. — Built to Convert" },
        "menuLinks": [
          { "label": "Manifesto", "url": "#manifesto" },
          { "label": "Processo", "url": "#processo" },
          { "label": "Pacotes", "url": "#pacotes" },
          { "label": "Setores", "url": "#setores" }
        ],
        "ctaLabel": "Forjar proposta 🔥",
        "ctaLink": "#contato"
      },
      {
        "type": "hero",
        "anchorId": "hero",
        "variant": "centered",
        "background": { "type": "transparent", "effect": "particles" },
        "image": { "url": "/brand/logo_negative.svg", "alternativeText": "Forge Co. — Built to Convert" },
        "headline": "Marketing forjado sob medida",
        "subheadline": "Marketing digital forjado, não copiado. Estratégia, tráfego pago e criativos feitos sob medida para o seu negócio — sem propostas de prateleira.",
        "ctaPrimaryLabel": "Ver pacotes ⚒️",
        "ctaPrimaryLink": "#pacotes",
        "ctaSecondaryLabel": "Falar com a gente",
        "ctaSecondaryLink": "#contato"
      },
      {
        "type": "differentials",
        "anchorId": "manifesto",
        "eyebrow": "🔥 Por que Forge Company",
        "headline": "Toda agência promete personalização. Quase nenhuma entrega.",
        "text": "A maioria dos materiais comerciais de marketing sai de um molde pronto: mesmos slides, mesmas promessas, mesmo discurso — só troca a logo. O cliente sente na hora.\n\nNa Forge Company, cada proposta é forjada depois de entendermos suas dores reais: seu histórico de anúncios, seu material atual e o que já foi tentado. O calor certo, aplicado no lugar certo.",
        "items": [
          { "tag": "SEM", "text": "apresentação genérica de 80 slides que ninguém lê" },
          { "tag": "SEM", "text": "pacote fechado que ignora o seu momento de negócio" },
          { "tag": "SEM", "text": "promessa de resultado sem antes olhar seus dados" },
          { "tag": "COM", "text": "diagnóstico real antes de qualquer plano de ação ✅" }
        ]
      },
      {
        "type": "value-proposition",
        "anchorId": "processo",
        "eyebrow": "⚒️ Como forjamos",
        "headline": "Do minério à peça pronta",
        "text": "Um processo com quatro etapas de calor crescente — cada uma existe para que a etapa seguinte funcione de verdade.",
        "cards": [
          {
            "stepLabel": "01 · MINÉRIO",
            "icon": "🔍",
            "title": "Diagnóstico",
            "description": "Analisamos suas contas de anúncio, materiais digitais e concorrência — inclusive com cliente oculto, quando faz sentido."
          },
          {
            "stepLabel": "02 · AQUECIMENTO",
            "icon": "🧭",
            "title": "Plano de ação",
            "description": "Transformamos o diagnóstico em um plano de ação claro, com prioridades — nada de recomendação genérica."
          },
          {
            "stepLabel": "03 · FORJA",
            "icon": "🛠️",
            "title": "Execução",
            "description": "Estratégia, tráfego pago e criativos entram em campo, construídos para as dores específicas identificadas."
          },
          {
            "stepLabel": "04 · TÊMPERA",
            "icon": "📈",
            "title": "Otimização",
            "description": "Acompanhamento contínuo, ajustando o que precisa antes que vire problema — a peça só sai pronta depois de testada."
          }
        ]
      },
      {
        "type": "pricing",
        "anchorId": "pacotes",
        "eyebrow": "💰 O que forjamos para você",
        "headline": "Pacotes",
        "subheadline": "Dois pontos de entrada. Nenhum deles é fechado no molde — o escopo final é ajustado depois de entendermos sua operação.",
        "plans": [
          {
            "badge": "Mais procurado",
            "eyebrow": "Operação contínua",
            "title": "Pacote Base",
            "description": "O motor de aquisição do seu negócio rodando todo mês: estratégia, verba de mídia bem aplicada e criativos que convertem.",
            "price": "R$ 2.000 / mês",
            "features": [
              { "text": "Estratégia de marketing sob medida" },
              { "text": "Gestão de tráfego pago (Meta / Google)" },
              { "text": "Criativos voltados para performance" },
              { "text": "Acompanhamento e relatórios periódicos" }
            ],
            "ctaLabel": "Quero esse pacote 🔥",
            "ctaLink": "#contato",
            "featured": true
          },
          {
            "eyebrow": "Diagnóstico profundo",
            "title": "Planejamento Estratégico",
            "description": "Uma estruturação completa antes de colocar dinheiro em anúncio: entendemos o que já foi feito para não repetir erro.",
            "price": "Sob consulta",
            "features": [
              { "text": "Análise das contas de anúncio existentes" },
              { "text": "Auditoria do material digital atual" },
              { "text": "Cliente oculto e análise de concorrência" },
              { "text": "Plano de ação priorizado, com próximos passos" }
            ],
            "ctaLabel": "Quero um diagnóstico 🧭",
            "ctaLink": "#contato"
          }
        ],
        "note": "Os dois pacotes são modulares — muitos clientes começam pelo Planejamento Estratégico e migram para o Pacote Base em seguida."
      },
      {
        "type": "value-proposition",
        "anchorId": "setores",
        "eyebrow": "🏭 Onde já colocamos a mão na forja",
        "headline": "Setores atendidos",
        "text": "Times envolvidos em projetos de diferentes naturezas — de imobiliário a estética, de finanças a automotivo.",
        "cards": [
          { "icon": "🏠", "title": "Imobiliário", "description": "Lançamentos & corretoras" },
          { "icon": "💇", "title": "Estética & Saúde", "description": "Clínicas capilares" },
          { "icon": "🏦", "title": "Financeiro", "description": "Bancos digitais" },
          { "icon": "🏍️", "title": "Automotivo", "description": "Concessionárias" }
        ]
      },
      {
        "type": "cta-form",
        "anchorId": "contato",
        "headline": "Vamos forjar o próximo projeto?",
        "subheadline": "Conte pra gente o momento do seu negócio e a gente monta, junto com você, o escopo certo — sem prateleira, sem molde pronto.",
        "selectOptions": [
          { "label": "Imobiliário", "value": "imobiliario" },
          { "label": "Estética & Saúde", "value": "estetica-saude" },
          { "label": "Financeiro", "value": "financeiro" },
          { "label": "Automotivo", "value": "automotivo" },
          { "label": "Outro setor", "value": "outro" }
        ],
        "ctaLabel": "Forjar proposta 🔥",
        "whatsappNumber": "5511900000000",
        "whatsappMessage": "Olá! Vim pelo site da Forge Company e quero forjar uma proposta."
      },
      {
        "type": "footer",
        "links": [],
        "phones": [],
        "socialLinks": [],
        "copyright": "FORGE CO. — MARKETING FORJADO SOB MEDIDA · © 2026"
      }
    ]'::jsonb
  );
