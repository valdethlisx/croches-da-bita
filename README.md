# Catálogo Crochês da Bita

Site estático (HTML, CSS e JavaScript, sem servidor nem banco de dados), pensado primeiro para o celular. As bolsas ficam todas no arquivo `products.json`: para cadastrar, editar ou remover uma bolsa, não é preciso mexer no layout.

> **Situação atual:** o catálogo tem 3 peças reais, com fotos reais: Bolsa Trança, Bolsa Aba com Mini Bolsa e Sousplat Trançado. **Nomes, preços, medidas e disponibilidade ainda são provisórios** (preço "Sob consulta", status "Consulte a disponibilidade") e o site mostra um aviso de "catálogo em montagem". Quando a Bita confirmar os dados, preencha no editor e desmarque *Dados provisórios* (veja a lista de verificação no fim deste arquivo).

---

## O que tem na pasta

```
croches-da-bita/
├── index.html          → a página do catálogo
├── styles.css          → visual (cores e fontes ficam no topo, em :root)
├── script.js           → filtros, busca, detalhes da bolsa, compartilhamento
├── products.json       → AS BOLSAS e as informações da loja
├── editor.html         → editor de produtos (uso interno, não aparece no menu)
├── README.md           → este guia
└── assets/
    ├── brand/          → logo (marrom, off-white e original), favicon, imagem de compartilhamento
    └── img/
        ├── produtos/   → fotos das bolsas
        └── site/       → foto principal (hero) e fotos do Instagram
```

## Como ver o site no computador

O navegador não deixa o site ler o `products.json` quando você abre o `index.html` com dois cliques. Use um servidor local:

```
npx serve croches-da-bita
```

e abra o endereço que aparecer (algo como `http://localhost:3000`). Depois de publicado, isso não é mais necessário.

---

## 1. Inserir as fotografias reais

As fotos atuais vieram da pasta do Drive: 4 por peça, além da foto principal do topo, 2 em "Sobre a marca" e 6 na galeria do Instagram. Todas foram recortadas e reduzidas, ficando entre 80 e 290 KB cada. Para novas peças, siga o mesmo padrão.

**Formato recomendado:** JPG ou WebP, em pé, proporção **4:5** (por exemplo 1200 × 1500 px), até cerca de 300 KB cada. Use nomes sem acento e sem espaço: `bolsa-aurora-1.jpg`, `bolsa-aurora-2.jpg`…

- **Fotos das bolsas:** coloque os arquivos em `assets/img/produtos/` e informe os caminhos no cadastro da bolsa (campo *Fotografias* do editor, ou `fotos` no `products.json`). A primeira foto é a principal. A segunda aparece quando o mouse passa sobre o cartão, no computador.
- **Foto principal do topo (hero):** basta substituir o arquivo `assets/img/site/hero.jpg` por outro com o mesmo nome.
- **Fotos da seção "Sobre a marca":** duas já usam fotos reais (sacola e embalagem). O espaço "Foto da artesã" ainda está reservado: no `index.html`, troque o `<div class="slot-inner">…</div>` dele por `<img src="assets/img/site/artesa.jpg" alt="Descrição da foto">`.
- **Galeria do Instagram (6 fotos):** salve em `assets/img/site/` (ex.: `insta-1.jpg`) e preencha em *Informações da loja e galeria do Instagram*, no editor (ou em `loja.galeriaInstagram`, no `products.json`). O link da publicação é opcional; sem ele, a foto leva ao perfil.

## 2. Cadastrar uma nova bolsa

**Pelo editor (mais fácil, funciona no celular):**

1. Abra `editor.html` no site publicado (ex.: `https://seu-endereco/editor.html`) ou no servidor local.
2. Toque em **+ Nova bolsa**, preencha os campos e toque em **Salvar esta bolsa**.
3. Toque em **Baixar products.json**.
4. Substitua o `products.json` antigo pelo novo e publique de novo (passo 5).

> O editor **não altera o site sozinho**. Ele guarda um rascunho só no navegador em que você está. O catálogo público só muda depois que você troca o arquivo e publica.

**Direto no arquivo:** copie um bloco `{ … }` dentro de `"produtos"` no `products.json`, cole logo depois (com uma vírgula separando) e altere os valores. O `slug` vira o endereço da bolsa (`?bolsa=slug`): use só letras minúsculas, números e hífens, sem repetir entre bolsas.

Campos de cada bolsa:

| Campo | Exemplo | Observação |
|---|---|---|
| `id` | `"CB-007"` | código de referência, único |
| `slug` | `"bolsa-flor"` | endereço da página da bolsa |
| `nome`, `descricao` | | |
| `modelo` | `"Baguete"` | vira opção do filtro *Modelo* |
| `categoria` | `"Transversal"`, `"Mesa posta"` | vira opção do filtro *Tipo de peça*; com "Mesa posta", o botão diz "nesta peça" em vez de "nesta bolsa" |
| `preco` | `189.9` ou `null` | número com **ponto**, sem "R$"; `null` (vazio no editor) mostra "Sob consulta" |
| `altura`, `largura`, `profundidade`, `comprimentoAlca` | `"16 cm"` | texto livre |
| `material`, `composicao`, `fechamento`, `forro`, `ferragens` | | texto livre; campos vazios não aparecem |
| `cores` | `[{ "nome": "Caramelo", "hex": "#B9875A" }]` | `hex` é o tom da bolinha de cor |
| `fotos` | `[{ "src": "assets/img/produtos/…", "alt": "…" }]` | `alt` descreve a foto |
| `disponibilidade` | `"pronta-entrega"`, `"sob-encomenda"`, `"consultar"` ou `"esgotada"` | `consultar` aparece como "Consulte a disponibilidade" |
| `prazoProducao` | `"15 dias úteis"` | aparece só em *sob encomenda* |
| `novidade`, `exclusiva`, `destaque` | `true` / `false` | etiquetas e ordem dos destaques |
| `dataInclusao` | `"2026-11-26"` | usada em "Novidades" |
| `provisorio` | `true` / `false` | `true` mostra o aviso de nome e dados a confirmar |
| `ficticio` | `false` | `true` mostra o aviso de dados de demonstração |

## 3. Atualizar preços

No editor, escolha a bolsa, altere **Preço (R$)**, salve, baixe o `products.json` e publique. No arquivo, mude o número em `"preco"` (ex.: `229.9`). O site formata em reais sozinho (R$ 229,90). Com o preço vazio, aparece "Sob consulta".

O filtro de preço só aparece quando pelo menos uma peça tem preço. As faixas do filtro (até R$ 150, R$ 150 a R$ 250, acima de R$ 250) ficam no início do `script.js`, em `faixasPreco`, se precisar ajustar.

## 4. Alterar a disponibilidade

No editor, mude **Disponibilidade** para *Pronta entrega*, *Sob encomenda*, *Consulte a disponibilidade* ou *Esgotada*. Bolsas esgotadas continuam no catálogo, com a foto mais clara e no fim da lista, e o botão vira "Perguntar sobre uma nova produção". Para tirar uma bolsa do ar, use **Remover** no editor.

## 5. Publicar o catálogo

### Opção A: GitHub Pages (gratuito, dá para atualizar pelo celular)

1. Crie uma conta em github.com.
2. Crie um repositório **público** (ex.: `catalogo`).
3. Em **Add file → Upload files**, envie **o conteúdo** da pasta `croches-da-bita` (os arquivos e a pasta `assets`, não a pasta em si) e confirme em **Commit changes**.
4. Vá em **Settings → Pages**, em *Source* escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)` e salve.
5. Em 1 ou 2 minutos aparece o endereço: `https://SEU-USUARIO.github.io/catalogo/`.

**Para atualizar depois** (também pelo navegador do celular): abra o repositório, toque no arquivo (ex.: `products.json`), use **Upload files** para enviar a versão nova com o mesmo nome e confirme. O site atualiza em 1 a 2 minutos.

### Opção B: Netlify Drop (mais rápido, pelo computador)

1. Acesse app.netlify.com/drop.
2. Arraste a pasta `croches-da-bita` para a página.
3. O site sai na hora, com um endereço como `https://nome-aleatorio.netlify.app`. Crie uma conta gratuita para manter o site e trocar o nome do endereço.
4. Para atualizar, arraste a pasta de novo na área de *Deploys* do site.

## 6. Obter o link público

- **Catálogo:** é o endereço gerado no passo 5.
- **Bolsa específica:** abra a bolsa e toque em **Copiar link** ou **Enviar pelo WhatsApp**. O link tem o formato `https://seu-endereco/?bolsa=bolsa-aurora` e abre direto naquela bolsa.

A prévia está publicada em **https://valdethlisx.github.io/croches-da-bita/**, e o `index.html` já aponta `og:image`, `og:url` e `canonical` para esse endereço. Se o site mudar de endereço (outro repositório, Netlify ou domínio próprio), atualize essas três linhas no `index.html`. Assim o WhatsApp e o Instagram mostram a imagem da marca quando o link é compartilhado. Como o site é estático, os links de cada bolsa mostram essa mesma imagem geral na prévia.

## 7. Colocar o link na bio do Instagram

No app do Instagram: **Perfil → Editar perfil → Links → Adicionar link externo**. Cole o endereço do catálogo, dê um título (ex.: "Catálogo") e salve. Vale também fixar um story com o link nos destaques.

---

## Como funciona o contato

O botão **Tenho interesse nesta bolsa** monta uma mensagem com o nome da bolsa, a cor escolhida, o código e o link. A cliente toca em **Copiar e abrir Instagram**: a mensagem é copiada e abre a conversa com @crochesdabita (link `ig.me/m/crochesdabita`), onde ela cola o texto. O Instagram não permite deixar a mensagem já escrita na conversa, por isso ela é copiada.

## Identidade visual

- Cores e fontes ficam em `:root`, no início do `styles.css`.
- A paleta foi mantida. A única adaptação é o coral dos botões (`--coral-cta: #DB3236`), um tom um pouco mais profundo que o `#FF4747`, para o texto branco ficar legível (contraste de acessibilidade). O `#FF4747` original continua nos destaques grandes, como os títulos em itálico.
- A logo enviada (versão em preto) foi convertida para marrom chocolate e off-white com fundo transparente, **sem redesenho nem mudança de proporção**. O original está em `assets/brand/logo-original.webp`. O favicon usa o monograma B recortado da própria logo.
- Fontes: Cormorant Garamond (títulos) e Jost (textos), via Google Fonts.

## Lista de verificação antes de publicar

- [x] Trocar os produtos demonstrativos e as ilustrações pelas peças e fotos reais.
- [ ] Confirmar com a Bita os nomes, preços, medidas, composição do fio e disponibilidade das 3 peças, e marcar `provisorio: false`.
- [ ] Confirmar se a mini bolsa é vendida junto com a bolsa de aba ou separada.
- [ ] Incluir a foto da artesã em "Sobre a marca".
- [ ] Preencher entrega e pagamento em *Informações da loja* (ou deixar em branco para não exibir).
- [ ] Se o endereço mudar, ajustar `og:image`, `og:url` e `canonical` no `index.html` (passo 6).
- [ ] Testar um link de bolsa no WhatsApp e o botão do Instagram no celular.
