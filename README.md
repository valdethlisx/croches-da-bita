# Catálogo Crochês da Bita

Site estático (HTML, CSS e JavaScript, sem servidor nem banco de dados), pensado primeiro para o celular. As bolsas ficam todas no arquivo `products.json`: para cadastrar, editar ou remover uma bolsa, não é preciso mexer no layout.

> **Situação atual:** o catálogo tem 8 peças reais, com fotos reais e tratadas: Bolsa Trança (em 4 cores), Bolsa Concha, Bolsa Aba com Mini Bolsa, Bolsa Corrente, Bolsa Alça Reta, Porta-Garrafa, Sousplat Trançado e Sousplat Rendado. **Nomes, preços, medidas e disponibilidade ainda são provisórios** (preço "Sob consulta", status "Consulte a disponibilidade") e o site mostra um aviso de "catálogo em montagem". Quando a Bita confirmar os dados, preencha no editor e desmarque *Dados provisórios* (veja a lista de verificação no fim deste arquivo).

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

As fotos atuais vieram da pasta do Drive e passaram por curadoria: até 4 por peça (ou por cor), além da foto principal do topo e de 6 na galeria do Instagram. Todas foram endireitadas, enquadradas em 4:5 e tratadas da mesma forma: luz amarelada neutralizada, níveis, contraste e nitidez. Fotos pequenas não foram ampliadas. Para novas peças, siga o mesmo padrão.

**Peças com várias cores:** em cada foto, preencha `"cor"` com o nome exato de uma das cores da peça. Ao tocar na bolinha da cor, a galeria mostra só as fotos dela; com o filtro de cor do catálogo, o cartão também mostra a foto da cor filtrada. O link da página acompanha a cor (ex.: `?bolsa=bolsa-tranca&cor=Azul-marinho`).

**Formato recomendado:** JPG ou WebP, em pé, proporção **4:5** (por exemplo 1200 × 1500 px), até cerca de 300 KB cada. Use nomes sem acento e sem espaço: `bolsa-aurora-1.jpg`, `bolsa-aurora-2.jpg`…

- **Fotos das bolsas:** coloque os arquivos em `assets/img/produtos/` e informe os caminhos no cadastro da bolsa (campo *Fotografias* do editor, ou `fotos` no `products.json`). A primeira foto é a principal. A segunda aparece quando o mouse passa sobre o cartão, no computador.
- **Foto principal do topo (hero):** basta substituir o arquivo `assets/img/site/hero.jpg` por outro com o mesmo nome.
- **Fotos da seção "Sobre a marca":** os três espaços (artesã, processo de produção e materiais e fios) ainda estão reservados. Quando tiver as fotos, troque no `index.html` o `<div class="slot-inner">…</div>` de cada um por `<img src="assets/img/site/artesa.jpg" alt="Descrição da foto">`.
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

**Cache:** o GitHub Pages deixa o navegador guardar os arquivos por até 10 minutos. Por isso, logo depois de publicar, quem já abriu o site pode continuar vendo a versão anterior por alguns minutos. Para ver na hora, recarregue a página (no computador, Ctrl+F5; no celular, feche a aba e abra o link de novo). Mudanças só no `products.json` aparecem logo ao recarregar, porque o site sempre busca a versão mais nova desse arquivo. **Se mudar o `styles.css`, o `script.js` ou as imagens da marca**, aumente o número `?v=` que aparece no `index.html` (ex.: de `?v=20261127-1` para `?v=20261127-2`) em todos os lugares onde ele aparece. Assim ninguém fica com uma mistura de arquivos antigos e novos.

### Opção B: Netlify Drop (mais rápido, pelo computador)

1. Acesse app.netlify.com/drop.
2. Arraste a pasta `croches-da-bita` para a página.
3. O site sai na hora, com um endereço como `https://nome-aleatorio.netlify.app`. Crie uma conta gratuita para manter o site e trocar o nome do endereço.
4. Para atualizar, arraste a pasta de novo na área de *Deploys* do site.

## 6. Obter o link público

- **Catálogo:** é o endereço gerado no passo 5.
- **Peça específica:** abra a peça e toque em **Copiar link** ou **Compartilhar no WhatsApp**. O link tem o formato `https://valdethlisx.github.io/croches-da-bita/p/bolsa-tranca/` (e, para outra cor, `.../p/bolsa-tranca/azul-marinho/`). Na prévia do WhatsApp e do Instagram aparecem a foto, o nome e a descrição da própria peça, e quem toca é levado direto para ela no catálogo. Esse também é o link que vai na mensagem do "Tenho interesse".

**Como as páginas de compartilhamento são criadas:** a cada publicação no GitHub (inclusive quando você troca o `products.json` pelo navegador), a automação `.github/workflows/publicar.yml` roda `tools/gerar-paginas.mjs`, gera as páginas `p/…` a partir do `products.json` e publica o site. Leva 1 a 2 minutos, e o andamento aparece na aba **Actions** do repositório. A pasta `p/` não fica no repositório: ela é gerada a cada publicação. Se um link de peça for aberto antes da página existir, o `404.html` leva a pessoa para a peça no catálogo do mesmo jeito. **No Netlify**, configure o comando de build como `node tools/gerar-paginas.mjs` com a variável `SITE_URL` igual ao endereço do site.

A prévia está publicada em **https://valdethlisx.github.io/croches-da-bita/**, e o `index.html` já aponta `og:image`, `og:url` e `canonical` para esse endereço. Se o site mudar de endereço (outro repositório, Netlify ou domínio próprio), atualize essas três linhas no `index.html`. Assim o WhatsApp e o Instagram mostram a imagem da marca quando o link do catálogo é compartilhado; os links de cada peça mostram a foto da peça.

## 7. Colocar o link na bio do Instagram

No app do Instagram: **Perfil → Editar perfil → Links → Adicionar link externo**. Cole o endereço do catálogo, dê um título (ex.: "Catálogo") e salve. Vale também fixar um story com o link nos destaques.

---

## Como funciona o contato

Na página de cada peça, o botão **Tenho interesse** (também na barra fixa do celular) abre uma conversa no **WhatsApp** da Bita já com a mensagem "Olá, Bita! Vi o produto [nome da peça] e gostaria de mais informações.". Em peças com várias cores, a cor escolhida entra junto do nome, por exemplo "Bolsa Trança (cor Azul-marinho)". O link da peça (já na cor escolhida) vai na linha de baixo, para a Bita ver exatamente qual é. O número fica em `products.json`, em `loja.whatsapp` (só dígitos, com DDI e DDD: `5511952251458`), e também pode ser trocado no editor.

O Instagram aparece no cabeçalho, na seção "Mais inspiração" e no rodapé, como link para o perfil @crochesdabita.

## Identidade visual

- Cores e fontes ficam em `:root`, no início do `styles.css`.
- A paleta foi mantida. A única adaptação é o coral dos botões (`--coral-cta: #DB3236`), um tom um pouco mais profundo que o `#FF4747`, para o texto branco ficar legível (contraste de acessibilidade). O `#FF4747` original continua nos destaques grandes, como os títulos em itálico.
- A logo enviada (versão em preto) foi convertida para marrom chocolate e off-white com fundo transparente, **sem redesenho nem mudança de proporção**. O original está em `assets/brand/logo-original.webp`. O cabeçalho, a barra da página da peça e o ícone da aba do navegador usam só o monograma B, recortado da própria logo (`monograma-marrom.png`). A logo completa aparece no rodapé e na etiqueta de cuidados.
- Fontes: Cormorant Garamond (títulos) e Jost (textos), via Google Fonts.

## Lista de verificação antes de publicar

- [x] Trocar os produtos demonstrativos e as ilustrações pelas peças e fotos reais.
- [ ] Confirmar com a Bita os nomes, preços, medidas, composição do fio e disponibilidade das 8 peças, e marcar `provisorio: false`.
- [ ] Conferir os nomes das cores (ex.: "Marrom e off-white", "Caramelo") e o material da Bolsa Concha e dos sousplats.
- [ ] Enviar mais fotos da Bolsa Alça Reta (hoje há uma só).
- [ ] Enviar fotos melhores da Bolsa Corrente (só há uma, de resolução baixa) e do Sousplat Rendado caramelo (a foto atual ficou de fora por estar borrada).
- [ ] Confirmar se a mini bolsa é vendida junto com a bolsa de aba ou separada.
- [ ] Incluir as fotos de "Sobre a marca" (artesã, processo de produção, materiais e fios).
- [ ] Preencher entrega e pagamento em *Informações da loja* (ou deixar em branco para não exibir).
- [ ] Se o endereço mudar, ajustar `og:image`, `og:url` e `canonical` no `index.html` (passo 6).
- [ ] Testar um link de bolsa no WhatsApp e o botão do Instagram no celular.
