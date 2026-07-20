# O que falta (pendências)

> Situação em **10/07/2026**. Lista viva do que ainda falta para colocar o primeiro
> cliente pagante no ar. Atualize conforme concluir os itens.

---

## Onde estamos

- As 6 fases de construção estão prontas e integradas na `main`.
- Ambiente local 100% funcional: 3 clientes de exemplo em `*.localhost`, com estilo e
  captura de leads ponta a ponta.
- 15 segredos (secrets) do GitHub Actions já configurados.
- Arquivo `.env` da raiz limpo (chaves mortas removidas, nomes corrigidos).
- **2026-07-20**: `.env` da raiz virou a fonte única de verdade (`mise run env:sync` gera
  os `.env` dos apps; matriz em `docs/SECRETS.md`). **Migração para a conta da empresa
  (Forge Company / `admin@forgecompany.example.com`) em andamento** — plano e status em
  `docs/GO_LIVE.md`, seção "Company account migration". Todas as chaves atuais (conta
  pessoal) serão trocadas e revogadas.

**Bloqueios reais para ir ao ar:** publicar o site (Cloudflare Pages) e hospedar o Strapi
para o CMS ficar acessível em produção. O resto é configuração / robustez / operação.

---

## Pendências por área

### 1. Segurança — quase pronto
- [x] Removida a chave `sk_live_` (Domainee) e limpeza do `.env`.
- [x] Token do GitHub restrito a Contents/PRs/Workflows/Actions (R/W).
- [ ] *(opcional)* Adicionar permissão **Secrets: R/W** ao token do GitHub se quiser que a
  ferramenta MCP/token gerencie segredos (hoje não consegue; usamos o `gh` CLI).

### 2. Configuração do repositório no GitHub
- [x] 15 segredos adicionados.
- [ ] Adicionar os **5 segredos que faltam** quando os serviços existirem:
  `ANTHROPIC_API_KEY`, `STRAPI_URL`, `SUPABASE_DB_HOST`, `FLIPT_URL`, `FLIPT_TOKEN`.
- [ ] **Ativar os workflows** — descomentar os gatilhos `on:` em `.github/workflows/`
  (`ci.yml`, `build.yml`, `claude-review.yml`, `backup.yml`).
- [ ] **Proteção do branch `main`** — exigir PR + 1 aprovação; descartar aprovações antigas
  ao novo commit; exigir checagens (adicionar `Lint & Typecheck` depois que o `ci.yml`
  rodar uma vez); exigir branch atualizado; sem bypass.

### 3. Publicar o site — Cloudflare Pages *(bloqueio)*
- [ ] Primeiro deploy: `pnpm --filter web deploy:cloudflare` (ou ativar `deploy.yml`).
- [ ] **Conferir se o `CLOUDFLARE_API_TOKEN` tem escopo de deploy do Pages/Workers** — o
  valor atual (`cfat_…`) pode ser só de R2; se der 403, gerar um token com *Cloudflare
  Pages: Edit*.
- [ ] Validar o SDK **server** do Sentry no runtime Workers; trocar por `@sentry/cloudflare`
  se der problema.
- [ ] **Custom hostname** + SSL por cliente na Cloudflare for SaaS (ADR 0001).

### 4. Serviços sempre-ligados (sem tier grátis — adiados) *(Strapi é bloqueio)*
- [ ] **Strapi** — escolher hospedagem; definir `DATABASE_URL` de produção; validar upload
  de mídia (bucket no Supabase Storage + `SUPABASE_S3_*`). Sem ele em produção, as páginas
  aparecem com tema mas sem blocos.
- [ ] **Flipt** — subir um servidor; definir `FLIPT_URL`/`FLIPT_TOKEN` (até lá, tudo ligado).
- [ ] **NocoDB** — hospedar; apontar para o Postgres do Supabase (gestão de leads).

### 5. Ativar integrações já preparadas (ligadas ao setar chaves)
- [ ] **Turnstile** — trocar as chaves de teste no `.env` da raiz pelas reais (widget de
  produção, conta Cloudflare da empresa) e rodar `mise run env:sync`.
- [ ] **Sentry** — confirmar erros chegando em produção.
- [ ] **PostHog** — confirmar eventos ao vivo após deploy.
- [ ] **Resend** — verificar um domínio remetente real; atualizar `RESEND_FROM_EMAIL`.
- [ ] **WhatsApp** — definir os segredos `WHATSAPP_*` no Supabase.

### 6. Painéis manuais
- [ ] **UptimeRobot** — monitores (site + Strapi).
- [ ] **NocoDB** — área dos parceiros (depois do item 4).
- [ ] **Cloudflare** — custom hostnames por cliente no onboarding.

---

## Prioridade sugerida

1. Ativar workflows + proteção de branch (item 2) — rápido.
2. Publicar o site na Cloudflare Pages (item 3).
3. Decidir e hospedar o Strapi (item 4).
4. Ativar integrações reais (item 5) e painéis (item 6).

> Referência técnica completa (inglês): `docs/GO_LIVE.md`.
