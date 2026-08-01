insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000001', 'Forge Motos', 'contato@forgemotos.com.br', '5511999999001'),
  ('00000000-0000-0000-0000-000000000002', 'Clínica Exemplo', 'contato@clinicaexemplo.com.br', '5511999999002'),
  ('00000000-0000-0000-0000-000000000003', 'Advocacia Prime', 'contato@advocaciaprime.com.br', '5511999999003');

-- Forge Company itself — the agency's own landing page, not a client demo.
-- whatsapp is a placeholder pending Fase E (see CLAUDE.md); replace before publishing to prod.
insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000004', 'Forge Company', 'contato@forgecompany.example.com', '5511900000000');
