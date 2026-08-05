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
insert into public.landing_pages
  (id, client_id, domain, status, seo_title, primary_color, secondary_color, font_family, secondary_font_family,
   background_type, background_color_token, background_color_custom, divider_glyph) values
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'forgecompany.localhost',
    'published',
    'Forge Co. — Marketing forjado sob medida',
    '#FF6A2C',
    '#FFBA4A',
    'Montserrat',
    'JetBrains Mono',
    'solid',
    'custom',
    '#141009',
    '⚒'
  );
