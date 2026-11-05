/*
 * dash-shim.js — implementação local da API `dash` usada pelo app.js,
 * para o painel funcionar como site estático (GitHub Pages ou arquivo local).
 * Os dados vêm de data/programacoes.js (window.PROG_DATA).
 */
(function () {
  const LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
  const DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && mq && mq.matches);

  const datasets = {
    prog: () => {
      const rows = Array.isArray(window.PROG_DATA) ? window.PROG_DATA : null;
      if (!rows) return {status: 'error', data: [], message: 'data/programacoes.js não carregou', columns: []};
      return {status: 'ok', data: rows, columns: rows.length ? Object.keys(rows[0]) : [], refreshing: false, meta: []};
    },
  };

  let params = {};
  const draws = new Map();      // name -> spec (function | {mount, update, unmount})
  const mounted = new WeakMap(); // el -> {name, made}
  const listeners = [];
  let queued = false;

  const isHidden = (el) => !!el.closest('[hidden]');

  function runDraw(name) {
    const spec = draws.get(name);
    if (!spec) return;
    document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
      if (isHidden(el)) return;
      try {
        if (typeof spec === 'function') {
          spec(el);
        } else {
          let m = mounted.get(el);
          if (!m) {
            el.replaceChildren();
            m = {name, made: spec.mount ? spec.mount(el) : undefined};
            mounted.set(el, m);
          }
          if (spec.update) spec.update(el, m.made);
        }
      } catch (err) {
        console.error('[dash] drawing "' + name + '" falhou:', err);
        el.textContent = '—';
      }
    });
  }

  function runAll() {
    queued = false;
    listeners.forEach((fn) => {
      try { fn(); } catch (err) { console.error('[dash] onData falhou:', err); }
    });
    draws.forEach((spec, name) => runDraw(name));
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(runAll);
  }

  window.dash = {
    get colors() { return isDark() ? DARK.slice() : LIGHT.slice(); },
    data(id) { return datasets[id] ? datasets[id]() : {status: 'missing', data: [], columns: []}; },
    onData(fn) { listeners.push(fn); schedule(); },
    draw(name, spec) {
      if (spec === undefined) { runDraw(name); return; }
      draws.set(name, spec);
      schedule();
    },
    calc() {},
    loader() {},
    refresh() { schedule(); },
    params() { return Object.assign({}, params); },
    setParams(obj) {
      Object.keys(obj || {}).forEach((k) => {
        const v = obj[k];
        if (v === null || v === undefined || v === '') delete params[k]; else params[k] = v;
      });
      schedule();
    },
    resetParams() { params = {}; schedule(); },
    setLink(name) {
      if (history.replaceState) history.replaceState(null, '', '#' + name);
      else location.hash = name;
    },
  };

  // Redesenha quando uma aba é exibida (atributo hidden muda) ou a largura muda.
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(schedule).observe(document.body, {attributes: true, attributeFilter: ['hidden'], subtree: true});
    let w = window.innerWidth;
    window.addEventListener('resize', () => {
      if (Math.abs(window.innerWidth - w) < 4) return;
      w = window.innerWidth;
      schedule();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', schedule);
    schedule();
  });
})();
