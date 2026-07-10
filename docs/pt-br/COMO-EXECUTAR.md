# Como executar o projeto localmente

Guia para subir o forge-pages inteiro na sua máquina: banco de dados (Supabase local),
CMS (Strapi), o site (Nuxt) e o catálogo de componentes (Storybook). Tudo roda local — não
precisa de conta em nuvem nem serviço pago. As integrações externas (PostHog, Sentry,
Turnstile, Upstash, Flipt) ficam desligadas de forma segura quando não há chaves.

---

## 1. Pré-requisitos

- **[Docker](https://www.docker.com/)** — o Supabase local roda em containers.
- **[mise](https://mise.jdx.dev/)** — instala e fixa Node 24 + pnpm.

```bash
mise install     # instala Node 24 + pnpm (lê o .mise.toml)
```

---

## 2. Jeito rápido (recomendado)

Existe um script que faz o setup inteiro de forma segura (não sobrescreve `.env`
existente nem apaga banco já criado):

```bash
bash .claude/skills/onboard-local/setup.sh
```

Ele instala dependências, sobe o Supabase local, aplica migrações + dados de exemplo
(só na primeira vez) e cria `apps/cms/.env` + `apps/web/.env` se não existirem.

Depois, suba os serviços:

```bash
mise run dev:cms    # Strapi  → http://localhost:1337/admin
mise run dev:web    # Site    → http://localhost:3000 (ou 3001 se a 3000 estiver ocupada)
```

---

## 3. Primeiro acesso ao Strapi (CMS)

Na primeira vez, abra `http://localhost:1337/admin`:

1. Crie o usuário administrador.
2. **Settings → API Tokens → Create** um token do tipo **Read-only** e cole em
   `apps/web/.env` na variável `STRAPI_API_TOKEN`.
3. Reinicie o `dev:web` para ele ler o token.

Para carregar as 3 landing pages de exemplo (já publicadas):

```bash
cd apps/cms && node scripts/seed-content.cjs
```

---

## 4. Ver funcionando (multi-tenant)

O site descobre qual cliente mostrar pelo **domínio** de acesso. Localmente usamos
subdomínios `*.localhost` (o navegador resolve sozinho, sem editar arquivos do sistema):

| Endereço | Cliente |
| --- | --- |
| http://forge-motos.localhost:3000 | Forge Motos (motos) |
| http://clinica.localhost:3000 | Clínica Exemplo (saúde) |
| http://advocacia.localhost:3000 | Advocacia Prime (jurídico) |
| http://desconhecido.localhost:3000 | **404** (domínio sem cliente) |

Cada um mostra cores, fonte e conteúdo próprios. Use `:3001` se a porta 3000 estava ocupada.

---

## 5. Endereços úteis

| Serviço | Endereço |
| --- | --- |
| Site (Nuxt) | http://localhost:3000 |
| Admin do CMS (Strapi) | http://localhost:1337/admin |
| Painel do banco (Supabase Studio) | http://127.0.0.1:54323 |
| E-mails de teste (Mailpit) | http://127.0.0.1:54324 |
| Storybook (componentes) | http://localhost:6006 (`mise run storybook`) |

---

## 6. Comandos do dia a dia

```bash
mise run dev          # sobe Nuxt + Strapi juntos
mise run lint         # checagem de código (Biome)
mise run typecheck    # checagem de tipos (TypeScript)
mise run storybook    # catálogo de componentes
```

---

## 7. Problemas comuns

- **Erro `supabaseUrl is required`** → o servidor do site subiu antes das variáveis.
  **Reinicie o `dev:web`** sempre que editar `apps/web/.env` (ele lê as variáveis só ao iniciar).
- **Página dá 404** → não existe cliente para aquele domínio no Supabase, ou não está
  publicado. Rode `pnpm exec supabase db reset --workdir infra`.
- **Página abre mas sem blocos** → o registro no Strapi não tem o mesmo `domain` ou não
  está publicado.
- **Strapi não sobe** → confira `apps/cms/.env` e se o Supabase está rodando
  (`pnpm exec supabase status --workdir infra`).

> Detalhes técnicos completos (em inglês): `docs/LOCAL_DEVELOPMENT.md`.
