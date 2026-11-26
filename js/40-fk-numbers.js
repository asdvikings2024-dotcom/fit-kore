// FIT KORE — numeri animati: contano fino al valore quando apri una sezione
// e scorrono dal vecchio al nuovo valore quando cambiano (con un piccolo "pop").
(function () {
  'use strict';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEL = '.k-cal-center b, .k-cal-row b, .k-coach-stats li b, .k-macro-top b, .k-meal-head em, .k-streak-stats b, .k-weight-stats b, .k-ex-stats b, .k-chal-top b, .k-result-main b, .k-val, .k-gym-last b';
  const SKIP_IDS = new Set(['d-sessions', 'kore-percent', 'traincount', 'kore-sessions-mirror']);
  const state = new WeakMap(); // nodo di testo -> { writing, last, raf }
  const parse = s => { const m = /^(\D*?)(-?\d[\d.]*(?:,\d+)?)(.*)$/s.exec(s); if (!m) return null; const n = parseFloat(m[2].replace(/\./g, '').replace(',', '.')); return isFinite(n) ? { pre: m[1], n, post: m[3], dec: (m[2].split(',')[1] || '').length } : null; };
  const fmt = (n, dec) => dec ? n.toFixed(dec).replace('.', ',') : Math.round(n).toLocaleString('it-IT');
  const textNode = el => [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.data));

  function tween(el, from, toText) {
    const node = textNode(el); if (!node) return;
    const to = parse(toText); if (!to || from === to.n) return;
    const st = state.get(node) || {}; cancelAnimationFrame(st.raf);
    const dur = Math.min(1100, 450 + Math.abs(to.n - from) * 2), t0 = performance.now();
    el.classList.remove('k-num-pop'); void el.offsetWidth; el.classList.add('k-num-pop');
    const step = t => {
      if (st.last !== undefined && node.data !== st.last) return; // l'app ha scritto un nuovo valore: lasciamo fare a lei
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      st.last = p < 1 ? to.pre + fmt(from + (to.n - from) * e, to.dec) + to.post : toText;
      st.writing = true; node.data = st.last; st.writing = false;
      if (p < 1) st.raf = requestAnimationFrame(step); else { st.last = undefined; st.final = toText; }
    };
    st.last = undefined; state.set(node, st);
    st.raf = requestAnimationFrame(step);
  }

  if (!reduce) {
    // cambi di valore
    const seen = new WeakMap();
    new MutationObserver(muts => {
      muts.forEach(m => {
        const node = m.type === 'characterData' ? m.target : null;
        const el = node ? node.parentElement : m.target.nodeType === 1 ? m.target : null;
        if (!el || !el.matches || !el.matches(SEL) || SKIP_IDS.has(el.id) || el.dataset.kCounting) return;
        const tn = textNode(el); if (!tn) return;
        const st = state.get(tn); if (st && st.writing) return;
        const prev = seen.get(el), now = tn.data; seen.set(el, now);
        if (prev === undefined || prev === now || (st && now === st.last)) return;
        const p = parse(prev); if (p) tween(el, p.n, now);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
    // prima memorizzazione + conteggio da zero all'apertura della sezione
    const remember = root => root.querySelectorAll(SEL).forEach(el => { const tn = textNode(el); if (tn) { const s = state.get(tn); if (!s || !s.writing) {} } });
    const countIn = sec => sec.querySelectorAll(SEL).forEach(el => {
      if (SKIP_IDS.has(el.id) || el.closest('[hidden]') || !el.offsetParent) return;
      const tn = textNode(el); if (!tn) return; const v = parse(tn.data); if (!v || v.n === 0) return;
      tween(el, 0, tn.data);
    });
    document.querySelectorAll('.section').forEach(sec => {
      let was = sec.classList.contains('active');
      new MutationObserver(() => { const a = sec.classList.contains('active'); if (a && !was) setTimeout(() => countIn(sec), 120); was = a; })
        .observe(sec, { attributes: true, attributeFilter: ['class'] });
    });
    window.addEventListener('load', () => setTimeout(() => { const s = document.querySelector('.section.active'); s && countIn(s); remember(document); }, 900));
  }
})();
