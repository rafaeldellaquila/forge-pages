# Como executar o projeto localmente

Guia para subir o forge-pages inteiro na sua máquina: banco de dados (Supabase local) e o
site (Next.js). Tudo roda local — não precisa de conta em nuvem nem serviço pago. A única
integração externa é o Turnstile (proteção contra robôs), e ela fica desligada de forma
segura quando não há chaves.

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

Ele instala as dependências, sobe o Supabase local, aplica migrações + dados de exemplo
(só na primeira vez) e preenche o `.env` da **raiz** — que é a fonte única de verdade
(valores já existentes nunca são sobrescritos). Não existe `.env` por app: o mise carrega o
`.env` da raiz e o Next.js também o lê nativamente. Referência completa: `docs/SECRETS.md`.

Depois, suba o site:

```bash
mise run dev     # Site → http://localhost:3000
```

---

## 3. Onde fica o conteúdo das páginas

Não existe CMS. O conteúdo de cada cliente (os **blocos**: textos, seções, botões) é uma
lista em formato **JSON** guardada na coluna `blocks` da tabela `landing_pages`, no
Supabase.

Para editar:

1. Abra o **Supabase Studio**: `http://127.0.0.1:54323`
2. Vá em **Table Editor → `landing_pages`**
3. Escolha a linha do cliente, abra a célula `blocks` e edite o JSON
4. Recarregue a página no navegador

Se o JSON estiver fora do formato esperado, a página falha com uma mensagem clara em vez de
abrir quebrada silenciosamente.

---

## 4. Ver funcionando (multi-tenant)

O site descobre qual cliente mostrar pelo **domínio** de acesso. Localmente usamos
subdomínios `*.localhost` (o navegador resolve sozinho, sem editar arquivos do sistema):

| Endereço | Cliente |
| --- | --- |
| http://forgecompany.localhost:3000 | Forge Company |
| http://forge-motos.localhost:3000 | Forge Motos (motos) |
| http://clinica.localhost:3000 | Clínica Exemplo (saúde) |
| http://advocacia.localhost:3000 | Advocacia Prime (jurídico) |
| http://desconhecido.localhost:3000 | **404** (domínio sem cliente) |

Cada um mostra cores, fonte e conteúdo próprios.

---

## 5. Endereços úteis

| Serviço | Endereço |
| --- | --- |
| Site | http://localhost:3000 |
| Painel do banco (Supabase Studio) | http://127.0.0.1:54323 |
| E-mails de teste (Mailpit) | http://127.0.0.1:54324 |
| Prévia no runtime da Cloudflare | http://localhost:8787 (`mise run preview`) |

---

## 6. Comandos do dia a dia

```bash
mise run dev          # sobe o site (Next.js)
mise run preview      # gera a versão de produção e roda no runtime da Cloudflare
mise run lint         # checagem de código (Biome)
mise run typecheck    # checagem de tipos (TypeScript)
```

---

## 7. Problemas comuns

- **Erro de variável faltando (ex.: `supabaseUrl is required`)** → o site subiu antes das
  variáveis existirem. **Reinicie o `mise run dev`** sempre que mudar o `.env` da raiz — as
  variáveis são lidas só ao iniciar.
- **Página dá 404** → não existe cliente para aquele domínio no Supabase, ou não está
  publicado (`status = 'published'`). Rode `pnpm exec supabase db reset --workdir infra`.
- **Página abre com as cores certas mas sem conteúdo** → a coluna `blocks` daquele cliente
  está vazia (`[]`). Preencha no Supabase Studio (item 3).
- **Turnstile sempre falha** → a chave do site e a secreta precisam ser do mesmo widget; o
  par de teste `1x…` sempre passa.

> Detalhes técnicos completos (em inglês): `docs/LOCAL_DEVELOPMENT.md`.
