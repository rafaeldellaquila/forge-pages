# Como cadastrar uma nova landing page (novo cliente)

Cada cliente tem a página em **dois lugares**, sempre ligados pelo mesmo `domain` (domínio):

| Onde | O que guarda | Se faltar |
| --- | --- | --- |
| **Supabase** (tabela `landing_pages`) | identidade do cliente, cores, fonte, SEO, status | página dá **404** |
| **Strapi** (registro publicado) | os **blocos** (o conteúdo em si) | página abre vazia |

> **Regra de ouro:** o `domain` precisa ser **idêntico** nos dois lugares, e os dois
> precisam estar **publicados**.

Cada cliente também precisa de um registro em `clients` (dados de contato do dono), que a
`landing_pages` referencia por `client_id`.

---

## Local (desenvolvimento)

Use um subdomínio `*.localhost`, por exemplo `novocliente.localhost`.

### Caminho rápido (script)

1. **Supabase** — adicione o cliente e a landing page. Edite os arquivos de exemplo (para
   sobreviver a um reset) e aplique no banco em execução:
   - `infra/supabase/seed/01_clients.sql` — adicione uma linha em `clients`.
   - `infra/supabase/seed/02_landing_pages.sql` — adicione uma linha em `landing_pages`
     com o novo `domain`, `status = 'published'` e as cores/fonte.
   - Aplicar (ou simplesmente `pnpm exec supabase db reset --workdir infra`):
     ```bash
     docker exec -i "$(docker ps --format '{{.Names}}' | grep -m1 supabase_db)" \
       psql -U postgres -d postgres < infra/supabase/seed/02_landing_pages.sql
     ```

2. **Conteúdo (Strapi)** — adicione o cliente na lista `clients` de
   `apps/cms/scripts/seed-content.cjs` (copie um bloco existente e troque `domain` e os
   textos) e rode:
   ```bash
   cd apps/cms && node scripts/seed-content.cjs
   ```
   O script **recria** cada domínio da lista (já publicado). Não precisa de token.

3. **Conferir**: abra `http://novocliente.localhost:3000`.

### Caminho pelo CMS (para quem não é técnico)

1. No **Supabase Studio** (`http://127.0.0.1:54323`) crie as linhas em `clients` e
   `landing_pages` com o novo `domain` e `status = published`.
2. No **admin do Strapi** → **Content Manager → Landing Page → Create**:
   - preencha **`domain`** com exatamente o mesmo valor;
   - adicione os blocos (Cabeçalho, Hero, …, Formulário, Rodapé);
   - **Save → Publish**.
3. Abra `http://<domain>:3000`.

---

## Produção

Mesmos dois lugares, mais o domínio real (ex.: `lp.cliente.com.br`) com SSL.

1. **Supabase (produção)** — insira as linhas em `clients` e `landing_pages` com o
   **domínio real** e `status = 'published'` (cores, fonte e SEO).
2. **Strapi (produção)** — crie e **publique** a Landing Page com o mesmo `domain`.
3. **Domínio + SSL (Cloudflare for SaaS)** — ver `docs/adr/0001-hosting-cloudflare.md`:
   - cadastre o domínio do cliente como **Custom Hostname** (gera o certificado SSL grátis);
   - o cliente aponta o DNS (um `CNAME`) para o alvo da Cloudflare;
   - o site resolve o cliente pelo domínio da requisição — sem deploy por cliente.
4. **Conferir** — abra `https://<domain>`, veja o tema/SEO/blocos e teste enviar o formulário
   (o lead deve ser criado).

---

## Checklist

- [ ] Linha em `clients` criada (nome/e-mail/whatsapp do dono).
- [ ] Linha em `landing_pages` — `domain` certo, `status = 'published'`, tema + SEO.
- [ ] Registro no Strapi com o **mesmo** `domain` e **publicado**.
- [ ] (Produção) Custom Hostname na Cloudflare + `CNAME` do cliente apontado.
- [ ] Página abre com o tema e os blocos certos; formulário envia lead com sucesso.

> Referência técnica completa (inglês): `docs/ADD_CLIENT.md`.
