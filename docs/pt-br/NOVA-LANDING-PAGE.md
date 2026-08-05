# Como cadastrar uma nova landing page (novo cliente)

Cada cliente é **uma linha** na tabela `landing_pages` do Supabase, identificada pelo
`domain` (domínio):

| Colunas | O que guardam | Se faltar |
| --- | --- | --- |
| `domain`, `status`, `client_id` | identidade do cliente | página dá **404** |
| cores, fonte, fundo | a identidade visual (tema) | usa o padrão neutro |
| `seo_title`, `seo_description`, … | título e descrição no Google | página sem SEO |
| `blocks` (JSON) | o **conteúdo** (os blocos da página) | página abre com o tema, mas vazia |

> **Regra de ouro:** a linha precisa estar com `status = 'published'` e o `domain` precisa
> ser **exatamente** o endereço acessado (sem a porta).

Cada cliente também precisa de um registro em `clients` (dados de contato do dono), que a
`landing_pages` referencia por `client_id`.

Em produção falta só uma coisa a mais: cadastrar o domínio na Cloudflare (para DNS + SSL).
Resumindo: **uma linha no banco + um domínio na Cloudflare** — sem CMS, sem publicar nada
por cliente.

---

## Local (desenvolvimento)

Use um subdomínio `*.localhost`, por exemplo `novocliente.localhost`.

### Pelo painel do banco (Supabase Studio) — mais rápido

1. Abra `http://127.0.0.1:54323` → **Table Editor**.
2. `clients` → **Insert row**: nome, e-mail, whatsapp do dono.
3. `landing_pages` → **Insert row**: `client_id` (a linha acima), `domain =
   novocliente.localhost`, `status = published`, cores/fonte e campos de SEO.
4. Abra a célula `blocks` dessa linha e cole a lista de blocos (ver abaixo).
5. Acesse `http://novocliente.localhost:3000`.

### Pelos arquivos de exemplo (para sobreviver a um reset do banco)

1. `infra/supabase/seed/01_clients.sql` — adicione uma linha em `clients`.
2. `infra/supabase/seed/02_landing_pages.sql` — adicione uma linha em `landing_pages` com o
   novo `domain`, `status = 'published'`, o tema e a lista de `blocks`.
3. Aplique:
   ```bash
   pnpm exec supabase db reset --workdir infra
   ```

---

## O JSON dos blocos

`blocks` é uma lista ordenada; cada item tem um campo `type` (o tipo do bloco) e os campos
daquele bloco:

```json
[
  { "type": "header", "variant": "default", "ctaLabel": "Fale com a gente" },
  { "type": "hero", "variant": "default", "headline": "…", "subheadline": "…" },
  { "type": "cta-form", "headline": "…", "ctaLabel": "Enviar" },
  { "type": "footer", "copyright": "…" }
]
```

O formato aceito de cada tipo de bloco está definido em `lib/types/blocks.ts` e é conferido
por `lib/schemas/blocks.ts`. Na prática: **copie a lista de um cliente existente** e troque
os textos. Se o JSON estiver fora do formato, a página falha com uma mensagem clara em vez
de abrir quebrada.

---

## Produção

1. **Supabase (produção)** — insira as linhas em `clients` e `landing_pages` com o
   **domínio real**, `status = 'published'`, o tema, o SEO e a lista de `blocks`. Mesmo
   procedimento do local, no projeto da nuvem.
2. **Domínio + SSL (Cloudflare for SaaS)** — ver `docs/adr/0001-hosting-cloudflare.md`:
   - cadastre o domínio do cliente como **Custom Hostname** (gera o certificado SSL grátis);
   - o cliente aponta o DNS (um `CNAME`) para o alvo da Cloudflare;
   - o site resolve o cliente pelo domínio da requisição — sem publicar nada por cliente.
3. **Conferir** — abra `https://<domain>`, veja o tema/SEO/blocos e teste enviar o
   formulário (o lead deve aparecer na tabela `leads`).
4. *(Opcional)* Ligue o **Cloudflare Web Analytics** para o novo domínio no painel da
   Cloudflare — sem configuração nenhuma no código.

---

## Checklist

- [ ] Linha em `clients` criada (nome/e-mail/whatsapp do dono).
- [ ] Linha em `landing_pages` — `domain` certo, `status = 'published'`, tema + SEO.
- [ ] Coluna `blocks` preenchida (a página mostra conteúdo, não só o tema).
- [ ] (Produção) Custom Hostname na Cloudflare + `CNAME` do cliente apontado.
- [ ] Página abre com o tema e os blocos certos; formulário envia lead com sucesso.

> Referência técnica completa (inglês): `docs/ADD_CLIENT.md`.
