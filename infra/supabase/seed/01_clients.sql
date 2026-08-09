insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000001', 'Forge Motos', 'contato@forgemotos.com.br', '5511999999001'),
  ('00000000-0000-0000-0000-000000000002', 'Clínica Exemplo', 'contato@clinicaexemplo.com.br', '5511999999002'),
  ('00000000-0000-0000-0000-000000000003', 'Advocacia Prime', 'contato@advocaciaprime.com.br', '5511999999003');

-- Forge Company itself — the agency's own landing page, not a client demo.
-- whatsapp is a placeholder pending Fase E (see CLAUDE.md); replace before publishing to prod.
insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000004', 'Forge Company', 'contato@forgecompany.example.com', '5511900000000');

-- Fase 3: second and third tenants (real domain + fictional demo). Both
-- whatsapp numbers are placeholders, same convention as every row above —
-- replace before promoting either row to its real domain (Fase 4).
insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000005', 'Rafael Dellaquila', 'rafael@dellaquila.dev', '5511900000001'),
  ('00000000-0000-0000-0000-000000000006', 'Horizonte Imóveis', 'contato@horizonteimoveis.com.br', '5511900000002');
