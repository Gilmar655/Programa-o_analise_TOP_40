const PARC = ['Conecta', 'Start', 'Engelmig'];
const colOf = (p) => dash.colors[PARC.indexOf(p)] || 'var(--cds-chart-muted)';
const L = d3.formatLocale({decimal: ',', thousands: '.', grouping: [3], currency: ['R$ ', '']});
const fN = L.format(',d');
const fP = L.format('.1%');
const fH = L.format(',.1f');
const parseD = d3.utcParse('%Y-%m-%d');
const keyD = d3.utcFormat('%Y-%m-%d');
const fD = d3.utcFormat('%d/%m');
const fDL = d3.utcFormat('%d/%m/%Y');
const WD = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const STATUS_ORDER = ['Liberado para Execução', 'Liberado para Documentação', 'Pendente de Aprovação', 'Rascunho', 'Cancelado'];
const FILTERS = ['parceira', 'regiao', 'tipo', 'status', 'de', 'ate'];
const state = {sort: {k: 'data', dir: 1}, q: ''};

const allRows = () => {
  const g = dash.data('prog');
  return g.status === 'ok' && Array.isArray(g.data) ? g.data : null;
};
const isCanc = (x) => x.cancelada === true || x.cancelada === 'true';
const hrs = (x) => Number(x.janela_h) || 0;
const filtered = () => {
  const r = allRows();
  if (!r) return null;
  const p = dash.params();
  return r.filter((x) =>
    (!p.parceira || x.parceira === p.parceira) &&
    (!p.regiao || x.regiao === p.regiao) &&
    (!p.tipo || x.tipo === p.tipo) &&
    (!p.status || x.status === p.status) &&
    (!p.de || x.data >= p.de) &&
    (!p.ate || x.data <= p.ate));
};
const range = () => {
  const A = allRows();
  const p = dash.params();
  return [p.de || d3.min(A, (x) => x.data), p.ate || d3.max(A, (x) => x.data)];
};
const calDays = () => {
  const [a, b] = range();
  return d3.utcDay.range(parseD(a), d3.utcDay.offset(parseD(b), 1));
};
const toggle = (name, value) => {
  const cur = dash.params()[name];
  dash.setParams({[name]: cur === value ? null : value});
};

// ---------- legends, tabs, filters (fixed controls) ----------
const paintLegends = () => {
  document.querySelectorAll('.sw-c').forEach((e) => { e.style.background = dash.colors[0]; });
  document.querySelectorAll('.sw-s').forEach((e) => { e.style.background = dash.colors[1]; });
  document.querySelectorAll('.sw-e').forEach((e) => { e.style.background = dash.colors[2]; });
};
const showTab = (id) => {
  document.querySelectorAll('.pg-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
  document.querySelectorAll('.pg-sec[data-sec]').forEach((s) => { s.hidden = s.dataset.sec !== id; });
};
document.querySelectorAll('.pg-tab').forEach((b) => b.addEventListener('click', () => { showTab(b.dataset.tab); dash.setLink(b.dataset.tab); }));
const startTab = location.hash.slice(1);
if (['visao', 'territorio', 'qualidade', 'base'].includes(startTab)) showTab(startTab);

document.querySelectorAll('.f-date').forEach((inp) => {
  inp.addEventListener('change', () => {
    if (!inp.value) dash.setParams({[inp.dataset.p]: null});
    else if (inp.validity.valid && /^20\d\d-\d\d-\d\d$/.test(inp.value)) dash.setParams({[inp.dataset.p]: inp.value});
  });
  inp.addEventListener('blur', () => { inp.value = dash.params()[inp.dataset.p] || ''; });
});
document.querySelectorAll('.f-reset').forEach((b) => b.addEventListener('click', () => {
  const clear = {};
  FILTERS.forEach((f) => { clear[f] = null; });
  dash.setParams(clear);
  dash.resetParams();
}));
document.querySelectorAll('.d-search').forEach((inp) => inp.addEventListener('input', () => { state.q = inp.value.trim().toLowerCase(); dash.draw('d-tabela'); dash.draw('d-count'); }));
document.querySelectorAll('th.sortable').forEach((th) => th.addEventListener('click', () => {
  const k = th.dataset.k;
  state.sort = {k, dir: state.sort.k === k ? -state.sort.dir : 1};
  document.querySelectorAll('th.sortable').forEach((t) => t.setAttribute('aria-sort', t.dataset.k === k ? (state.sort.dir > 0 ? 'ascending' : 'descending') : 'none'));
  dash.draw('d-tabela');
}));

dash.onData(() => {
  paintLegends();
  document.querySelectorAll('.f-date').forEach((inp) => { if (inp !== document.activeElement) inp.value = dash.params()[inp.dataset.p] || ''; });
});

// ---------- filter selects ----------
const LABEL_ALL = {parceira: 'Todas as parceiras', regiao: 'Todas as regiões', tipo: 'Todos os tipos', status: 'Todos os status'};
dash.draw('f-sel', (sel) => {
  const A = allRows();
  const f = sel.dataset.p;
  let vals = A ? Array.from(new Set(A.map((x) => x[f]))) : [];
  if (f === 'parceira') vals = PARC.filter((p) => vals.includes(p));
  else if (f === 'status') vals = STATUS_ORDER.filter((s) => vals.includes(s)).concat(vals.filter((s) => !STATUS_ORDER.includes(s)));
  else vals.sort();
  sel.replaceChildren(new Option(LABEL_ALL[f] || 'Todos', ''), ...vals.map((v) => new Option(v, v)));
  sel.value = dash.params()[f] || '';
  sel.onchange = () => dash.setParams({[f]: sel.value || null});
});

// ---------- KPIs ----------
const kpi = (name, f) => dash.draw(name, (el) => {
  const r = filtered();
  el.textContent = r ? f(r) : '—';
});
const nStatus = (r, s) => r.filter((x) => x.status === s).length;
kpi('k-total', (r) => fN(r.length));
kpi('k-total-txt', (r) => fN(r.length));
kpi('k-proj', (r) => fN(new Set(r.map((x) => x.projeto)).size));
kpi('k-canc', (r) => fN(r.filter(isCanc).length));
kpi('k-taxa', (r) => (r.length ? fP(r.filter(isCanc).length / r.length) : '—'));
kpi('k-exec', (r) => fN(nStatus(r, 'Liberado para Execução')));
kpi('k-exec-p', (r) => (r.length ? fP(nStatus(r, 'Liberado para Execução') / r.length) : '—'));
kpi('k-doc', (r) => fN(nStatus(r, 'Liberado para Documentação')));
kpi('k-doc-p', (r) => (r.length ? fP(nStatus(r, 'Liberado para Documentação') / r.length) : '—'));
kpi('k-pend', (r) => fN(nStatus(r, 'Rascunho') + nStatus(r, 'Pendente de Aprovação')));
kpi('k-horas', (r) => fH(d3.sum(r, hrs)));
kpi('k-jmed', (r) => (r.length ? fH(d3.mean(r, hrs)) : '—'));
kpi('k-media', (r) => { const n = calDays().length; return n ? fH(r.length / n) : '—'; });
kpi('k-pico', (r) => {
  if (!r.length) return '—';
  const m = d3.rollups(r, (v) => v.length, (x) => x.data).sort((a, b) => b[1] - a[1] || d3.ascending(a[0], b[0]))[0];
  return fN(m[1]) + ' em ' + fDL(parseD(m[0]));
});
kpi('t-periodo', () => { const [a, b] = range(); return fDL(parseD(a)) + ' a ' + fDL(parseD(b)); });
dash.draw('t-periodo-all', (el) => {
  const A = allRows();
  el.textContent = A ? fDL(parseD(d3.min(A, (x) => x.data))) + ' a ' + fDL(parseD(d3.max(A, (x) => x.data))) : '—';
});
kpi('t-lider', (r) => {
  if (!r.length) return '—';
  const m = d3.rollups(r, (v) => v.length, (x) => x.parceira).sort((a, b) => b[1] - a[1])[0];
  return m[0] + ' (' + fP(m[1] / r.length) + ')';
});
kpi('t-canc', (r) => {
  const m = d3.rollups(r, (v) => v.filter(isCanc).length / v.length, (x) => x.parceira).sort((a, b) => b[1] - a[1])[0];
  return m ? m[0] + ' (' + fP(m[1]) + ')' : '—';
});

// ---------- shared chart helpers ----------
const tipOf = (el) => {
  const t = document.createElement('div');
  t.className = 'pg-tip';
  t.hidden = true;
  el.appendChild(t);
  return {
    show(ev, head, lines) {
      const h = document.createElement('div');
      h.className = 'h';
      h.textContent = head;
      const rows = lines.map((ln) => {
        const d = document.createElement('div');
        d.className = 'r';
        if (ln.c) { const i = document.createElement('i'); i.style.background = ln.c; d.appendChild(i); }
        const s = document.createElement('span'); s.textContent = ln.l; d.appendChild(s);
        const b = document.createElement('b'); b.textContent = ln.v; d.appendChild(b);
        return d;
      });
      t.replaceChildren(h, ...rows);
      t.hidden = false;
      const box = el.getBoundingClientRect();
      const x = ev.clientX - box.left, y = ev.clientY - box.top;
      const tw = t.offsetWidth, th = t.offsetHeight;
      let left = x + 14;
      if (left + tw > box.width) left = Math.max(0, x - tw - 14);
      let top = y - th - 10;
      if (top < 0) top = Math.min(y + 14, Math.max(0, box.height - th));
      t.style.left = left + 'px';
      t.style.top = top + 'px';
    },
    hide() { t.hidden = true; },
  };
};
const measure = (svg, texts) => {
  const t = svg.append('text').attr('visibility', 'hidden');
  let w = 0;
  texts.forEach((s) => { t.text(s); w = Math.max(w, t.node().getComputedTextLength()); });
  t.remove();
  return w;
};
const newSvg = (el, W, H) => d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMinYMin meet').style('display', 'block');

// Horizontal stacked bars. items: [{label, key, parts: {k: n}, total, extra}]
const hstack = (el, items, keys, color, opt = {}) => {
  el.replaceChildren();
  el.style.minHeight = '';
  if (!items.length) { el.textContent = '—'; return; }
  const W = Math.max(280, el.clientWidth || 480);
  const row = 30, mt = 4;
  const H = mt + items.length * row + 4;
  const svg = newSvg(el, W, H);
  const lw = Math.min(W * 0.45, measure(svg, items.map((d) => d.label)) + 10);
  const rw = measure(svg, items.map((d) => d.right)) + 10;
  const x = d3.scaleLinear([0, d3.max(items, (d) => d.total) || 1], [lw, W - rw]);
  const tip = tipOf(el);
  const sel = opt.selected;
  const g = svg.selectAll('g.r').data(items).join('g').attr('class', 'r').attr('transform', (d, i) => `translate(0,${mt + i * row})`);
  g.append('text').attr('class', 'lbl').attr('x', lw - 8).attr('y', row / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
    .text((d) => d.label)
    .each(function (d) {
      const max = lw - 8;
      let s = d.label;
      while (s.length > 3 && this.getComputedTextLength() > max) { s = s.slice(0, -1); this.textContent = s.trimEnd() + '…'; }
    });
  g.each(function (d) {
    let acc = 0;
    const gg = d3.select(this);
    keys.forEach((k) => {
      const v = d.parts[k] || 0;
      if (!v) return;
      gg.append('rect').attr('x', x(acc)).attr('y', 6).attr('height', row - 12)
        .attr('width', Math.max(1, x(acc + v) - x(acc) - 2)).attr('rx', 3)
        .style('fill', color(k, d)).style('opacity', sel && sel !== d.key ? 0.35 : 1);
      acc += v;
    });
  });
  g.append('text').attr('x', (d) => x(d.total) + 6).attr('y', row / 2).attr('dy', '0.35em').text((d) => d.right);
  g.append('rect').attr('class', opt.click ? 'hit' : '').attr('x', 0).attr('y', 0).attr('width', W).attr('height', row).style('fill', 'transparent')
    .on('mousemove', (ev, d) => tip.show(ev, d.label, d.tip))
    .on('mouseleave', () => tip.hide())
    .on('click', (ev, d) => { if (opt.click) opt.click(d); });
};
const partnerParts = (v) => { const o = {}; PARC.forEach((p) => { o[p] = v.filter((x) => x.parceira === p).length; }); return o; };
const partnerTip = (v) => PARC.map((p) => ({c: colOf(p), l: p, v: fN(v.filter((x) => x.parceira === p).length)})).filter((ln) => ln.v !== '0')
  .concat([{l: 'Total', v: fN(v.length)}, {l: 'Canceladas', v: fN(v.filter(isCanc).length) + ' (' + fP(v.filter(isCanc).length / v.length) + ')'}]);

// ---------- daily ----------
dash.draw('c-diario', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  el.replaceChildren();
  const days = calDays();
  const by = d3.group(r, (x) => x.data);
  const data = days.map((d) => {
    const k = keyD(d), v = by.get(k) || [];
    const o = {d, k, v, total: v.length, canc: v.filter(isCanc).length};
    PARC.forEach((p) => { o[p] = v.filter((x) => x.parceira === p).length; });
    return o;
  });
  const W = Math.max(300, el.clientWidth || 700), H = 280;
  const svg = newSvg(el, W, H);
  const ymax = d3.max(data, (d) => d.total) || 1;
  const y = d3.scaleLinear([0, ymax], [H - 26, 10]).nice(5);
  const ml = measure(svg, y.ticks(5).map(fN)) + 10;
  const x = d3.scaleBand(data.map((d) => d.k), [ml, W - 6]).paddingInner(0.22).paddingOuter(0.1);
  svg.append('g').selectAll('rect').data(data.filter((d) => d.d.getUTCDay() === 0 || d.d.getUTCDay() === 6)).join('rect')
    .attr('x', (d) => x(d.k) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', 10).attr('height', H - 36)
    .style('fill', 'var(--cds-chart-grid)').style('opacity', 0.45);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1', ml).attr('x2', W - 6).attr('y1', (d) => y(d)).attr('y2', (d) => y(d)).style('stroke', 'var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x', ml - 6).attr('y', (d) => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').text(fN);
  const st = d3.stack().keys(PARC)(data);
  svg.append('g').selectAll('g').data(st).join('g').style('fill', (s) => colOf(s.key))
    .selectAll('rect').data((s) => s).join('rect')
    .attr('x', (d) => x(d.data.k)).attr('width', x.bandwidth())
    .attr('y', (d) => y(d[1])).attr('height', (d) => Math.max(0, y(d[0]) - y(d[1]) - (d[1] > d[0] ? 1.5 : 0))).attr('rx', Math.min(3, x.bandwidth() / 3));
  const step = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor((W - ml) / 46))));
  svg.append('g').selectAll('text').data(data.filter((d, i) => i % step === 0)).join('text')
    .attr('x', (d) => Math.min(W - 6, Math.max(ml, x(d.k) + x.bandwidth() / 2))).attr('y', H - 8)
    .attr('text-anchor', (d) => { const c = x(d.k) + x.bandwidth() / 2; return c > W - 26 ? 'end' : c < ml + 20 ? 'start' : 'middle'; })
    .text((d) => fD(d.d));
  svg.append('line').attr('x1', ml).attr('x2', W - 6).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--cds-chart-axis)');
  const tip = tipOf(el);
  svg.append('g').selectAll('rect').data(data).join('rect')
    .attr('x', (d) => x(d.k) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', 0).attr('height', H - 20).style('fill', 'transparent')
    .on('mousemove', (ev, d) => tip.show(ev, WD[(d.d.getUTCDay() + 6) % 7] + ', ' + fDL(d.d),
      PARC.map((p) => ({c: colOf(p), l: p, v: fN(d[p])})).concat([{l: 'Total', v: fN(d.total)}, {l: 'Canceladas', v: fN(d.canc)}])))
    .on('mouseleave', () => tip.hide());
});

// ---------- partner table ----------
dash.draw('c-parceiras', (tb) => {
  const r = filtered();
  tb.replaceChildren();
  if (!r) return;
  const sel = dash.params().parceira;
  const rows = PARC.map((p) => [p, r.filter((x) => x.parceira === p)]).filter((d) => d[1].length);
  const mk = (p, v, isTotal) => {
    const tr = document.createElement('tr');
    if (!isTotal) tr.addEventListener('click', () => toggle('parceira', p));
    if (sel && sel !== p && !isTotal) tr.style.opacity = '0.45';
    const c = v.filter(isCanc).length;
    const cells = [
      p, fN(v.length), fP(r.length ? v.length / r.length : 0), fN(c), fP(v.length ? c / v.length : 0),
      fN(nStatus(v, 'Liberado para Execução')), fN(nStatus(v, 'Liberado para Documentação')),
      fN(nStatus(v, 'Rascunho') + nStatus(v, 'Pendente de Aprovação')), fH(d3.sum(v, hrs)),
      fH(v.length ? d3.mean(v, hrs) : 0), fN(new Set(v.map((x) => x.projeto)).size), fN(new Set(v.map((x) => x.data)).size),
    ];
    cells.forEach((t, i) => {
      const td = document.createElement('td');
      if (i) td.className = 'num';
      if (i === 0 && !isTotal) { const s = document.createElement('span'); s.className = 'sw'; s.style.background = colOf(p); td.appendChild(s); }
      td.appendChild(document.createTextNode(t));
      if (isTotal) td.style.fontWeight = '600';
      tr.appendChild(td);
    });
    return tr;
  };
  rows.forEach(([p, v]) => tb.appendChild(mk(p, v, false)));
  if (rows.length > 1) tb.appendChild(mk('Total', r, true));
});

// ---------- status ----------
dash.draw('c-status', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const g = d3.group(r, (x) => x.status);
  const keys = STATUS_ORDER.filter((s) => g.has(s)).concat([...g.keys()].filter((s) => !STATUS_ORDER.includes(s)));
  const items = keys.map((s) => { const v = g.get(s); return {label: s, key: s, total: v.length, parts: {n: v.length}, right: fN(v.length) + ' · ' + fP(v.length / r.length), tip: partnerTip(v)}; });
  hstack(el, items, ['n'], (k, d) => (d.key === 'Cancelado' ? 'var(--cds-chart-status-critical)' : 'var(--cds-chart-muted)'),
    {selected: dash.params().status, click: (d) => toggle('status', d.key)});
});

// ---------- weekday ----------
dash.draw('c-semana', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const days = calDays();
  const nd = d3.rollup(days, (v) => v.length, (d) => (d.getUTCDay() + 6) % 7);
  const g = d3.group(r, (x) => (parseD(x.data).getUTCDay() + 6) % 7);
  const items = d3.range(7).map((i) => {
    const v = g.get(i) || [];
    const n = nd.get(i) || 0;
    return {label: WD[i], key: i, total: v.length, parts: partnerParts(v), right: fN(v.length) + ' · ' + (n ? fH(v.length / n) : '—') + '/dia',
      tip: (v.length ? partnerTip(v) : [{l: 'Total', v: '0'}]).concat([{l: 'Dias no período', v: fN(n)}])};
  });
  hstack(el, items, PARC, (k) => colOf(k));
});

// ---------- region ----------
dash.draw('c-regiao', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const items = d3.groups(r, (x) => x.regiao).sort((a, b) => b[1].length - a[1].length)
    .map(([k, v]) => ({label: k, key: k, total: v.length, parts: partnerParts(v), right: fN(v.length) + ' · ' + fP(v.length / r.length), tip: partnerTip(v)}));
  hstack(el, items, PARC, (k) => colOf(k), {selected: dash.params().regiao, click: (d) => toggle('regiao', d.key)});
});

// ---------- type ----------
dash.draw('c-tipo', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const items = d3.groups(r, (x) => x.tipo).sort((a, b) => b[1].length - a[1].length)
    .map(([k, v]) => ({label: k, key: k, total: v.length, parts: partnerParts(v), right: fN(v.length) + ' · ' + fP(v.length / r.length),
      tip: partnerTip(v).concat([{l: 'Janela média', v: fH(d3.mean(v, hrs)) + ' h'}])}));
  hstack(el, items, PARC, (k) => colOf(k), {selected: dash.params().tipo, click: (d) => toggle('tipo', d.key)});
});

// ---------- description ----------
dash.draw('c-descricao', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const items = d3.groups(r, (x) => x.descricao).sort((a, b) => b[1].length - a[1].length || d3.ascending(a[0], b[0]))
    .map(([k, v]) => { const c = v.filter(isCanc).length; return {label: k, key: k, total: v.length, parts: {ativas: v.length - c, canc: c}, right: fN(v.length), tip: partnerTip(v)}; });
  hstack(el, items, ['ativas', 'canc'], (k) => (k === 'canc' ? 'var(--cds-chart-status-critical)' : 'var(--cds-chart-muted)'));
});

// ---------- start hour ----------
dash.draw('c-hora', (el) => {
  const r = filtered();
  if (!r) { el.replaceChildren(); el.textContent = '—'; return; }
  const items = d3.groups(r, (x) => String(x.inicio).slice(11, 13)).sort((a, b) => d3.ascending(a[0], b[0]))
    .map(([k, v]) => ({label: k + 'h', key: k, total: v.length, parts: partnerParts(v), right: fN(v.length), tip: partnerTip(v)}));
  hstack(el, items, PARC, (k) => colOf(k));
});

// ---------- region x type matrix ----------
dash.draw('c-matriz', (el) => {
  const r = filtered();
  el.replaceChildren();
  if (!r) { el.textContent = '—'; return; }
  if (!r.length) { el.textContent = '—'; return; }
  const regs = d3.groups(r, (x) => x.regiao).sort((a, b) => b[1].length - a[1].length).map((d) => d[0]);
  const tipos = d3.groups(r, (x) => x.tipo).sort((a, b) => b[1].length - a[1].length).map((d) => d[0]);
  const m = d3.rollup(r, (v) => v, (x) => x.regiao, (x) => x.tipo);
  const W = Math.max(300, el.clientWidth || 600), rowH = 34, top = 24;
  const H = top + regs.length * rowH + 4;
  const svg = newSvg(el, W, H);
  const lw = measure(svg, regs) + 14;
  const x = d3.scaleBand(tipos, [lw, W - 4]).padding(0.06);
  const y = d3.scaleBand(regs, [top, H - 4]).padding(0.06);
  const max = d3.max(regs.flatMap((rg) => tipos.map((t) => (m.get(rg)?.get(t) || []).length))) || 1;
  svg.append('g').selectAll('text').data(tipos).join('text').attr('x', (d) => x(d) + x.bandwidth() / 2).attr('y', 14).attr('text-anchor', 'middle').attr('class', 'lbl').text((d) => d);
  svg.append('g').selectAll('text').data(regs).join('text').attr('x', lw - 8).attr('y', (d) => y(d) + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end').attr('class', 'lbl').text((d) => d);
  const cells = regs.flatMap((rg) => tipos.map((t) => ({rg, t, v: m.get(rg)?.get(t) || []})));
  const tip = tipOf(el);
  const g = svg.append('g').selectAll('g').data(cells).join('g');
  g.append('rect').attr('x', (d) => x(d.t)).attr('y', (d) => y(d.rg)).attr('width', x.bandwidth()).attr('height', y.bandwidth()).attr('rx', 3)
    .style('fill', (d) => (d.v.length ? dash.colors[0] : 'var(--cds-chart-grid)'))
    .style('fill-opacity', (d) => (d.v.length ? 0.15 + 0.85 * d.v.length / max : 0.5));
  g.append('text').attr('x', (d) => x(d.t) + x.bandwidth() / 2).attr('y', (d) => y(d.rg) + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'middle')
    .style('fill', (d) => (d.v.length / max > 0.5 ? '#ffffff' : 'var(--color-fg)')).style('font-variant-numeric', 'tabular-nums')
    .text((d) => (d.v.length ? fN(d.v.length) : ''));
  g.append('rect').attr('class', 'hit').attr('x', (d) => x(d.t)).attr('y', (d) => y(d.rg)).attr('width', x.bandwidth()).attr('height', y.bandwidth()).style('fill', 'transparent')
    .on('mousemove', (ev, d) => tip.show(ev, d.rg + ' · ' + d.t, d.v.length ? partnerTip(d.v) : [{l: 'Total', v: '0'}]))
    .on('mouseleave', () => tip.hide())
    .on('click', (ev, d) => { if (d.v.length) dash.setParams({regiao: d.rg, tipo: d.t}); });
});

// ---------- quality ----------
const hasOcc = (s, label) => String(s || '').split('; ').includes(label);
dash.draw('q', (el) => {
  const r = filtered();
  el.textContent = r ? fN(r.filter((x) => hasOcc(x.inconsistencia, el.dataset.q) || hasOcc(x.atencao, el.dataset.q)).length) : '—';
});
const cellsRow = (x, cols) => {
  const tr = document.createElement('tr');
  cols.forEach(([k, cls]) => {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    const v = x[k];
    td.textContent = v === null || v === undefined ? '' : (k === 'janela_h' ? L.format(',~f')(Number(v)) : String(v));
    tr.appendChild(td);
  });
  return tr;
};
dash.draw('q-tabela', (tb) => {
  const r = filtered();
  tb.replaceChildren();
  if (!r) return;
  const rows = r.filter((x) => x.inconsistencia || x.atencao)
    .sort((a, b) => (b.inconsistencia ? 1 : 0) - (a.inconsistencia ? 1 : 0) || a.linha - b.linha);
  rows.forEach((x) => tb.appendChild(cellsRow(x, [['linha', 'num'], ['data'], ['parceira'], ['projeto'], ['status'], ['poweron'], ['inicio'], ['inconsistencia', 'bad'], ['atencao', 'warn']])));
});

// ---------- detail table ----------
const searched = () => {
  const r = filtered();
  if (!r) return null;
  if (!state.q) return r;
  return r.filter((x) => Object.values(x).some((v) => String(v).toLowerCase().includes(state.q)));
};
dash.draw('d-count', (el) => { const r = searched(); el.textContent = r ? fN(r.length) : '—'; });
dash.draw('d-tabela', (tb) => {
  const r = searched();
  tb.replaceChildren();
  if (!r) return;
  const {k, dir} = state.sort;
  const num = k === 'linha' || k === 'janela_h';
  const rows = r.slice().sort((a, b) => dir * (num ? Number(a[k]) - Number(b[k]) : d3.ascending(String(a[k]), String(b[k]))) || a.linha - b.linha);
  const frag = document.createDocumentFragment();
  rows.forEach((x) => frag.appendChild(cellsRow(x, [['linha', 'num'], ['data'], ['parceira'], ['regiao'], ['tipo'], ['status'], ['projeto'], ['descricao'], ['equipamento'], ['poweron'], ['inicio'], ['fim'], ['janela_h', 'num'], ['contratada']])));
  tb.appendChild(frag);
});

// ---------- live clock ----------
const fHora = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
const fDia = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'});
const clock = (fmt) => ({
  mount(el) { const tick = () => { el.textContent = fmt.format(new Date()); }; tick(); return setInterval(tick, 1000); },
  update(el) { el.textContent = fmt.format(new Date()); },
  unmount(el, id) { clearInterval(id); },
});
dash.draw('relogio-hora', clock(fHora));
dash.draw('relogio-dia', clock(fDia));

// ---------- projects ----------
const pState = {q: '', sort: {k: 'primeira', dir: 1}};
const uniq = (v, k) => Array.from(new Set(v.map((x) => x[k]).filter((s) => s !== '' && s !== null && s !== undefined))).join(', ');
const projects = () => {
  const r = filtered();
  if (!r) return null;
  const list = d3.groups(r, (x) => x.projeto).map(([p, v]) => {
    const o = v.slice().sort((a, b) => d3.ascending(a.data, b.data) || a.linha - b.linha);
    return {projeto: p, descricao: uniq(o, 'descricao'), parceira: uniq(o, 'parceira'), regiao: uniq(o, 'regiao'), tipo: uniq(o, 'tipo'),
      n: o.length, canc: o.filter(isCanc).length, primeira: o[0].data, ultima: o[o.length - 1].data, status: o[o.length - 1].status,
      horas: d3.sum(o, hrs), poweron: uniq(o.filter((x) => /\d/.test(x.poweron)), 'poweron')};
  });
  if (!pState.q) return list;
  return list.filter((x) => Object.values(x).some((v) => String(v).toLowerCase().includes(pState.q)));
};
document.querySelectorAll('.p-search').forEach((inp) => inp.addEventListener('input', () => { pState.q = inp.value.trim().toLowerCase(); dash.draw('p-tabela'); dash.draw('p-count'); }));
document.querySelectorAll('th.p-sortable').forEach((th) => th.addEventListener('click', () => {
  const k = th.dataset.pk;
  pState.sort = {k, dir: pState.sort.k === k ? -pState.sort.dir : 1};
  document.querySelectorAll('th.p-sortable').forEach((t) => t.setAttribute('aria-sort', t.dataset.pk === k ? (pState.sort.dir > 0 ? 'ascending' : 'descending') : 'none'));
  dash.draw('p-tabela');
}));
dash.draw('p-count', (el) => { const p = projects(); el.textContent = p ? fN(p.length) : '—'; });
dash.draw('p-tabela', (tb) => {
  const p = projects();
  tb.replaceChildren();
  if (!p) return;
  const {k, dir} = pState.sort;
  const num = ['n', 'canc', 'horas'].includes(k);
  const rows = p.sort((a, b) => dir * (num ? a[k] - b[k] : d3.ascending(String(a[k]), String(b[k]))) || d3.ascending(a.projeto, b.projeto));
  const frag = document.createDocumentFragment();
  rows.forEach((x) => {
    const tr = document.createElement('tr');
    [[x.projeto], [x.descricao], [x.parceira], [x.regiao], [x.tipo], [fN(x.n), 'num'], [fN(x.canc), x.canc ? 'num bad' : 'num'],
      [fDL(parseD(x.primeira))], [fDL(parseD(x.ultima))], [x.status, x.status === 'Cancelado' ? 'bad' : ''], [fH(x.horas), 'num'], [x.poweron]]
      .forEach(([t, cls]) => { const td = document.createElement('td'); if (cls) td.className = cls; td.textContent = t; tr.appendChild(td); });
    frag.appendChild(tr);
  });
  tb.appendChild(frag);
});
