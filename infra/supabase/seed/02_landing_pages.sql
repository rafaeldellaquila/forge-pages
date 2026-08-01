-- One landing page per client, each on its own *.localhost subdomain so multiple
-- tenants can be tested side-by-side locally (browsers resolve *.localhost to loopback).
-- The Strapi entry for each domain must be created manually with the same `domain`.
insert into public.landing_pages
  (id, client_id, domain, status, seo_title, primary_color, secondary_color, font_family) values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'forge-motos.localhost',
    'published',
    'Forge Motos — Sua moto nova está aqui',
    '#e94560',
    '#065a82',
    'Inter'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'clinica.localhost',
    'published',
    'Clínica Exemplo — Cuidando de você',
    '#0ea5e9',
    '#0f766e',
    'Poppins'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'advocacia.localhost',
    'published',
    'Advocacia Prime — Defesa que faz a diferença',
    '#1e3a5f',
    '#c9a227',
    'Merriweather'
  );

-- Forge Company's own landing page — locally on *.localhost for review before promoting
-- to the real forgecompany.example.com domain in production.
insert into public.landing_pages
  (id, client_id, domain, status, seo_title, primary_color, secondary_color, font_family, secondary_font_family) values
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'forgecompany.localhost',
    'published',
    'Forge Co. — Marketing forjado sob medida',
    '#FF6A2C',
    '#FFBA4A',
    'Montserrat',
    'JetBrains Mono'
  );
