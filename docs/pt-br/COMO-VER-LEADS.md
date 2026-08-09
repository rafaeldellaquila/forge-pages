# Como ver os leads (contatos) no Supabase

Este documento explica, em linguagem simples, como acompanhar os contatos ("leads") que
chegam pelas landing pages — sem precisar de conhecimento técnico.

---

## O que é um lead

Um lead é um contato interessado que preencheu o formulário em uma das landing pages
(nome, WhatsApp, e-mail, mensagem). O caminho é sempre o mesmo:

```
Visitante preenche o formulário na página
   → o sistema confere que não é um robô
   → o contato é salvo com segurança no banco de dados (Supabase)
   → o contato fica disponível para consulta, separado por cliente/domínio
```

Não existe hoje um painel próprio para leads — eles ficam guardados no Supabase, a mesma
ferramenta usada para editar o conteúdo das páginas. Você vai acessá-los por lá.

---

## Como pedir acesso

O acesso ao Supabase é feito por **convite de membro do projeto** — quem já tem acesso
(o Rafael) precisa te adicionar pelo painel da Supabase.

> **Atenção:** esse convite dá acesso a **todo o projeto**, não só à lista de leads. Hoje
> não existe uma forma de liberar visão só dos contatos — quem entra, vê a estrutura toda do
> banco (o que é normal e esperado numa ferramenta técnica). Trate o acesso como algo
> pessoal e não compartilhe seu login.

Depois de aceitar o convite, você acessa pelo navegador, sem instalar nada:
`https://supabase.com/dashboard` → escolher o projeto da Forge Company.

---

## Passo a passo: encontrando os leads

1. Entre em `https://supabase.com/dashboard` e faça login.
2. Abra o projeto da Forge Company.
3. No menu à esquerda, clique em **Table Editor**.
4. Na lista de tabelas, clique em **leads**.

Você vai ver uma planilha com uma linha por contato recebido.

### O que cada coluna significa

| Coluna | O que é |
| ------ | ------- |
| `name` | Nome informado pelo contato |
| `whatsapp` | WhatsApp informado |
| `email` | E-mail informado (pode estar vazio) |
| `message` | Mensagem que a pessoa escreveu (pode estar vazia) |
| `intent` | O que a pessoa selecionou no formulário (o interesse dela) |
| `domain` | De qual landing page o contato veio (ex.: `forgecompany.example.com`) |
| `status` | Em que ponto do atendimento o lead está (veja abaixo) |
| `created_at` | Data e hora em que o contato chegou |
| `utm_source` / `utm_medium` / `utm_campaign` | De onde veio o clique, se a pessoa chegou por um anúncio/campanha |

---

## Filtrar e ordenar

O Table Editor tem filtro e ordenação prontos, sem precisar digitar nada técnico:

- **Filtrar por cliente**: clique em **Filter** → escolha a coluna `domain` → digite o
  domínio do cliente que quer ver.
- **Filtrar por status**: mesma ideia, na coluna `status`.
- **Ordenar por mais recente**: clique no cabeçalho da coluna `created_at` (por padrão os
  mais novos já aparecem primeiro).

## Exportar para planilha (CSV)

Para gerar uma planilha com os leads filtrados (por exemplo, para enviar por e-mail ou abrir
no Excel): com o filtro aplicado, use o botão de exportar do Table Editor (ícone de
download, próximo ao botão **Filter**) — ele baixa exatamente as linhas visíveis na tela em
formato CSV.

> O CSV exportado contém dados pessoais (nome, WhatsApp, e-mail). Trate como informação
> sensível: não reenvie por canais abertos e apague o arquivo quando não precisar mais dele.

## Atualizando o andamento de um contato

A coluna `status` é o "estágio" do lead, e é **editada direto nessa mesma tabela** — clique
duas vezes na célula e escolha um dos valores:

- `new` — acabou de chegar, ainda não foi contatado.
- `contacted` — já falamos com a pessoa.
- `converted` — virou cliente.
- `lost` — não seguiu adiante.

Manter essa coluna atualizada é o que permite, no futuro, saber quantos leads viram cliente
de fato.

---

## Resumo rápido

1. Pedir convite de acesso ao Supabase.
2. Table Editor → tabela `leads`.
3. Filtrar por `domain` (cliente) e/ou `status`.
4. Exportar em CSV se precisar de uma planilha.
5. Atualizar `status` conforme for atendendo cada contato.
