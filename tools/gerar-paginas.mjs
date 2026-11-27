// ==========================================================================
// Gera as páginas de compartilhamento das peças (prévia do link no WhatsApp,
// Instagram, Facebook etc.).
//
// O WhatsApp e o Instagram não rodam o JavaScript do site, então a prévia
// (foto, nome e descrição) precisa estar no próprio HTML. Para cada peça é
// criada a página  p/<slug>/  e, para cada cor além da primeira,
// p/<slug>/<cor>/ . Quem abre o link é levado direto para a peça no catálogo.
//
// Uso:  node tools/gerar-paginas.mjs
//       SITE_URL=https://seu-endereco/ node tools/gerar-paginas.mjs
// No GitHub, isso roda sozinho a cada publicação (.github/workflows/publicar.yml).
// ==========================================================================
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = (process.env.SITE_URL || 'https://valdethlisx.github.io/croches-da-bita/').replace(/\/?$/, '/');

const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Largura e altura de um JPEG (lê o cabeçalho SOF), para as tags og:image:width/height. */
function jpegSize(file) {
  try {
    const fd = openSync(file, 'r');
    const buf = Buffer.alloc(256 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
    let i = 2;
    while (i < n) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  } catch { /* sem dimensões */ }
  return null;
}

function fotosPara(p, cor) {
  const fotos = p.fotos || [];
  if (!cor) return fotos;
  const daCor = fotos.filter((f) => !f.cor || f.cor === cor);
  return daCor.length ? daCor : fotos;
}

function pagina({ p, cor, url, destino }) {
  const foto = fotosPara(p, cor)[0];
  const titulo = cor && (p.cores || []).length > 1 ? `${p.nome} (${cor})` : p.nome;
  const descricao = (p.descricao || 'Peça artesanal de crochê feita à mão pela Crochês da Bita.').slice(0, 200);
  const img = foto ? SITE_URL + foto.src.replace(/^\.?\//, '') : SITE_URL + 'assets/brand/og-image.jpg';
  const dim = foto ? jpegSize(join(ROOT, foto.src)) : { w: 1200, h: 630 };
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · Crochês da Bita</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Crochês da Bita">
<meta property="og:title" content="${esc(titulo)} · Crochês da Bita">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
${dim ? `<meta property="og:image:width" content="${dim.w}">\n<meta property="og:image:height" content="${dim.h}">\n` : ''}<meta property="og:image:alt" content="${esc(foto?.alt || titulo)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FAF6F0">
<link rel="icon" type="image/png" sizes="32x32" href="${SITE_URL}assets/brand/favicon-32.png">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FAF6F0;color:#3E2A22;font-family:"Jost",system-ui,sans-serif;text-align:center;padding:24px}
  img{width:72px;height:auto;margin:0 auto 16px;display:block}
  p{margin:0 0 18px;font-size:1rem}
  a{display:inline-block;padding:14px 26px;border-radius:999px;background:#DB3236;color:#fff;text-decoration:none;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}
</style>
<script>location.replace(${JSON.stringify(destino)});</script>
</head>
<body>
<main>
  <img src="${SITE_URL}assets/brand/monograma-marrom.png" alt="Crochês da Bita">
  <p>Abrindo <strong>${esc(titulo)}</strong> no catálogo…</p>
  <a href="${esc(destino)}">Ver no catálogo</a>
</main>
</body>
</html>
`;
}

const data = JSON.parse(readFileSync(join(ROOT, 'products.json'), 'utf8'));
const outDir = join(ROOT, 'p');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

let total = 0;
for (const p of data.produtos || []) {
  if (!p || !p.slug || !p.nome) continue;
  const cores = (p.cores || []).map((c) => c.nome).filter(Boolean);
  // Página principal da peça (primeira cor) + uma página para cada outra cor
  const variantes = [null, ...cores.slice(1)];
  for (const cor of variantes) {
    const caminho = cor ? `p/${p.slug}/${slugify(cor)}/` : `p/${p.slug}/`;
    const url = SITE_URL + caminho;
    const destino = SITE_URL + `?bolsa=${encodeURIComponent(p.slug)}` + (cor ? `&cor=${encodeURIComponent(cor)}` : '');
    const dir = join(ROOT, caminho);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), pagina({ p, cor, url, destino }));
    total++;
  }
}
console.log(`${total} páginas de compartilhamento geradas em p/ (SITE_URL=${SITE_URL})`);
