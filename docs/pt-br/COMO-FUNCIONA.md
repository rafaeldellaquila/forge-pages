# Como o projeto funciona (explicação simples)

Este documento explica o forge-pages em linguagem acessível, sem termos técnicos. Serve
para apresentar o produto a pessoas que não são da área de tecnologia.

---

## O que é o forge-pages

É uma plataforma que **vende páginas de captação (landing pages) como produto**. Cada
cliente ganha uma página profissional no **próprio endereço** (por exemplo
`lp.clientefulano.com.br`), feita para atrair contatos interessados ("leads").

A grande vantagem: **um único sistema atende todos os clientes ao mesmo tempo**. Não
construímos um site do zero para cada um — o mesmo sistema mostra a página certa para cada
cliente, com a cara, as cores e os textos dele.

> **Analogia:** pense num prédio de apartamentos. O prédio (o sistema) é um só, mas cada
> apartamento (cliente) é decorado do seu jeito. Quando alguém toca a campainha de um
> endereço, a portaria já sabe para qual apartamento levar — sem precisar construir um
> prédio novo para cada morador.

---

## Como o visitante chega na página certa

Tudo gira em torno do **endereço (domínio)** que a pessoa digitou:

1. O visitante acessa o endereço do cliente (ex.: `lp.clientefulano.com.br`).
2. O sistema **reconhece o endereço** e descobre de qual cliente é aquela página.
3. Ele **monta a página na hora**, com as cores, a fonte e o conteúdo daquele cliente.
4. Se o endereço não pertence a nenhum cliente, mostra "página não encontrada".

---

## As peças do sistema (em palavras simples)

- **O site** — a parte que o visitante vê. É quem recebe o acesso e monta a página.
- **Os blocos** — a página é montada como peças de Lego: um bloco de destaque (topo), um de
  benefícios, um de depoimentos, um de formulário, um de rodapé, etc. Dá para combinar as
  peças de formas diferentes para cada cliente.
- **O banco de dados** — o "arquivo" central. Guarda três coisas: os clientes, o
  **conteúdo** de cada página (a lista de blocos, os textos e as cores) e os contatos
  recebidos (leads). Tudo de forma organizada e segura.
- **O painel do banco** — a tela onde se edita o conteúdo de cada página e se acompanham os
  contatos recebidos. É a mesma ferramenta para as duas coisas, sem precisar de programação
  para o dia a dia.
- **As estatísticas de visitas** — quantas pessoas acessaram cada página, por domínio, sem
  usar cookies de rastreamento (logo, sem aviso de cookies chato para o visitante).

---

## O caminho de um contato (lead)

```
Visitante preenche o formulário na página
   → o sistema confere que não é um robô
   → o contato é salvo com segurança no banco de dados
   → o contato fica disponível no painel, separado por cliente, para ser atendido
```

---

## Por que essa abordagem é boa

- **Escala fácil:** cadastrar um cliente novo é adicionar seus dados e conteúdo — não é
  construir um site novo.
- **Rápido para o visitante:** as páginas são servidas de servidores espalhados pelo mundo,
  próximos de quem acessa.
- **Simples de operar:** um sistema só, uma ferramenta só para conteúdo e leads — menos
  peças para manter e menos custo fixo.
- **Seguro:** os dados dos contatos ficam protegidos, com proteção contra robôs, e seguindo
  boas práticas de privacidade (LGPD).

---

## Em uma frase

> O forge-pages é um "prédio" único e inteligente que entrega, para cada cliente, uma
> página sob medida no endereço dele e captura os interessados — tudo de forma automática e
> organizada.
