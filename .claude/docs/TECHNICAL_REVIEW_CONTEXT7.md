# Revisão Técnica - Context7 MCP (Aug 2026)

Resumo das documentações oficiais revisadas antes de iniciar Fase 0.

---

## 1. Next.js 16 — Edge Middleware + App Router para Multi-Tenant

**Fonte:** `/vercel/next.js` (v16.2.9, High rep, benchmark 88.78)

**Correção 2026-08-04:** a revisão original citava "Next.js 14" no texto, mas a doc já consultada era da v16.2.9 — desalinhamento entre o texto e a fonte. Confirmado via `npm view next version` → **16.3.0** é a estável atual. Ver tabela de versões no fim deste documento.

**Breaking changes relevantes do salto 14→16** (o resto da arquitetura abaixo não muda):
- Turbopack é o bundler padrão (não precisa de flag)
- `headers()`, `cookies()` e `params` são assíncronos — os exemplos abaixo já usam `await headers()`, então já estão corretos
- `next.config.ts` é suportado nativamente (não precisa `next.config.js`)

### Multi-Tenant via Host Header

Para a arquitetura que você quer, há dois padrões documentados:

**Padrão A — Rewrites (configuração estática em next.config.js):**
```javascript
// next.config.js
rewrites: {
  beforeFiles: [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'example.com' }],
      destination: '/another-page'
    }
  ]
}
```
**Problema:** Requer conhecer todos os domínios antecipadamente; não é dinâmico.

**Padrão B — Edge Middleware (seu caso):**
```typescript
// proxy.ts  (Next 16 renomeou middleware.ts → proxy.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ⚠️ CORRIGIDO 2026-08-04: Next 16 depreciou a convenção `middleware.ts` em favor
// de `proxy.ts`, e a função exportada tem que se chamar `proxy` (não `middleware`).
// O build avisa: 'The "middleware" file convention is deprecated'. Comportamento
// idêntico — só o nome do arquivo e da função mudaram.
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? ''

  // ⚠️ CORRIGIDO 2026-08-04: `Headers.set()` retorna **void**, não o próprio
  // objeto Headers — encadear direto do construtor (como estava na versão
  // original desta revisão) não compila:
  //   error TS2322: Type 'void' is not assignable to type 'Headers | undefined'
  // Pegado por `tsc --noEmit` ao implementar a Fase 0. Atribua e mute:
  const headers = new Headers(request.headers)
  headers.set('x-tenant-host', host)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```
**Vantagem:** Dinâmico, não precisa redeployar pra adicionar novo tenant. Exatamente o que você quer.

### Leitura de Headers em Route Handlers / Server Actions

Usar `next/headers`:
```typescript
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const headersList = await headers()
  const host = headersList.get('x-tenant-host')
}
```

### Cache ISR com Multi-Tenant

⚠️ **Achado importante:** O cache ISR usa apenas `locale + pathname` como chave, **não inclui o Host header**. Isso significa:
```
Visitante de example.com/
Visitante de another.com/
→ Mesmo cache key → Colisão!
```

**Mitigação:** Você pode:
1. Incluir tenant no pathname (`/[tenant]/...`) — não ideal pra landing pages
2. Usar cache granular (ex: `revalidate: false` pra página raiz, `revalidate: 3600` pra blocos)
3. Validação manual de tenant no Server Component antes de render

**Recomendação pro seu caso:** Marcar landing pages com `revalidate: false` (sempre fresh) ou estratégia de revalidação por tenant explícita se editar blocos frequentemente.

---

## 2. OpenNext Cloudflare Adapter

**Fonte:** `/opennextjs/opennextjs-cloudflare` (High rep, benchmark 79.77)

**Correção 2026-08-04:** o `wrangler.toml` genérico da revisão original não é o formato real do adapter — confirmado via doc oficial. O adapter usa **`wrangler.jsonc`** (não `.toml`) com um binding de self-reference, e o build passa por um CLI próprio (`opennextjs-cloudflare`), não direto `next build` + `wrangler deploy`. Versão estável atual: **1.20.2** (`npm view @opennextjs/cloudflare version`).

### Setup Real (wrangler.jsonc + open-next.config.ts)

```jsonc
// wrangler.jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"main": ".open-next/worker.js",
	"name": "forge-pages",
	"compatibility_date": "2026-08-01",
	"compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
	"assets": {
		"directory": ".open-next/assets",
		"binding": "ASSETS"
	},
	"services": [
		// self-reference obrigatório — o nome do service deve bater com "name" acima
		{ "binding": "WORKER_SELF_REFERENCE", "service": "forge-pages" }
	],
	"images": {
		// habilita otimização de next/image; sem isso, degrada pra imagem original
		"binding": "IMAGES"
	}
}
```

```typescript
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  incrementalCache: "dummy", // trocar por KV/R2 se precisar de ISR persistente entre deploys
  tagCache: "dummy",
  queue: "direct",
});
```

### Build e Deploy

```bash
npm install @opennextjs/cloudflare

# Build Next.js + adapta para Cloudflare (produz .open-next/)
npx opennextjs-cloudflare build

# Deploy
wrangler deploy
```

**Localmente (desenvolvimento):**
```bash
npx opennextjs-cloudflare build && npx wrangler dev
# Acessa http://localhost:8787
```

### Gotchas Conhecidas (confirmadas no doc oficial)

1. **Imagens:** `next/image` não é totalmente suportado; `minimumCacheTTL` é ignorado; sem o binding `images` no `wrangler.jsonc`, o handler retorna a imagem original sem otimizar (degrada, não quebra)
2. **ISR:** Emulado via stale-while-revalidate (não nativo); cache incremental default é `dummy` (não persiste) — precisa configurar KV/R2 explicitamente pra persistir entre deploys
3. **Node APIs:** Subconjunto disponível via `nodejs_compat` (não tudo que roda em Node.js puro funciona)

**Pro seu caso (landing pages estáticas):** Imagens são diretas (não dinâmicas via `/api/image`), ISR emulado é suficiente, cache `dummy` é aceitável no MVP (revisitar se o volume de tráfego justificar KV/R2).

---

## 3. Supabase — JSONB + RLS

**Fonte:** `/supabase/supabase` (High rep, benchmark 83.63)

### JSONB Column

```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'draft',
  blocks JSONB NOT NULL DEFAULT '[]',
  brand_primary_color TEXT,
  brand_font_family TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Acessar JSON em queries:**
```sql
-- Buscar todas as landing pages com um bloco do tipo 'hero'
SELECT * FROM landing_pages
WHERE blocks @> '[{"type": "hero"}]';

-- Modificar um valor dentro do JSON
UPDATE landing_pages
SET blocks = jsonb_set(
  blocks,
  '{0, headline}',
  '"Nova headline"'
)
WHERE domain = 'forgecompany.example.com';
```

### Validação de JSON Schema

Supabase suporta `pg_jsonschema` (extensão PostgreSQL):

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;

-- Criar tabela com validação
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY,
  domain TEXT,
  blocks JSONB,
  
  CHECK (
    json_matches_schema(
      '{
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "variant": { "type": "string" }
          },
          "required": ["type"]
        }
      }',
      blocks
    )
  )
);
```

**⚠️ Nota:** Essa validação é **no DB level**, mas você quer fazer em **App level com Zod** — mais legível, customizável, e com mensagens de erro boas pra debug. A validação Zod no `lib/schemas/blocks.ts` é o caminho.

### Row-Level Security (RLS)

Padrão para leads (insert anônimo, select só via tenant):

```sql
-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: qualquer um pode inserir (form submission)
CREATE POLICY "Anyone can insert leads"
ON leads FOR INSERT
WITH CHECK (true);

-- Policy: ninguém pode ler/deletar (só app server lê)
CREATE POLICY "No direct public read"
ON leads FOR SELECT
USING (false);

-- App server (service-role key) lê tudo
-- Client-side nunca tem acesso
```

**Para landing_pages (leitura pública só se published):**
```sql
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are readable"
ON landing_pages FOR SELECT
USING (status = 'published');

CREATE POLICY "Only authenticated users can update"
ON landing_pages FOR UPDATE
USING (auth.uid() IS NOT NULL);
```

---

## 4. Cloudflare Turnstile — Server-Side Validation

**Fonte:** `/websites/developers_cloudflare_turnstile` (High rep, benchmark 86.16)

### Fluxo Completo (Client + Server)

**Client-side (CtaFormBlock.tsx):**
```typescript
import Turnstile from 'react-turnstile'

export function CtaForm() {
  const [token, setToken] = useState<string>('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // token vem do widget Turnstile
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, phone, message, token
      })
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" required />
      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        onToken={setToken}
      />
      <button>Enviar</button>
    </form>
  )
}
```

**Server-side (app/api/leads/route.ts — Server Action):**
```typescript
export async function POST(request: Request) {
  const { name, email, phone, message, token } = await request.json()
  
  // Validar Turnstile
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  const ip = request.headers.get('CF-Connecting-IP') || ''
  
  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: turnstileSecret,
        response: token,
        remoteip: ip
      })
    }
  )
  
  const turnstileResult = await turnstileResponse.json()
  if (!turnstileResult.success) {
    return Response.json({ error: 'Bot check failed' }, { status: 400 })
  }
  
  // Validar com Zod (v4 — `.email()` como método de string foi depreciado
  // em favor da factory de topo `z.email()`; ver correção no fim do doc)
  const schema = z.object({
    name: z.string().min(1),
    email: z.email(),
    phone: z.string().optional(),
    message: z.string().optional()
  })
  
  const parsed = schema.safeParse({ name, email, phone, message })
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }
  
  // Inserir em Supabase (service-role key, server-only)
  const supabase = createClient({ options: { auth: { persistSession: false } } })
  const { data, error } = await supabase
    .from('leads')
    .insert({
      landing_page_id: request.headers.get('x-tenant-id'),
      ...parsed.data,
      created_at: new Date()
    })
  
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  return Response.json({ success: true, id: data[0].id }, { status: 201 })
}
```

### Variáveis de Ambiente

`.env.local`:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=seu-site-key
TURNSTILE_SECRET_KEY=seu-secret-key

NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cloudflare Workers (depois)
WRANGLER_ACCOUNT_ID=...
```

---

## Arquitetura Consolidada (Pós-Revisão)

```
Request HTTP
  ↓
proxy.ts → lê Host, busca tenant no Supabase, injeta x-tenant-host
  ↓
app/page.tsx (Server Component) → busca landing_pages.blocks via Supabase
  ↓
blockComponentMap renderiza array de blocos React
  ↓
Form submit → api/leads (POST)
  ↓
Turnstile validation + Zod schema + Supabase insert
  ↓
Response ao client
```

**Checklist pré-Fase 1:**
- [ ] `proxy.ts` criado (teste com curl -H "Host: ...")
- [ ] `lib/schemas/blocks.ts` com Zod schemas
- [ ] `lib/types/blocks.ts` com tipos TypeScript
- [ ] Primeiro bloco React (Hero) renderizando conteúdo JSON
- [ ] `.env.local` com secrets (TURNSTILE_*, SUPABASE_*)
- [ ] `next dev` rodando sem erros
- [ ] `wrangler dev` rodando (opcionalmente, pro ambiente local)

---

---

## Versões Verificadas Nesta Revisão (2026-08-04)

Confirmadas via `npm view <pkg> version` + Context7, corrigindo o que a revisão original tinha desatualizado ou genérico:

| Pacote | Doc original dizia | Versão estável atual |
|---|---|---|
| `next` | 14 | **16.3.0** |
| `react` / `react-dom` | 19 (já certo) | 19.2.8 |
| `@opennextjs/cloudflare` | `wrangler.toml` genérico | **1.20.2** — `wrangler.jsonc` + `open-next.config.ts` |
| `wrangler` | não fixado | 4.118.0 |
| `zod` | v3 implícito (`.string().email()`) | **4.4.3** — `z.email()`, `error` no lugar de `message`/`invalid_type_error`/`errorMap` |
| `@supabase/supabase-js` | 2.110.1 | 2.112.0 |
| `tailwindcss` | v4 (já certo) | 4.3.3 |

Zod v4 mantém `.safeParse()`, `.default()`, `.catch()`, `.pipe()` e `.min()`/`.max()` idênticos à v3 — só os métodos de formato de string (`.email()`, `.url()`, `.uuid()`, etc.) viraram factories de topo (`z.email()`, `z.url()`), e os params de customização de erro consolidaram em `error` (string ou função), com `message`/`invalid_type_error`/`required_error`/`errorMap` removidos.

**Próximo:** Iniciar Fase 0 com Bash seguindo este plano + MVP_REWRITE_CONTEXT.md.
