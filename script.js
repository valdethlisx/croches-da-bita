/* ==========================================================================
   Crochês da Bita · Catálogo
   - Lê os produtos de products.json (não é preciso mexer neste arquivo para
     cadastrar, editar ou remover bolsas).
   - Filtros, busca, ordenação, página de detalhes com endereço próprio
     (?bolsa=slug), ampliação de fotos, contato pelo Instagram e compartilhamento.
   ========================================================================== */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- Configurações ---------- */
  const CONFIG = {
    dataUrl: 'products.json',
    instagramUser: 'crochesdabita',
    whatsapp: '5511952251458', // DDI + DDD + número, só dígitos (substituído por loja.whatsapp do products.json)
    // Faixas de preço do filtro (em reais). Ajuste se os preços mudarem muito.
    faixasPreco: [
      { id: 'ate-150', label: 'Até R$ 150', min: 0, max: 150 },
      { id: '150-250', label: 'R$ 150 a R$ 250', min: 150, max: 250 },
      { id: 'acima-250', label: 'Acima de R$ 250', min: 250, max: Infinity },
    ],
  };

  const DISPONIBILIDADE = {
    'pronta-entrega': 'Pronta entrega',
    'sob-encomenda': 'Sob encomenda',
    'consultar': 'Consulte a disponibilidade',
    'esgotada': 'Esgotada',
  };

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const igProfile = () => `https://www.instagram.com/${CONFIG.instagramUser}/`;

  /** Preço cadastrado? (preço vazio/null = "Sob consulta") */
  const temPreco = (p) => typeof p.preco === 'number' && isFinite(p.preco);
  const precoTxt = (p) => (temPreco(p) ? brl.format(p.preco) : 'Sob consulta');
  /** "bolsa" para bolsas, "peça" para itens de mesa posta e outros */
  const ehBolsa = (p) => !/mesa|acess/i.test(p.categoria || '');
  const nomeTipo = (p) => (ehBolsa(p) ? 'bolsa' : 'peça');

  /**
   * Conversa no WhatsApp da Bita com a mensagem do produto.
   * Em peças com mais de uma cor, a cor escolhida entra junto do nome.
   */
  const waContato = (p, cor) => {
    const nome = cor && (p.cores || []).length > 1 ? `${p.nome} (cor ${cor})` : p.nome;
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Olá, Bita! Vi o produto ${nome} e gostaria de mais informações.`)}`;
  };

  /** Fotos de uma cor (fotos sem "cor" valem para todas). Sem fotos da cor, devolve todas. */
  function fotosPara(p, cor) {
    const fotos = p.fotos || [];
    if (!cor) return fotos;
    const daCor = fotos.filter((f) => !f.cor || f.cor === cor);
    return daCor.length ? daCor : fotos;
  }

  /** Endereço público de uma bolsa (funciona em qualquer hospedagem estática). */
  const productUrl = (slug, cor) => {
    const u = new URL(window.location.href);
    u.hash = '';
    u.search = '';
    u.searchParams.set('bolsa', slug);
    if (cor) u.searchParams.set('cor', cor);
    return u.toString();
  };

  /** Copia texto para a área de transferência (com alternativa para navegadores antigos). */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  /* ---------- Estado ---------- */
  const state = {
    produtos: [],
    loja: {},
    filtros: { q: '', modelos: new Set(), categorias: new Set(), cores: new Set(), preco: '', disponibilidade: new Set() },
    ordem: 'destaques',
  };

  /* ==========================================================
     Carregamento dos dados
     ========================================================== */
  async function loadData() {
    try {
      const res = await fetch(CONFIG.dataUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      state.produtos = (data.produtos || []).filter((p) => p && p.slug && p.nome);
      state.loja = data.loja || {};
      if (state.loja.instagram) CONFIG.instagramUser = state.loja.instagram.replace(/^@/, '');
      if (state.loja.whatsapp) CONFIG.whatsapp = String(state.loja.whatsapp).replace(/\D/g, '');
      return true;
    } catch (err) {
      console.error('Não foi possível carregar products.json', err);
      $('#results-count').textContent = 'Não foi possível carregar o catálogo.';
      const empty = $('#empty-state');
      empty.hidden = false;
      empty.innerHTML = `<p class="empty-title">O catálogo não carregou.</p>
        <p>Se você abriu o arquivo direto do computador, o navegador bloqueia a leitura do <code>products.json</code>.
        Abra o site por um servidor local ou pelo endereço publicado (veja o README).</p>`;
      return false;
    }
  }

  /* ==========================================================
     Filtros
     ========================================================== */
  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function chip(group, value, label, type = 'checkbox') {
    return `<label class="chip"><input type="${type}" name="${group}" value="${esc(value)}"><span>${esc(label)}</span></label>`;
  }

  function buildFilters() {
    const P = state.produtos;
    $('[data-group="modelos"]').innerHTML = uniqueSorted(P.map((p) => p.modelo)).map((v) => chip('modelos', v, v)).join('');
    $('[data-group="categorias"]').innerHTML = uniqueSorted(P.map((p) => p.categoria)).map((v) => chip('categorias', v, v)).join('');

    // Cores: uma amostra por nome de cor
    const cores = new Map();
    P.forEach((p) => (p.cores || []).forEach((c) => { if (c && c.nome && !cores.has(c.nome)) cores.set(c.nome, c.hex); }));
    $('[data-group="cores"]').innerHTML = [...cores.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
      .map(([nome, hex]) => `<label class="swatch" title="${esc(nome)}"><input type="checkbox" name="cores" value="${esc(nome)}"><span style="--c:${esc(hex)}"></span><span class="visually-hidden">${esc(nome)}</span></label>`)
      .join('');

    $('[data-group="preco"]').innerHTML = chip('preco', '', 'Todas', 'radio') + CONFIG.faixasPreco.map((f) => chip('preco', f.id, f.label, 'radio')).join('');
    $('[data-group="preco"] input[value=""]').checked = true;
    $('#fs-preco').hidden = !P.some(temPreco); // sem preços cadastrados, o filtro não teria utilidade

    const disp = Object.keys(DISPONIBILIDADE).filter((k) => P.some((p) => p.disponibilidade === k));
    $('[data-group="disponibilidade"]').innerHTML = disp.map((k) => chip('disponibilidade', k, DISPONIBILIDADE[k])).join('');
  }

  function readFilters() {
    const f = state.filtros;
    const form = $('#form-filtros');
    ['modelos', 'categorias', 'cores', 'disponibilidade'].forEach((g) => {
      f[g] = new Set($$(`input[name="${g}"]:checked`, form).map((i) => i.value));
    });
    f.preco = ($(`input[name="preco"]:checked`, form) || {}).value || '';
  }

  function activeFilterCount() {
    const f = state.filtros;
    return f.modelos.size + f.categorias.size + f.cores.size + f.disponibilidade.size + (f.preco ? 1 : 0);
  }

  function clearFilters() {
    $('#form-filtros').reset();
    $('[data-group="preco"] input[value=""]').checked = true;
    $('#busca').value = '';
    state.filtros.q = '';
    readFilters();
    render();
  }

  function matches(p) {
    const f = state.filtros;
    if (f.q) {
      const hay = norm(`${p.nome} ${p.id || ''}`);
      if (!f.q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    if (f.modelos.size && !f.modelos.has(p.modelo)) return false;
    if (f.categorias.size && !f.categorias.has(p.categoria)) return false;
    if (f.cores.size && !(p.cores || []).some((c) => f.cores.has(c.nome))) return false;
    if (f.disponibilidade.size && !f.disponibilidade.has(p.disponibilidade)) return false;
    if (f.preco) {
      const faixa = CONFIG.faixasPreco.find((x) => x.id === f.preco);
      if (faixa && !(temPreco(p) && p.preco >= faixa.min && p.preco < faixa.max)) return false;
    }
    return true;
  }

  const time = (p) => new Date(p.dataInclusao || 0).getTime() || 0;
  const soldLast = (a, b) => (a.disponibilidade === 'esgotada') - (b.disponibilidade === 'esgotada');
  const SORTS = {
    destaques: (a, b) => soldLast(a, b) || (!!b.destaque - !!a.destaque) || time(b) - time(a),
    novidades: (a, b) => time(b) - time(a),
    // Peças "sob consulta" ficam no fim nas ordenações por preço
    menor: (a, b) => (temPreco(b) - temPreco(a)) || (a.preco - b.preco),
    maior: (a, b) => (temPreco(b) - temPreco(a)) || (b.preco - a.preco),
  };

  /* ==========================================================
     Cartões de produto
     ========================================================== */
  /**
   * Etiquetas em ordem de prioridade (no celular o cartão mostra só a primeira).
   * Nos cartões, "Pronta entrega" fica na linha de status; na página da bolsa aparece também como etiqueta.
   */
  function tagsFor(p, { card = false } = {}) {
    const t = [];
    if (p.disponibilidade === 'esgotada') t.push('<span class="tag tag-esgotada">Esgotada</span>');
    if (p.novidade) t.push('<span class="tag tag-novidade">Novidade</span>');
    if (p.exclusiva) t.push('<span class="tag tag-exclusiva">Peça exclusiva</span>');
    if (p.disponibilidade === 'sob-encomenda') t.push('<span class="tag tag-encomenda">Sob encomenda</span>');
    if (p.disponibilidade === 'pronta-entrega' && !card) t.push('<span class="tag">Pronta entrega</span>');
    return t.join('');
  }

  function cardHTML(p) {
    // Com filtro de cor ativo, o cartão mostra as fotos da cor filtrada
    const corFiltro = [...state.filtros.cores].find((c) => (p.cores || []).some((x) => x.nome === c));
    const cor = corFiltro || (p.cores || [])[0]?.nome;
    const fotos = fotosPara(p, cor);
    const f1 = fotos[0] || { src: '', alt: p.nome };
    const f2 = fotos[1];
    const cores = (p.cores || []).map((c) => `<span style="--c:${esc(c.hex)}" title="${esc(c.nome)}"></span>`).join('');
    const coresTxt = (p.cores || []).map((c) => c.nome).join(', ');
    return `
      <li class="card${p.disponibilidade === 'esgotada' ? ' is-soldout' : ''}">
        <div class="card-media">
          <div class="card-tags">${tagsFor(p, { card: true })}</div>
          <img class="img-main" src="${esc(f1.src)}" alt="${esc(f1.alt || p.nome)}" width="800" height="1000" loading="lazy" decoding="async">
          ${f2 ? `<img class="img-alt" src="${esc(f2.src)}" alt="" width="800" height="1000" loading="lazy" decoding="async">` : ''}
        </div>
        <div class="card-body">
          <p class="card-meta">${esc(p.categoria)} · ${esc(p.modelo)}</p>
          <h3 class="card-title">${esc(p.nome)}</h3>
          <div class="card-row">
            <p class="card-price">${precoTxt(p)}</p>
            <div class="dots" role="img" aria-label="Cores disponíveis: ${esc(coresTxt)}">${cores}</div>
          </div>
          <p class="status status-${esc(p.disponibilidade)}">${esc(DISPONIBILIDADE[p.disponibilidade] || '')}</p>
          <a class="link-arrow card-link" href="?bolsa=${encodeURIComponent(p.slug)}${corFiltro ? `&cor=${encodeURIComponent(corFiltro)}` : ''}" data-slug="${esc(p.slug)}" data-cor="${esc(corFiltro || '')}" aria-label="Ver detalhes: ${esc(p.nome)}">
            Ver detalhes ${icon('i-arrow-right')}
          </a>
        </div>
      </li>`;
  }

  /* ==========================================================
     Renderização do catálogo
     ========================================================== */
  function render() {
    const lista = state.produtos.filter(matches).sort(SORTS[state.ordem] || SORTS.destaques);
    $('#product-grid').innerHTML = lista.map(cardHTML).join('');
    $('#empty-state').hidden = lista.length > 0;
    const n = lista.length;
    $('#results-count').textContent = n === 1 ? '1 peça' : `${n} peças`;

    const count = activeFilterCount();
    const fc = $('#filter-count');
    fc.hidden = count === 0;
    fc.textContent = count;

    renderActiveChips();
  }

  function renderActiveChips() {
    const f = state.filtros;
    const chips = [];
    const add = (group, value, label) => chips.push(`<button type="button" class="active-chip" data-group="${group}" data-value="${esc(value)}" aria-label="Remover filtro ${esc(label)}">${esc(label)} ${icon('i-close')}</button>`);
    f.modelos.forEach((v) => add('modelos', v, v));
    f.categorias.forEach((v) => add('categorias', v, v));
    f.cores.forEach((v) => add('cores', v, v));
    f.disponibilidade.forEach((v) => add('disponibilidade', v, DISPONIBILIDADE[v]));
    if (f.preco) add('preco', f.preco, CONFIG.faixasPreco.find((x) => x.id === f.preco)?.label || f.preco);
    if (f.q) add('q', f.q, `“${$('#busca').value.trim()}”`);
    $('#active-filters').innerHTML = chips.join('');
  }

  function bindCatalog() {
    const form = $('#form-filtros');
    form.addEventListener('change', () => { readFilters(); render(); });
    form.addEventListener('submit', (e) => e.preventDefault());

    let t;
    $('#busca').addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => { state.filtros.q = norm(e.target.value); render(); }, 160);
    });
    $('#ordem').addEventListener('change', (e) => { state.ordem = e.target.value; render(); });

    $('#limpar-filtros').addEventListener('click', clearFilters);
    $('#empty-clear').addEventListener('click', clearFilters);

    $('#active-filters').addEventListener('click', (e) => {
      const b = e.target.closest('.active-chip');
      if (!b) return;
      const { group, value } = b.dataset;
      if (group === 'q') { $('#busca').value = ''; state.filtros.q = ''; }
      else if (group === 'preco') { $('[data-group="preco"] input[value=""]').checked = true; }
      else { const inp = $$(`#form-filtros input[name="${group}"]`).find((i) => i.value === value); if (inp) inp.checked = false; }
      readFilters();
      render();
    });

    // Abrir detalhes sem recarregar a página
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-slug]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      openProduct(a.dataset.slug, { push: true, cor: a.dataset.cor || '' });
    });

    // Painel de filtros no celular
    const panel = $('#filtros');
    const backdrop = $('#filters-backdrop');
    const openBtn = $('#abrir-filtros');
    const setPanel = (open) => {
      panel.classList.toggle('is-open', open);
      backdrop.hidden = !open;
      document.body.classList.toggle('filters-open', open);
      openBtn.setAttribute('aria-expanded', String(open));
      if (open) $('#fechar-filtros').focus(); else openBtn.focus({ preventScroll: true });
    };
    openBtn.addEventListener('click', () => setPanel(true));
    $('#fechar-filtros').addEventListener('click', () => setPanel(false));
    $('#aplicar-filtros').addEventListener('click', () => { setPanel(false); $('.catalog-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    backdrop.addEventListener('click', () => setPanel(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) setPanel(false); });
  }

  /* ==========================================================
     Detalhes do produto (?bolsa=slug)
     ========================================================== */
  const pdp = $('#pdp');
  const baseTitle = document.title;
  const metaDesc = $('meta[name="description"]');
  const baseDesc = metaDesc.content;
  let current = null;       // produto aberto
  let currentColor = null;  // cor selecionada
  let currentPhoto = 0;
  let currentFotos = [];    // fotos da cor selecionada
  let openedByPush = false; // se o histórico recebeu uma entrada ao abrir

  /** Cor que entra no link compartilhado (a primeira cor é o padrão e não aparece no link) */
  const corDoLink = () => (current && currentColor && (current.cores || [])[0]?.nome !== currentColor ? currentColor : '');

  function specRow(label, value) {
    return value ? `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>` : '';
  }

  function renderGallery() {
    const fotos = currentFotos;
    $('#pdp-thumbs').innerHTML = fotos.map((f, i) => `
      <button type="button" data-i="${i}" aria-label="Ver foto ${i + 1} de ${fotos.length}" aria-pressed="false">
        <img src="${esc(f.src)}" alt="" width="160" height="200" loading="lazy" decoding="async">
      </button>`).join('');
    $('#pdp-thumbs').hidden = fotos.length < 2;
    $('#pdp-swipe-hint').hidden = fotos.length < 2;
    setPhoto(0);
  }

  function setPhoto(i) {
    const fotos = currentFotos;
    if (!fotos.length) return;
    currentPhoto = (i + fotos.length) % fotos.length;
    const f = fotos[currentPhoto];
    const img = $('#pdp-main-img');
    img.src = f.src;
    img.alt = f.alt || current.nome;
    $$('#pdp-thumbs button').forEach((b, idx) => b.setAttribute('aria-pressed', String(idx === currentPhoto)));
    $('#pdp-count').textContent = fotos.length > 1 ? `${currentPhoto + 1} / ${fotos.length}` : '';
  }

  /**
   * Gesto de deslizar (celular): chama onSwipe(+1 | -1) para deslizes horizontais
   * e devolve uma função que indica se o último toque foi um deslize (para não abrir o zoom).
   */
  function addSwipe(el, onSwipe) {
    let x0 = null, y0 = 0, swiped = false;
    el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; swiped = false; } });
    el.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; onSwipe(dx < 0 ? 1 : -1); }
    });
    el.addEventListener('pointercancel', () => { x0 = null; });
    return () => { const s = swiped; swiped = false; return s; };
  }

  function setColor(nome) {
    const mudouFotos = fotosPara(current, nome) !== currentFotos;
    currentColor = nome;
    $('#pdp-color-name').textContent = nome || '';
    $$('#pdp-swatches button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cor === nome)));
    // A galeria passa a mostrar as fotos da cor escolhida
    const novas = fotosPara(current, nome);
    if (mudouFotos && novas.map((f) => f.src).join() !== currentFotos.map((f) => f.src).join()) {
      currentFotos = novas;
      renderGallery();
    }
    // O link da página acompanha a cor, para compartilhar já na cor certa
    if (pdp.open && current) {
      const url = `?bolsa=${encodeURIComponent(current.slug)}${corDoLink() ? `&cor=${encodeURIComponent(corDoLink())}` : ''}`;
      history.replaceState(history.state, '', url);
    }
    $('#pdp-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`${current.nome} · Crochês da Bita\n${productUrl(current.slug, corDoLink())}`)}`;
    // "Tenho interesse" abre o WhatsApp da Bita com o produto (e a cor) na mensagem
    $('#pdp-interest').href = waContato(current, currentColor);
    $('#pdp-mb-interest').href = waContato(current, currentColor);
  }

  function fillProduct(p, corInicial) {
    current = p;
    currentFotos = [];

    $('#pdp-meta').textContent = `${p.categoria} · ${p.modelo} · Ref. ${p.id}`;
    $('#pdp-tags').innerHTML = tagsFor(p);
    $('#pdp-name').textContent = p.nome;
    $('#pdp-price').textContent = temPreco(p) ? brl.format(p.preco) : 'Preço sob consulta';
    $('#pdp-desc').textContent = p.descricao || '';

    $('#pdp-mb-name').textContent = p.nome;
    $('#pdp-mb-price').textContent = precoTxt(p);
    $('#pdp-mb-interest-label').textContent = p.disponibilidade === 'esgotada' ? 'Consultar' : 'Tenho interesse';

    $('#pdp-swatches').innerHTML = (p.cores || []).map((c) => `
      <button type="button" role="radio" aria-checked="false" data-cor="${esc(c.nome)}" style="--c:${esc(c.hex)}" aria-label="${esc(c.nome)}" title="${esc(c.nome)}"></button>`).join('');
    const cores = (p.cores || []).map((c) => c.nome);
    currentColor = null;
    setColor(cores.includes(corInicial) ? corInicial : (cores[0] || null));
    if (!currentFotos.length) { currentFotos = fotosPara(p, currentColor); renderGallery(); }

    const st = DISPONIBILIDADE[p.disponibilidade] || '';
    $('#pdp-availability').innerHTML = `
      <p class="status status-${esc(p.disponibilidade)}" style="margin:0">${esc(st)}</p>
      ${p.prazoProducao && p.disponibilidade === 'sob-encomenda' ? `<small>Prazo de produção: ${esc(p.prazoProducao)}</small>` : ''}`;

    $('#pdp-interest-label').textContent = p.disponibilidade === 'esgotada' ? 'Perguntar sobre uma nova produção' : `Tenho interesse nesta ${nomeTipo(p)}`;

    $('#pdp-specs').innerHTML = [
      specRow('Altura', p.altura),
      specRow('Largura', p.largura),
      specRow('Profundidade', p.profundidade),
      specRow('Comprimento da alça', p.comprimentoAlca),
      specRow('Material', p.material),
      specRow('Composição do fio', p.composicao),
      specRow('Fechamento', p.fechamento),
      specRow('Forro', p.forro),
      specRow('Ferragens e acabamentos', p.ferragens),
      specRow('Referência', p.id),
    ].join('');

    const aviso = p.ficticio
      ? 'Produto demonstrativo: dados fictícios, que serão substituídos pelas informações reais.'
      : p.provisorio ? 'Nome provisório. Preço, medidas e demais detalhes estão sendo confirmados; fale com a Bita pelo Instagram.' : '';
    $('#pdp-demo').textContent = aviso;
    $('#pdp-demo').hidden = !aviso;

    $('#pdp-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`${p.nome} · Crochês da Bita\n${productUrl(p.slug, corDoLink())}`)}`;

    // Relacionadas: mesma categoria primeiro, depois as demais
    const outras = state.produtos.filter((x) => x.slug !== p.slug)
      .sort((a, b) => (b.categoria === p.categoria) - (a.categoria === p.categoria) || soldLast(a, b) || time(b) - time(a))
      .slice(0, 3);
    $('#pdp-related').innerHTML = outras.map(cardHTML).join('');

    document.title = `${p.nome} · Crochês da Bita`;
    metaDesc.content = (p.descricao || baseDesc).slice(0, 160);
    $('#pdp-scroll').scrollTop = 0;
  }

  function openProduct(slug, { push = false, cor = '' } = {}) {
    const p = state.produtos.find((x) => x.slug === slug);
    if (!p) {
      if (pdp.open) closeProduct();
      return false;
    }
    fillProduct(p, cor);
    if (push) {
      const url = `?bolsa=${encodeURIComponent(slug)}${corDoLink() ? `&cor=${encodeURIComponent(corDoLink())}` : ''}`;
      if (pdp.open) history.replaceState({ bolsa: slug }, '', url);
      else { history.pushState({ bolsa: slug }, '', url); openedByPush = true; }
    }
    if (!pdp.open) {
      pdp.showModal();
      document.documentElement.style.overflow = 'hidden';
    }
    $('.pdp-back', pdp).focus({ preventScroll: true });
    return true;
  }

  /** Fecha os detalhes e devolve o endereço ao catálogo. */
  function closeProduct() {
    if (openedByPush) {
      openedByPush = false;
      history.back(); // o evento popstate fecha o diálogo
      return;
    }
    const u = new URL(window.location.href);
    if (u.searchParams.has('bolsa')) {
      u.searchParams.delete('bolsa');
      history.replaceState({}, '', u.pathname + u.search + '#catalogo');
    }
    hidePdp();
  }

  function hidePdp() {
    if (pdp.open) pdp.close();
    document.documentElement.style.overflow = '';
    document.title = baseTitle;
    metaDesc.content = baseDesc;
    current = null;
  }

  function route() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('bolsa');
    if (slug) {
      if (!openProduct(slug, { cor: params.get('cor') || '' })) {
        toast('Essa bolsa não está mais no catálogo.');
        history.replaceState({}, '', window.location.pathname + '#catalogo');
      }
    } else if (pdp.open) {
      hidePdp();
    }
  }

  function bindProduct() {
    $$('[data-close-pdp]', pdp).forEach((b) => b.addEventListener('click', closeProduct));
    pdp.addEventListener('cancel', (e) => { e.preventDefault(); closeProduct(); }); // tecla Esc
    window.addEventListener('popstate', () => { openedByPush = !!new URLSearchParams(location.search).get('bolsa') && openedByPush; route(); });

    $('#pdp-thumbs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) setPhoto(Number(b.dataset.i));
    });
    $('#pdp-swatches').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cor]');
      if (b) setColor(b.dataset.cor);
    });
    $('#pdp-swatches').addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const btns = $$('#pdp-swatches button');
      const i = btns.findIndex((b) => b.dataset.cor === currentColor);
      const next = btns[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length];
      if (next) { e.preventDefault(); setColor(next.dataset.cor); next.focus(); }
    });

    const wasSwipe = addSwipe($('#pdp-main'), (dir) => setPhoto(currentPhoto + dir));
    $('#pdp-main').addEventListener('click', () => { if (!wasSwipe()) openLightbox(currentPhoto); });

    $('#pdp-copy-link').addEventListener('click', async () => {
      const ok = await copyText(productUrl(current.slug, corDoLink()));
      toast(ok ? 'Link da bolsa copiado' : 'Não foi possível copiar o link');
    });

    if (navigator.share) {
      const b = $('#pdp-native-share');
      b.hidden = false;
      b.addEventListener('click', () => {
        navigator.share({ title: `${current.nome} · Crochês da Bita`, url: productUrl(current.slug, corDoLink()) }).catch(() => {});
      });
    }

    // Relacionadas dentro do diálogo
    $('#pdp-related').addEventListener('click', (e) => {
      const a = e.target.closest('a[data-slug]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      openProduct(a.dataset.slug, { push: true });
    });
  }

  /* ==========================================================
     Ampliação das fotos
     ========================================================== */
  const lb = $('#lightbox');
  let lbIndex = 0;

  function showLb(i) {
    const fotos = currentFotos;
    if (!fotos.length) return;
    lbIndex = (i + fotos.length) % fotos.length;
    const img = $('#lb-img');
    img.src = fotos[lbIndex].src;
    img.alt = fotos[lbIndex].alt || current.nome;
    $('#lb-stage').classList.remove('is-zoomed');
    $('#lb-count').textContent = `${lbIndex + 1} / ${fotos.length}`;
    const multi = fotos.length > 1;
    $('#lb-prev').hidden = !multi;
    $('#lb-next').hidden = !multi;
  }
  function openLightbox(i) { showLb(i); lb.showModal(); }

  function bindLightbox() {
    $('#lb-close').addEventListener('click', () => lb.close());
    $('#lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
    $('#lb-next').addEventListener('click', () => showLb(lbIndex + 1));
    lb.addEventListener('close', () => setPhoto(lbIndex));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    });
    const stage = $('#lb-stage');
    const img = $('#lb-img');
    const lbSwiped = addSwipe(stage, (dir) => { if (!stage.classList.contains('is-zoomed')) showLb(lbIndex + dir); });
    img.addEventListener('click', (e) => {
      if (lbSwiped()) return;
      const r = img.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      stage.classList.toggle('is-zoomed');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!stage.classList.contains('is-zoomed')) return;
      const r = stage.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    // Clique fora da imagem fecha
    lb.addEventListener('click', (e) => {
      if (e.target !== lb && e.target !== stage) return;
      if (lbSwiped()) return; // deslize não fecha
      lb.close();
    });
  }

  /* ==========================================================
     Instagram, rodapé e textos da loja
     ========================================================== */
  function renderLoja() {
    const loja = state.loja;
    const galeria = (loja.galeriaInstagram && loja.galeriaInstagram.length ? loja.galeriaInstagram : Array(6).fill({})).slice(0, 6);
    $('#insta-grid').innerHTML = galeria.map((g, i) => `
      <li>
        <a class="insta-tile" href="${esc(g.link || igProfile())}" target="_blank" rel="noopener" aria-label="${esc(g.legenda || 'Publicação do Instagram')} (abre o Instagram)">
          ${g.imagem
            ? `<img src="${esc(g.imagem)}" alt="${esc(g.legenda || '')}" width="600" height="600" loading="lazy" decoding="async">`
            : `<span class="insta-placeholder">${icon('i-instagram')}<span>Foto ${i + 1}<br>em breve</span></span>`}
        </a>
      </li>`).join('');

    if (loja.encomendas) $('#footer-encomendas').textContent = loja.encomendas;
    const info = $('#footer-info');
    const ig = $('.footer-ig', info);
    if (loja.entrega) ig.insertAdjacentHTML('beforebegin', `<p><strong>Entrega:</strong> ${esc(loja.entrega)}</p>`);
    if (loja.pagamento) ig.insertAdjacentHTML('beforebegin', `<p><strong>Pagamento:</strong> ${esc(loja.pagamento)}</p>`);

    const notice = $('#demo-notice');
    if (state.produtos.some((p) => p.ficticio)) {
      notice.innerHTML = '<strong>Catálogo de demonstração.</strong> Os produtos, preços e medidas exibidos são fictícios e serão substituídos pelas peças reais.';
      notice.hidden = false;
    } else if (state.produtos.some((p) => p.provisorio)) {
      notice.innerHTML = '<strong>Catálogo em montagem.</strong> Nomes, preços e medidas ainda estão sendo confirmados. Para saber mais sobre uma peça, fale com a Bita pelo Instagram.';
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  }

  /* ==========================================================
     Cabeçalho, menu e animações
     ========================================================== */
  function bindHeader() {
    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = $('.menu-toggle');
    const nav = $('#menu');
    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

    // Link ativo conforme a seção visível
    const links = $$('.main-nav ul a');
    const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${en.target.id}`)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  function bindReveal() {
    const els = $$('.reveal, .thread');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible', 'is-drawn')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible', 'is-drawn');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ==========================================================
     Início
     ========================================================== */
  async function init() {
    $('#ano').textContent = new Date().getFullYear();
    bindHeader();
    bindReveal();
    bindLightbox();
    bindProduct();
    bindCatalog();

    const ok = await loadData();
    renderLoja();
    if (!ok) return;
    buildFilters();
    readFilters();
    render();
    route();
  }

  init();
})();
