# forge-pages: Contexto da Reescrita para MVP Next.js (Aug 2026)

**Última atualização:** 2026-08-04  
**Status:** Fase 0 concluída (2026-08-04) — repo resetado, Next.js 16 rodando, schema atualizado  
**Responsável:** Rafael Dellaquila

---

## TL;DR — O que mudou

- **De**: Nuxt 4 + Vue + Strapi 5 + NocoDB + PostHog + Sentry + Flipt + VPS Lightsail (SaaS enterprise)
- **Para**: Next.js + React + Supabase (blocos como JSON) + Cloudflare Workers (MVP validação de mercado)
- **Por quê**: Zero clientes pagantes, custo/complexidade pararam o progresso, precisamos lançar Forge Company LP e validar modelo rápido
- **Quando**: Imediato, Fases 0–5 sequenciais, dev solo nas horas vagas

---

## Decisões Fechadas (via "Grill Me", 2026-08-04)

### 1. Hosting: Cloudflare Workers (com Vercel Pro como Plano B)

**Decisão:** Deploy em Cloudflare Workers via `@opennextjs/cloudflare`.

**Rationale:**
- Genuinamente **R$ 0** no MVP (Workers free tier + 100 custom hostnames grátis no Cloudflare for SaaS)
- Vercel Pro é R$ 110/mês como fallback documentado — se debugging de imagens/ISR no Workers consumir >1 dia, trocar sem culpa
- ADR-0001 original já havia escolhido Cloudflare; a reescrita em Next.js só muda o adapter (Nitro → OpenNext), não a plataforma

**Trade-offs conhecidos** (validados via web search, 2026):
- `next/image` tem gaps: `minimumCacheTTL` não suportado, `Cache-Control` emulado, há bug conhecido com loader quebrado em certas configs
- ISR emulado via stale-while-revalidate (não nativo)
- Erros mais crípticos; precisa rodar `wrangler dev` local pra pegar problemas
- **Mitigação**: Landing pages são majoritariamente estáticas — cenários onde OpenNext mais sofre não são o caso de uso aqui

**Referência:** [ADR-0001 (v2) — Hosting em Cloudflare; Koyeb/Domainee descartados; Vercel Pro como Plano B documentado]

---

### 2. Edição de Conteúdo: Supabase Studio (JSON direto, sem admin UI)

**Decisão:** Conteúdo das landing pages (blocos, textos, cores) armazenado como JSON tipado em coluna Supabase; edição via Supabase Studio (table editor + JSON editor nativo), sem construir admin UI customizada no MVP.

**Rationale:**
- Dev solo edita (técnico, confortável com JSON)
- Reduz complexidade: sem Strapi, sem NocoDB — só Supabase
- Supabase Studio já resolve: filtrar por tenant, visualizar/editar `blocks` JSONB, nenhum código extra

**Mitigação do risco (JSON malformado):**
- Validação Zod no fetch da página (`lib/schemas/blocks.ts`)
- Falha controlada no Server Component se schema inválido, em vez de página quebrada silenciosamente em produção
- Mensagem clara de erro no console/log pra debug

**Se depois precisar de UI (não MVP):**
- Construir formulário simples/CRUD de bloco → ainda alimenta mesma coluna JSONB
- Ou usar Supabase Studio como "admin console" e documentar pra clientes futuros

---

### 3. Três Tenants do MVP

| Domínio | Tipo | Conteúdo | Propósito |
|---|---|---|---|
| `forgecompany.example.com` | Real | Portado de `forge_company_apresentacao.html` | Produto real: agência de marketing Forge Co. |
| `dellaquila.dev` | Real | Exemplo "para desenvolvedor" | Prova: domínio real de 2º proprietário, conteúdo exemplo |
| `imobiliaria.forgecompany.example.com` | Subdomínio | Exemplo "para setor imobiliário" | Prova: variação de branding/conteúdo, mesmo deploy |

**Por quê 3?** Suficiente pra validar multi-tenant (resolução por Host header, sem vazamento entre tenants, branding diferente por tenant). Futuro: qualquer cliente novo = nova linha em `landing_pages`, novo host apontando pra mesmo Worker.

---

### 4. Mesmo Repositório (In-Place Rewrite)

**Decisão:** Reescrever dentro de `/home/dellaquila/projetos/forge-pages`, não repo novo.

**Vantagens:**
- Preserva o histórico de decisões nas ADRs
- Secrets/integrações (Supabase, Cloudflare) já vinculadas
- CI/CD já configurado (ativar depois, não bloqueia MVP)
- Documentos de negócio (`CLAUDE.md`, skills genéricas) já lá

**Estrutura resultante:** ver `.claude/CLAUDE.md` §3, que é a referência viva. Em resumo:
app flat na raiz (`app/`, `components/blocks/`, `lib/`, `middleware.ts`), config do
Cloudflare em `wrangler.jsonc` + `open-next.config.ts`, e `apps/` / `packages/` /
`pnpm-workspace.yaml` (como manifesto de workspace) / `.changeset/` removidos.

---

### 5. Branding/Visual por Tenant (Diferenciação Garantida)

**Decisão:** Cada cliente pode parecer completamente diferente — cores, fontes, layouts — sem precisar editar código React por cliente.

**Mecanismo:**
1. **Identidade visual** (cor primária/secundária, fonte, background) vive em colunas do tenant em `landing_pages`:
   - `brand_primary_color`, `brand_secondary_color`, `brand_font_family`, `background_type`, `background_color`, etc. (já existem no schema, explorados em ADR-0005)
   - Viram CSS custom properties (`--tenant-primary`, `--tenant-accent`, `--tenant-font-body`) setadas no `<html>` pelo proxy + Server Component raiz
   - Trocar a cara de um cliente = editar dados em Supabase Studio, não código

2. **Diferenças estruturais** (ex: hero centralizado vs. hero com imagem) via campo `variant` por bloco (ADR-0002):
   - Cada componente React lê `variant` da definição do bloco
   - `variant: "default"` é fallback
   - Exemplo: `HeroBlock` com `variant="split"` renderiza layout dividido; `variant="default"` renderiza centralizado
   - Sem precisar de componente novo por variação

**Exemplo de seed:**
```json
{
  "domain": "forgecompany.example.com",
  "brand_primary_color": "#FF6A2C",
  "brand_secondary_color": "#FFBA4A",
  "brand_font_family": "Montserrat",
  "blocks": [
    {
      "type": "hero",
      "variant": "default",
      "headline": "Marketing digital forjado, não copiado.",
      "subheadline": "..."
    },
    { "type": "value-proposition", ... },
    ...
  ]
}
```

**Referência:** [ADR-0002 (v2) — Block layout variants; ADR-0005 (v2) — Tenant background system]

---

### 6. Captação de Lead + Visibilidade

**Fluxo:**
```
Visitante preenche CtaFormBlock (nome, email, whatsapp, mensagem)
    ↓
Route handler POST /api/leads valida com Zod
    ↓
Cloudflare Turnstile verifica (bot protection)
    ↓
INSERT em `leads` (Supabase, service-role key, server-side only)
    ↓
✓ Lead aparece em `leads` table no Supabase Studio (filtrar por landing_page_id)
```

**Analytics de visitas:**
- **Cloudflare Web Analytics** (habilitado por domínio no dashboard, zero config)
- **Sem cookie banner** (Cloudflare não usa cookies de rastreamento pesado)

**Dashboard fase 1:**
- Supabase Studio (visualizar `leads` por tenant)
- Cloudflare Analytics dashboard (visualizar pageviews por domínio)
- Sem construir UI customizada (MVP)

**Dashboard fase 2+ (fast-follow):**
- Página `/admin` simples (listagem de leads, filtro por tenant, gráfico de conversão)
- Gate: Cloudflare Access (email-based, zero código de app)

---

## Stack Final (Validado)

| Camada | Ferramenta | Por quê | Alternativa rejeitada |
|---|---|---|---|
| **Linguagem** | TypeScript (strict) | Segurança, dev experience | — |
| **Framework** | Next.js 16 | App Router, Server Components, Edge Middleware para multi-tenant, Turbopack (bundler padrão) | Nuxt (descartado), Remix |
| **React** | React 19 | Latest stable, Composition hook model | Vue (descartado) |
| **Styling** | Tailwind CSS v4 | Utility-first, CSS-native (sem config file), compatível com CSS custom props do tenant | Styled-components |
| **DB** | Supabase (PostgreSQL) | Row-Level Security, já em uso, schema bom, Edge Functions se precisar | Firebase (descartado em ADR histórica) |
| **Hosting (Compute)** | Cloudflare Workers | R$ 0, custom domains grátis, global CDN | Vercel Pro (backup, R$ 110/mês) |
| **Hosting (CMS)** | ~~Strapi~~ **Supabase JSONB** | Eliminado, blocos são JSON tipado | — |
| **Linting** | Biome | 15x mais rápido que ESLint, produção-ready 2026 (usado por Vercel/AWS/Cloudflare), regra React hooks equivalente | ESLint + Prettier |
| **Formatting** | Biome | Integrado com linting, 10–20x mais rápido | Prettier |
| **Testing** | (deferido) | — | — |
| **Analytics** | Cloudflare Web Analytics | Gratuito, zero-config, sem cookies pesados | PostHog (descartado) |
| **Lead Storage** | Supabase `leads` table | Já existe, Row-Level Security | NocoDB (descartado) |
| **Bot Protection** | Cloudflare Turnstile | Gratuito, sem CAPTCHA visual chato | reCAPTCHA |
| **Error Tracking** | (deferido) | — | Sentry (descartado) |
| **Feature Flags** | (deferido) | — | Flipt (descartado) |

---

## Conteúdo Fonte

### Forge Company Landing Page (será portada)
- **Arquivo**: `/home/dellaquila/projetos/forge-company/forge_company_apresentacao.html` (754 linhas)
- **Estado**: HTML estático com CSS embutido, design desatualizado (paleta antiga, logo base64 embutido)
- **Seções** (em ordem):
  1. Hero (`#hero`) — headline, subheadline, 2x CTA, ember canvas animation
  2. Manifesto (`#manifesto`) — positioning copy, 4-ponto diferenciação
  3. Processo (`#processo`) — 4 etapas (Diagnóstico, Plano, Execução, Otimização)
  4. Setores (`#setores`) — 4 cards (Imobiliário, Estética & Saúde, Financeiro, Automotivo)
  5. Pacotes (`#pacotes`) — 2 pricing cards (Base R$ 2k/mês, Estratégico sob consulta)
  6. Contato (`#contato`) — CTA + `mailto:` (sem form real)
  7. Footer — branding simples
- **Ação**: Portar seções → blocos React, assets → brand SVGs atuais

### Brand Assets (usar atualizados)
- **Pasta**: `/home/dellaquila/projetos/forge-company/brand/`
- **Arquivos**: `logo_positive.svg`, `logo_negative.svg`, `icon_positive.svg`, `icon_negative.svg`, `hero-ember-background.svg`
- **Ação**: Substituir PNG base64 antigo por SVGs atuais nos componentes

### Documentação de Negócio (referência)
- `/home/dellaquila/projetos/forge-company/.claude/docs/marketing/` — posicionamento, públicos, copy, serviços/pacotes
- **Uso**: Inspirar conteúdo dos blocos (copy de hero, testimonials, diferenciadores)

---

## Documentos Relacionados Neste Repo

### ADRs (Arquitetura) — estado final após a Fase 0
- `0001-hosting-cloudflare.md` — atualizada: Nitro preset → OpenNext; Vercel Pro documentado como Plano B
- `0002-block-layout-variants.md` — adaptada: `variant` como prop de bloco segue válido, exemplos agora em React
- `0005-tenant-background-system.md` — adaptada: shape de `Background` segue válido, agora em JSON + React
- `0007-drop-strapi-nocodb-observability-vps.md` — nova: registra esta decisão e o rationale
- `0003`, `0004`, `0006` — **deletadas** (VPS, preview do Strapi, isolamento de schema do Strapi). Os números estão aposentados: o gap na sequência é deliberado. Texto completo no histórico do git.

### Skills — estado final
Mantidas: `react-best-practices`, `next-best-practices`, `next-cache-components`,
`supabase`, `supabase-migration`, `supabase-postgres-best-practices`,
`security-checklist`, `solid`, `composition-patterns`, `web-design-guidelines`,
`onboard-local`.
Deletadas: `new-block` (scaffolder Vue), `nuxt-server-route`, `strapi-content-type`.

### Docs de contexto (`.claude/docs/`)
- `MVP_REWRITE_CONTEXT.md` — este arquivo: contexto e decisões da reescrita
- `TECHNICAL_REVIEW_CONTEXT7.md` — padrões técnicos verificados na doc oficial (Next.js,
  OpenNext, Supabase, Turnstile) + tabela de versões confirmadas

---

## Supabase Schema

### Migrações Existentes (reaproveitar)
```
infra/supabase/migrations/
├── 20240101000000_enable_extensions.sql — uuid-ossp, etc.
├── 20240101000001_create_core_tables.sql — clients, landing_pages, leads, webhook_retries
├── 20240101000002_enable_rls.sql — Row-Level Security
├── 20240101000003_create_retry_cron.sql — retry logic (pode apagar depois)
├── 20240101000004_add_secondary_font_family.sql — brand.secondary_font_family
└── 20240101000005_add_page_background.sql — background_type, color, gradient, image
```

### Alterações para MVP
```sql
-- Adicionar coluna blocks (novo MVP)
ALTER TABLE landing_pages 
ADD COLUMN blocks jsonb NOT NULL DEFAULT '[]';

-- Deletar o schema do CMS antigo
DROP SCHEMA IF EXISTS strapi CASCADE;

-- Deletar webhook_retries (documentar como deferido)
DROP TABLE IF EXISTS webhook_retries;

-- Confirmar RLS:
-- landing_pages: SELECT anônimo OK se status='published'; INSERT/UPDATE/DELETE apenas via RLS
-- leads: INSERT anônimo OK (com validação Turnstile); SELECT/UPDATE/DELETE apenas via RLS
```

---

## Fases (Resumo Executivo)

| Fase | Foco | Saída | Tempo Est. |
|---|---|---|---|
| **0** | Reset repo, infra, docs | Repo pronto, schema atualizado, ADRs revisadas | 2-3 dias |
| **1** | Core multi-tenant + Forge Company | `forgecompany.example.com` renderizando com conteúdo real | 3-4 dias |
| **2** | Captação de lead | Form → Supabase, leads visíveis em Studio | 1-2 dias |
| **3** | Segundo/terceiro tenant | `dellaquila.dev` + `imobiliaria.forgecompany.example.com` | 1-2 dias |
| **4** | Deploy | Live em Cloudflare Workers, 3 domínios rodando | 1 dia |
| **5** | Visibilidade | Supabase Studio (leads) + Cloudflare Analytics (visitas) | 0.5 dias |

**Total:** ~1-2 semanas dev solo, horas vagas. Verificação contínua com `next dev` local + `wrangler dev`.

---

## Uso Este Documento em Prompts Futuros

Para qualquer sessão futura neste repo:

1. **Cole no início do prompt:**
   ```
   Leia /home/dellaquila/projetos/forge-pages/.claude/docs/MVP_REWRITE_CONTEXT.md
   e os documentos relacionados em .claude/docs/ antes de prosseguir.
   ```

2. **Referendar decisões:** "Segundo MVP_REWRITE_CONTEXT, a decisão é X porque Y."

3. **Navegar para detalhes:** Este doc aponta pra ADRs, skills, conteúdo-fonte — siga os links.

4. **Atualizar conforme progresso:** Marque fases como completas, registre desvios, atualize esta seção "Uso".

---

## Checklist Pré-Fase 0

- [ ] Ler este documento inteiro + documentos linkados
- [ ] Revisar ADRs existentes (0001–0006)
- [ ] Confirmar credenciais Supabase/Cloudflare/GitHub estão OK
- [ ] Fazer backup do schema Supabase atual (ou confirmar que zero dados reais)
- [ ] Verificar Node 24 + pnpm 11 estão instalados localmente
- [ ] Reservar ~1-2 semanas pra dev (fases 0–5)
- [ ] Documentar qualquer desvio do plano em `PROGRESS.md` durante execução

---

## Proximos Passos (Imediato)

1. **Revisar com context7 MCP** (web search/docs):
   - Next.js 16 App Router + Edge Middleware pra multi-tenant
   - `@opennextjs/cloudflare` setup + boas práticas
   - Supabase JSONB + Zod validation pattern
   - Cloudflare Turnstile server-side validation

2. **Iniciar Fase 0:**
   - Limpar repo (deletar apps/web, apps/cms, packages/ui, pnpm-workspace.yaml, .changeset/)
   - Iniciar novo app Next.js 16 from scratch
   - Replicar biome.json, atualizar CLAUDE.md
   - Escrever ADR-0007, atualizar ADR-0001–0006

3. **Primeira run:**
   - `next dev` local
   - Testar multi-tenant com `/etc/hosts` (forgecompany.local, dellaquila.local)
   - Seed de `forgecompany.example.com` com blocos
   - Verificar `next lint` passa

---

## Links Rápidos

- **Este repo:** `/home/dellaquila/projetos/forge-pages/`
- **Conteúdo fonte:** `/home/dellaquila/projetos/forge-company/`
- **Plano original:** `/home/dellaquila/.claude/plans/rustling-crunching-bear.md`
- **Docs marketing Forge Co.:** `/home/dellaquila/projetos/forge-company/.claude/docs/marketing/`

---

**Autor:** Claude (sessão 2026-08-04)  
**Aprovado por:** Rafael Dellaquila  
**Status:** ✅ Pronto para começar Fase 0
