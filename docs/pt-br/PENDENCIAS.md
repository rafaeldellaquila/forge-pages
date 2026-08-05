# O que falta (pendências)

> Situação em **04/08/2026**. Lista viva do que ainda falta para colocar o primeiro
> cliente pagante no ar. Atualize conforme concluir os itens.

---

## Onde estamos

- **Stack do MVP**: Next.js + React + Supabase (conteúdo das páginas em JSON) +
  Cloudflare Workers. O conteúdo é editado direto no Supabase Studio e os leads são vistos
  lá também — não há painel separado. Rationale:
  `docs/adr/0007-drop-strapi-nocodb-observability-vps.md`.
- Ambiente local funcional: clientes de exemplo em `*.localhost`, um comando para subir
  (`mise run dev`).
- Migração das contas para a empresa (Forge Company / `admin@forgecompany.example.com`):
  **Fases A e B concluídas** — projeto Supabase da empresa criado, Cloudflare, Turnstile,
  Anthropic e GitHub sob a conta da empresa. Plano e status completos em `docs/GO_LIVE.md`.

**Bloqueio real para ir ao ar:** publicar o site na Cloudflare Workers com os 3 domínios do
MVP respondendo. O resto é configuração / robustez / operação.

---

## Fases do MVP

| Fase | Foco | Situação |
|---|---|---|
| 0 | Reset do repositório, infra e documentação | concluída |
| 1 | Multi-tenant + conteúdo real da Forge Company | a fazer |
| 2 | Captação de lead (formulário → Supabase) | a fazer |
| 3 | Segundo/terceiro cliente (`dellaquila.dev`, `imobiliaria.forgecompany.example.com`) | a fazer |
| 4 | Publicar (Cloudflare Workers, 3 domínios no ar) | a fazer |
| 5 | Visibilidade (leads no Supabase + visitas na Cloudflare) | a fazer |

---

## Pendências por área

### 1. Segurança
- [x] Token do GitHub restrito a Contents/PRs/Workflows/Actions (R/W).
- [ ] *(opcional)* Adicionar permissão **Secrets: R/W** ao token do GitHub se quiser que a
  ferramenta MCP/token gerencie segredos (hoje não consegue; usamos o `gh` CLI).
- [ ] **Limite de envios (rate limiting) não existe hoje** — foi adiado de propósito no MVP.
  A única proteção do formulário é o Turnstile. Rever antes de investir em tráfego pago.

### 2. Configuração do repositório no GitHub
- [x] **Segredos (secrets) ajustados — 04/08/2026.** São 11, exatamente os que os workflows
  usam (ver `.github/SETUP.md`), todos apontando para o projeto Supabase da empresa
  (`ofpnglnnzpowlzsyfbit`). Os `NUXT_PUBLIC_*` viraram `NEXT_PUBLIC_*` e os de serviços que
  saíram foram apagados.
- [ ] **Ativar os workflows** — descomentar os gatilhos `on:` em `.github/workflows/`
  (`build.yml`, `deploy.yml`, `backup.yml`). O `ci.yml` já está ativo.
- [ ] **Proteção do branch `main`** — exigir PR + 1 aprovação; descartar aprovações antigas
  ao novo commit; exigir a checagem `Lint & Typecheck`; exigir branch atualizado; sem bypass.

### 3. Publicar o site — Cloudflare Workers *(bloqueio)*
- [ ] Primeiro deploy: `pnpm run deploy` (ou ativar o `deploy.yml`).
- [ ] **Conferir se o `CLOUDFLARE_API_TOKEN` tem escopo de deploy de Workers** — o valor
  atual foi criado para Pages; se der 403, gerar um token com *Workers Scripts: Edit*.
- [ ] Rodar `mise run preview` antes do deploy — ele roda a versão de produção no runtime da
  Cloudflare e revela problemas que o `mise run dev` não mostra.
- [ ] **Custom hostname** + SSL na Cloudflare for SaaS para os 3 domínios do MVP
  (`forgecompany.example.com`, `dellaquila.dev`, `imobiliaria.forgecompany.example.com`).
- [ ] Plano B, se o ajuste na Cloudflare passar de ~1 dia de trabalho: **Vercel Pro**
  (decisão já documentada na ADR-0001).

### 4. Visibilidade
- [ ] Ligar o **Cloudflare Web Analytics** por domínio no painel da Cloudflare (sem
  configuração no código, sem aviso de cookies).
- [ ] Confirmar que os leads aparecem no **Supabase Studio** do projeto de produção,
  filtrados por `landing_page_id`.

---

## Prioridade sugerida

1. Terminar as Fases 0–2 (site multi-tenant renderizando + captação de lead).
2. Ativar workflows e proteção de branch (item 2) — rápido.
3. Publicar na Cloudflare Workers com os 3 domínios (item 3).
4. Visibilidade (item 4).

> Referência técnica completa (inglês): `docs/GO_LIVE.md`.
