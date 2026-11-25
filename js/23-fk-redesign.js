// FIT KORE — Redesign "KORE PULSE" (v22): struttura, grafico reale, effetti.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- Icone SVG (tratto unico, stile coerente) ---------- */
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    food: '<path d="M12 7c-2-2.6-6.5-2-7 2-.6 4.6 2.5 11 5 11 1 0 1.3-.6 2-.6s1 .6 2 .6c2.5 0 5.6-6.4 5-11-.5-4-5-4.6-7-2Z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    diary: '<path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 3.5v17M9.5 8h5.5M9.5 11.5h5.5"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    watch: '<rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6V2.5h6V6M9 18v3.5h6V18M12 9.5V12l1.5 1.5"/>'
  };
  const icon = (name, cls = 'k-ico') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;

  /* ---------- Sfondo aurora ---------- */
  const aurora = document.createElement('div');
  aurora.className = 'k-aurora'; aurora.setAttribute('aria-hidden', 'true');
  aurora.innerHTML = '<i></i><i></i><i></i>';
  document.body.prepend(aurora);

  /* ---------- Intestazione: data di oggi al posto di "Preview" ---------- */
  const eyebrow = document.querySelector('.top .eyebrow');
  if (eyebrow) {
    const d = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    eyebrow.textContent = d.toUpperCase();
  }

  /* ---------- Navigazione con icone vere e indicatore scorrevole ---------- */
  const nav = document.querySelector('.nav');
  const navIcons = { dashboard: ['home', 'Home'], alimentazione: ['food', 'Cibo'], allenamenti: ['dumbbell', 'Allena'], diario: ['diary', 'Diario'] };
  if (nav) {
    nav.querySelectorAll('button[data-page]').forEach(b => {
      const def = navIcons[b.dataset.page]; if (!def) return;
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', 'Apri ' + b.textContent.trim());
      b.innerHTML = icon(def[0]) + '<span>' + def[1] + '</span>';
    });
    const pill = document.createElement('span'); pill.className = 'k-nav-pill'; pill.setAttribute('aria-hidden', 'true'); nav.append(pill); // in coda: gli stili storici usano nth-child
    const movePill = () => {
      const a = nav.querySelector('button[data-page].active');
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1; pill.style.left = a.offsetLeft + 'px'; pill.style.width = a.offsetWidth + 'px'; pill.style.top = a.offsetTop + 'px'; pill.style.height = a.offsetHeight + 'px';
    };
    new MutationObserver(movePill).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', movePill); setTimeout(movePill, 50);
  }

  /* ---------- Simboli unicode sostituiti o rimossi ---------- */
  const start = $('hx-start');
  if (start) {
    const spans = start.querySelectorAll(':scope > span');
    if (spans[0]) spans[0].innerHTML = icon('bolt');
    if (spans[1]) spans[1].textContent = '→';
  }
  // Titoli delle card: via emoji e simboli iniziali, l'accento lo dà la barretta lime.
  document.querySelectorAll('.section h3').forEach(h => {
    const first = h.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^[^\p{L}\p{N}]+/u, '');
  });

  /* ---------- Dashboard: meno slogan, più dati ---------- */
  const shortcuts = document.querySelector('.kore-shortcuts');
  if (shortcuts) {
    const h = shortcuts.previousElementSibling;
    if (h && h.classList.contains('kore-section-heading')) h.style.display = 'none';
  }
  // "Obiettivo" dell'anello: porta all'impostazione dell'obiettivo calorico.
  const goalBox = document.querySelector('.kore-ring-details > div:first-child');
  if (goalBox && $('fk-cal-goal')) {
    goalBox.classList.add('k-goal-link'); goalBox.setAttribute('role', 'button'); goalBox.tabIndex = 0;
    goalBox.setAttribute('aria-label', 'Modifica obiettivo calorico');
    const go = () => {
      document.querySelector('[data-page="alimentazione"]')?.click();
      const input = $('fk-cal-goal'); const det = input.closest('details'); if (det) det.open = true;
      setTimeout(() => { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus({ preventScroll: true }); }, 450);
    };
    goalBox.addEventListener('click', go);
    goalBox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  }

  /* ---------- Grafico settimanale reale (minuti per giorno) ---------- */
  const chart = $('chart');
  const graphLabel = document.querySelector('.kore-graph-top > :first-child');
  if (graphLabel) graphLabel.textContent = 'MINUTI DI ALLENAMENTO';
  let drawing = false, chartAnimated = false;
  function dayKey(d) { return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function drawChart() {
    if (!chart || drawing) return;
    drawing = true;
    const all = (typeof state !== 'undefined' && Array.isArray(state.workouts)) ? state.workouts : [];
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - 6 + i); return d; });
    const mins = days.map(d => all.reduce((sum, w) => {
      const when = w && w.completedAt ? new Date(w.completedAt) : null;
      const match = when && !isNaN(+when) ? dayKey(when) === dayKey(d) : dayKey(d) === dayKey(today);
      return sum + (match ? Number(w.minutes) || 0 : 0);
    }, 0));
    const max = Math.max(30, ...mins);
    const letters = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
    chart.innerHTML = days.map((d, i) => {
      const h = mins[i] ? Math.max(8, mins[i] / max * 100) : 4;
      const cls = 'bar k-real' + (i === 6 ? ' is-today' : '') + (mins[i] ? '' : ' is-empty') + (!chartAnimated && !reduce ? ' k-grow' : '');
      return `<div class="${cls}" style="height:${h}%;--k-delay:${i * 70}ms" title="${mins[i]} minuti">${mins[i] ? '<b>' + mins[i] + '</b>' : ''}<span>${letters[d.getDay()]}</span></div>`;
    }).join('') + (mins.some(Boolean) ? '' : '<div class="k-chart-empty">Nessun allenamento negli ultimi 7 giorni</div>');
    chartAnimated = true;
    drawing = false;
  }
  if (chart) {
    chart.style.position = 'relative';
    // L'app ridisegna #chart con valori fissi a ogni salvataggio: lo sostituiamo con i dati veri.
    new MutationObserver(() => { if (!drawing && !chart.querySelector('.k-real')) drawChart(); }).observe(chart, { childList: true });
    drawChart();
  }

  /* ---------- Allenamenti in tre schede ---------- */
  const training = $('allenamenti');
  if (training) {
    const pick = sel => training.querySelector(':scope > ' + sel);
    const groups = {
      sessione: [pick('#fk-live-workout'), pick('.fk-feature-card'), pick('.grid'), pick('.fk-workout-tools')],
      progressi: [pick('#fk-manage-graph'), pick('#fk-manage-workouts')],
      orologio: [pick('#fk-watch-hub'), pick('#fk-xiaomi-setup')]
    };
    // Il vecchio grafico "Progressi settimanali" usava un registro separato e mostrava 0
    // anche con allenamenti salvati: il grafico LIVE e quello in Home usano i dati veri.
    const oldWeek = pick('.fk-week-card'); if (oldWeek) oldWeek.style.display = 'none';
    const placed = new Set(oldWeek ? [oldWeek] : []);
    const tabs = document.createElement('div');
    tabs.className = 'k-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Sezioni allenamenti');
    const defs = [['sessione', 'Sessione', 'bolt'], ['progressi', 'Progressi', 'chart'], ['orologio', 'Orologio', 'watch']];
    defs.forEach(([id, label, ic]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'k-tab-' + id; b.dataset.tab = id;
      b.innerHTML = icon(ic) + label; tabs.append(b);
    });
    const title = training.querySelector(':scope > .sectiontitle');
    (title || training.firstChild) ? training.insertBefore(tabs, title ? title.nextSibling : training.firstChild) : training.append(tabs);
    Object.entries(groups).forEach(([id, els]) => els.filter(Boolean).forEach(el => {
      el.dataset.kTab = id; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', 'k-tab-' + id);
      training.append(el); placed.add(el);
    }));
    // Qualsiasi altro blocco finisce nella scheda Sessione.
    [...training.children].forEach(el => { if (el !== tabs && el !== title && !placed.has(el)) el.dataset.kTab = 'sessione'; });
    let current = 'sessione';
    try { current = sessionStorage.getItem('k-tab') || 'sessione'; } catch (e) {}
    function show(id, focus) {
      current = id;
      try { sessionStorage.setItem('k-tab', id); } catch (e) {}
      tabs.querySelectorAll('button').forEach(b => {
        const on = b.dataset.tab === id;
        b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus();
      });
      training.querySelectorAll('[data-k-tab]').forEach(el => {
        el.hidden = el.dataset.kTab !== id;
        if (!el.hidden) revealNow(el);
      });
    }
    tabs.addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { buzz(8); show(b.dataset.tab); } });
    tabs.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const ids = defs.map(d => d[0]); const i = ids.indexOf(current);
      show(ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length], true);
    });
    // "Inizia allenamento" e il menu rapido portano sempre alla scheda Sessione.
    document.addEventListener('click', e => {
      if (e.target.closest('#hx-start,#fk-mission-go,[data-fk-quick="allenamenti"]')) show('sessione');
    }, true);
    setTimeout(() => show(current), 0);
  }

  /* ---------- Effetto: comparsa a cascata ---------- */
  const revealables = () => document.querySelectorAll('.section.active article, .section.active .hx-hero, .section.active .hx-start, .section.active .kore-section-heading');
  function revealNow(scope) {
    if (reduce) return;
    const items = scope.matches && scope.matches('article') ? [scope] : scope.querySelectorAll('article');
    items.forEach((el, i) => {
      if (el.closest('article') !== el && el.parentElement.closest('article')) return;
      el.classList.remove('is-in'); el.classList.add('k-reveal'); el.style.setProperty('--k-delay', Math.min(i, 6) * 70 + 'ms');
      requestAnimationFrame(() => requestAnimationFrame(() => io.observe(el)));
    });
  }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.08 });
  function revealSection() {
    if (reduce) return;
    let i = 0;
    revealables().forEach(el => {
      if (el.parentElement.closest('article')) return;
      el.classList.remove('is-in'); el.classList.add('k-reveal');
      el.style.setProperty('--k-delay', Math.min(i++, 6) * 70 + 'ms');
      io.observe(el);
    });
  }

  /* ---------- Effetto: transizione tra pagine ---------- */
  document.querySelectorAll('.section').forEach(sec => {
    let wasActive = sec.classList.contains('active');
    new MutationObserver(() => {
      const isActive = sec.classList.contains('active');
      if (isActive === wasActive) return;
      wasActive = isActive;
      if (!isActive) return;
      sec.classList.add('k-enter'); setTimeout(() => sec.classList.remove('k-enter'), 600);
      revealSection(); countAll(sec);
      if (sec.id === 'dashboard') { chartAnimated = false; drawChart(); }
    }).observe(sec, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-page],[data-go]')) buzz(8); });

  /* ---------- Effetto: numeri che contano ---------- */
  const countTargets = ['d-sessions', 'kore-percent', 'traincount', 'kore-sessions-mirror'];
  function countUp(el) {
    if (!el || reduce || el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
    const text = el.textContent, m = text.match(/^(\D*?)(\d[\d.]*)(.*)$/s);
    if (!m) return;
    const target = parseInt(m[2].replace(/\./g, ''), 10); if (!target) return;
    const t0 = performance.now(), dur = 900; let written = null;
    el.dataset.kCounting = 1;
    const step = t => {
      if (written !== null && el.textContent !== written) { delete el.dataset.kCounting; return; } // l'app ha aggiornato il valore
      const p = Math.min(1, (t - t0) / dur);
      if (p < 1) {
        written = m[1] + Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('it-IT') + m[3];
        el.textContent = written; requestAnimationFrame(step);
      } else { el.textContent = text; delete el.dataset.kCounting; }
    };
    requestAnimationFrame(step);
  }
  function countAll(scope) { countTargets.forEach(id => { const el = $(id); if (el && scope.contains(el)) countUp(el); }); }

  /* ---------- Effetto: il numero "pulsa" quando cresce ---------- */
  const bumpIds = ['d-sessions', 'traincount', 'foodtotal', 'kore-percent', 'fk-goal-display'];
  bumpIds.forEach(id => {
    const el = $(id); if (!el) return;
    let last = el.textContent;
    new MutationObserver(() => {
      if (el.dataset.kCounting || el.textContent === last) return;
      last = el.textContent; el.classList.remove('k-bump'); void el.offsetWidth; el.classList.add('k-bump');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ---------- Effetto: luce che segue il dito ---------- */
  function lightUp(card) {
    card.classList.add('k-spot');
    const move = e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerdown', e => { move(e); card.classList.add('is-lit'); });
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') card.classList.add('is-lit'); });
    ['pointerleave', 'pointercancel'].forEach(t => card.addEventListener(t, () => card.classList.remove('is-lit')));
    card.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => card.classList.remove('is-lit'), 450); });
  }
  if (!reduce) document.querySelectorAll('.section article, .hx-hero').forEach(c => { if (!c.parentElement.closest('article')) lightUp(c); });

  /* ---------- Effetto: onda al tocco sui pulsanti ---------- */
  if (!reduce) document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.section button, .hx-start, .k-tabs button'); if (!b) return;
    const r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span'); s.className = 'k-ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    b.append(s); setTimeout(() => s.remove(), 650);
  });

  /* ---------- Effetto: "K" del hero in parallasse ---------- */
  const heroK = document.querySelector('.hx-hero-k');
  if (heroK && !reduce) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { heroK.style.transform = `translate3d(0,${window.scrollY * 0.18}px,0) rotate(${window.scrollY * 0.02}deg)`; ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Effetto: festa quando completi un allenamento ---------- */
  function toast(html) {
    const t = document.createElement('div'); t.className = 'k-toast'; t.setAttribute('role', 'status'); t.innerHTML = html;
    document.body.append(t); requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2600);
  }
  function confetti() {
    if (reduce) return;
    const c = document.createElement('canvas'); c.className = 'k-confetti'; document.body.append(c);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    const colors = ['#dfff00', '#5ee7ff', '#ffffff', '#9dff4a'];
    const parts = Array.from({ length: 140 }, () => {
      const a = -Math.PI / 2 + (Math.random() - .5) * 1.6, v = 9 + Math.random() * 9;
      return { x: W / 2, y: H * .72, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 4,
        c: colors[(Math.random() * colors.length) | 0], s: Math.random() * 6, w: Math.random() * .3 + .1, life: 0 };
    });
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H); f++;
      parts.forEach(p => {
        p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.s += p.w;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.s); ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - f / 110); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      });
      if (f < 110) requestAnimationFrame(tick); else c.remove();
    })();
  }
  // Si festeggia solo dopo un'azione dell'utente, non al caricamento o alla sincronizzazione.
  let lastAction = 0;
  ['submit', 'click'].forEach(t => document.addEventListener(t, e => {
    if (e.target.closest && e.target.closest('#allenamenti, #fk-quick-overlay')) lastAction = Date.now();
  }, true));
  const count = $('traincount');
  if (count) {
    let prev = parseInt(count.textContent, 10) || 0;
    new MutationObserver(() => {
      if (count.dataset.kCounting) return; // animazione del contatore, non un nuovo allenamento
      const n = parseInt(count.textContent, 10) || 0;
      if (n > prev && Date.now() - lastAction < 4000) {
        const w = (typeof state !== 'undefined' && state.workouts && state.workouts[state.workouts.length - 1]) || {};
        confetti(); buzz([18, 40, 18]);
        toast('🔥 Sessione salvata' + (w.minutes ? ' · <b>' + Number(w.minutes) + ' min</b>' : ''));
      }
      prev = n;
    }).observe(count, { childList: true, characterData: true, subtree: true });
  }

  window.fkConfetti = confetti; window.fkToast = toast;
  /* ---------- Avvio ---------- */
  revealSection();
  setTimeout(() => countAll(document), 250);
})();
