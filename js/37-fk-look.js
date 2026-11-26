// FIT KORE — aspetto: tema (scuro, chiaro, automatico) e intensità degli effetti.
(function () {
  'use strict';
  const KEY = 'fk-look';
  const html = document.documentElement;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  function apply() {
    const l = read(), t = l.theme === 'auto' ? (mq.matches ? 'light' : 'dark') : (l.theme || 'dark');
    html.dataset.theme = t; html.dataset.fx = l.fx || 'soft';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#f3f5ef' : '#060807';
  }
  mq.addEventListener && mq.addEventListener('change', () => { if (read().theme === 'auto') apply(); });

  // Tema chiaro sulle card storiche: alcune hanno colori scuri scritti direttamente nel codice.
  // Qui li individuiamo e li schiariamo, così tutto resta leggibile.
  const rgbOf = str => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(str || ''); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
  const SKIP = '.k-coach-msg, .k-gym-title, .k-cal-center b, #pagetitle, .k-led-strip, svg, svg *, canvas, video, .k-scan-cam, .k-scan-cam *, .k-aurora, .k-photo-bg, .k-photo-bg *, .side, .side *, .top, .top *, .k-toast, .k-rest, .k-sheet, .k-sheet *, .k-hbar-fill, #chart .bar, .k-ring, .k-heat i, .k-macro-bar *, .k-meal-bar *, .k-chal-bar *, .fk-mission-track *, .k-food small i, .k-chip, .k-ex-muscle, .k-coach-stats li i, .k-meal-ico';
  let fixing = false;
  function fixLight() {
    if (fixing) return; fixing = true;
    const light = html.dataset.theme === 'light';
    document.querySelectorAll('.k-lf-bg, .k-lf-tx, .k-lf-dim').forEach(el => {
      if (light) return;
      el.classList.remove('k-lf-bg', 'k-lf-tx', 'k-lf-dim');
      ['background', 'border-color', 'box-shadow', 'color', '-webkit-text-fill-color', 'text-shadow', 'filter'].forEach(p => el.style.removeProperty(p));
    });
    if (light) {
      document.querySelectorAll('.section *').forEach(el => {
        if (el.closest('[hidden]') || el.matches(SKIP)) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none') return;
        const bg = rgbOf(cs.backgroundColor), img = cs.backgroundImage !== 'none' ? rgbOf(cs.backgroundImage) : null;
        const dark = (bg && bg[3] > 0.45 && lum(bg) < 0.3) || (img && lum(img) < 0.3 && img[3] > 0.45);
        if (dark && !el.classList.contains('k-lf-bg')) {
          // stile in linea con priorità: alcune regole storiche usano già !important
          el.classList.add('k-lf-bg');
          el.style.setProperty('background', el.matches('article, section, .card') ? '#ffffff' : '#f4f6f0', 'important');
          el.style.setProperty('border-color', 'rgba(20,30,10,.12)', 'important');
          el.style.setProperty('box-shadow', el.matches('article') ? '0 14px 34px -22px rgba(30,40,10,.35)' : 'none', 'important');
        }
      });
      document.querySelectorAll('.section *').forEach(el => {
        if (el.closest('[hidden]') || el.matches(SKIP) || el.closest('button, .k-plan-go, .hx-start, [aria-checked="true"], [aria-selected="true"]')) return;
        if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
        const c = rgbOf(getComputedStyle(el).color); if (!c) return;
        const L = lum(c);
        if (L > 0.78 && sat(c) < 0.35) {
          el.classList.add('k-lf-tx');
          el.style.setProperty('color', '#13170f', 'important'); el.style.setProperty('-webkit-text-fill-color', '#13170f', 'important'); el.style.setProperty('text-shadow', 'none', 'important');
        } else if (L > 0.55 && sat(c) >= 0.35) {
          el.classList.add('k-lf-dim');
          el.style.setProperty('filter', 'brightness(.55) saturate(1.5)', 'important'); el.style.setProperty('text-shadow', 'none', 'important');
        }
      });
    }
    if (light) {
      // pulsanti storici con testo chiaro su fondo ormai chiaro
      document.querySelectorAll('.section button').forEach(b => {
        if (b.closest('[hidden]') || b.matches(SKIP) || b.classList.contains('k-lf-tx')) return;
        const cs = getComputedStyle(b), c = rgbOf(cs.color), bg = rgbOf(cs.backgroundColor), img = cs.backgroundImage !== 'none' ? rgbOf(cs.backgroundImage) : null;
        const base = img && img[3] > 0.3 ? img : bg && bg[3] > 0.3 ? bg : [255, 255, 255, 1];
        if (c && lum(c) > 0.62 && lum(base) > 0.62) {
          b.classList.add('k-lf-tx');
          const dark = sat(c) > 0.35 ? `color-mix(in srgb, rgb(${c[0]},${c[1]},${c[2]}) 45%, #000)` : '#13170f';
          b.style.setProperty('color', dark, 'important'); b.style.setProperty('-webkit-text-fill-color', dark, 'important'); b.style.setProperty('text-shadow', 'none', 'important');
        }
      });
    }
    fixing = false;
  }
  let lfTimer = null;
  const scheduleFix = () => { clearTimeout(lfTimer); lfTimer = setTimeout(fixLight, 250); };
  new MutationObserver(m => { if (html.dataset.theme === 'light' && !fixing && m.some(r => r.type === 'childList' && r.addedNodes.length)) scheduleFix(); })
    .observe(document.body, { childList: true, subtree: true });
  new MutationObserver(scheduleFix).observe(html, { attributes: true, attributeFilter: ['data-theme', 'data-sec'] });
  window.addEventListener('load', scheduleFix);
  document.addEventListener('click', e => { if (html.dataset.theme === 'light' && e.target.closest('.k-tabs, [data-page], .k-gym, .k-plan')) scheduleFix(); }, true);

  const diary = document.getElementById('diario');
  if (!diary) { apply(); return; }
  const card = document.createElement('article');
  card.className = 'k-look'; card.id = 'k-look';
  const rem = document.getElementById('k-rem');
  rem ? diary.insertBefore(card, rem) : diary.append(card);
  const seg = (name, opts, cur) => `<div class="k-look-seg" role="radiogroup" aria-label="${name}">${opts.map(([v, l, d]) => `<button type="button" role="radio" data-${name}="${v}" aria-checked="${v === cur}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`;
  function render() {
    const l = read();
    card.innerHTML = `<h3>Aspetto</h3>
      <p class="k-look-label">Tema</p>
      ${seg('theme', [['dark', '🌙 Scuro', 'neon'], ['light', '☀️ Chiaro', 'luminoso'], ['auto', '◐ Automatico', 'come il telefono']], l.theme || 'dark')}
      <p class="k-look-label">Effetti luminosi</p>
      ${seg('fx', [['full', 'Intensi', 'LED ovunque'], ['soft', 'Leggeri', 'consigliato'], ['off', 'Spenti', 'statico']], l.fx || 'soft')}`;
  }
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-theme],[data-fx]'); if (!b) return;
    const l = read();
    if (b.dataset.theme) l.theme = b.dataset.theme;
    if (b.dataset.fx) l.fx = b.dataset.fx;
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (err) {}
    html.classList.add('k-theme-anim'); apply(); render();
    setTimeout(() => html.classList.remove('k-theme-anim'), 600);
  });
  // Pulsante rapido nell'intestazione: sole / luna, sempre visibile.
  const top = document.querySelector('.top');
  if (top && !document.getElementById('k-theme-toggle')) {
    const tb = document.createElement('button');
    tb.type = 'button'; tb.id = 'k-theme-toggle'; tb.className = 'k-theme-toggle';
    const paintBtn = () => {
      const light = html.dataset.theme === 'light';
      tb.innerHTML = light
        ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
      tb.setAttribute('aria-label', light ? 'Passa al tema scuro' : 'Passa al tema chiaro');
      tb.title = tb.getAttribute('aria-label');
    };
    tb.addEventListener('click', () => {
      const l = read(); l.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {}
      html.classList.add('k-theme-anim'); apply(); render(); paintBtn();
      setTimeout(() => html.classList.remove('k-theme-anim'), 600);
      try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
    });
    const profile = top.querySelector('button');
    profile ? profile.before(tb) : top.append(tb);
    new MutationObserver(paintBtn).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    paintBtn();
  }
  apply(); render();
})();
