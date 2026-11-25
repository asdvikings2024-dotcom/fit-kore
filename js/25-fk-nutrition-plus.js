// FIT KORE — macronutrienti automatici e storico dei pasti.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'fk-nutrition-v1', HIST = 'fk-nutrition-history-v1';
  const TYPES = ['Colazione', 'Pranzo', 'Cena', 'Spuntino', 'Pasto'];
  const today = () => new Date().toLocaleDateString('sv-SE');
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const num = v => Number(v) || 0;
  const r1 = v => Math.round(v * 10) / 10;
  const it = n => Math.round(n).toLocaleString('it-IT');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = $('fk-rescue-diary'), form = $('fk-rescue-form');
  if (!root || !form) return;

  function goal() { return num(read(KEY, {}).goal) || 2000; }
  function todayEntries() {
    const d = read(KEY, {});
    const list = d.date === today() && Array.isArray(d.entries) ? d.entries.slice() : [];
    if (typeof state !== 'undefined' && Array.isArray(state.meals))
      state.meals.forEach(m => list.push({ name: m.name, kcal: num(m.kcal), mealType: 'Pasto', p: 0, c: 0, f: 0 }));
    return list;
  }
  function history() {
    const h = read(HIST, {});
    const out = {};
    Object.keys(h).forEach(k => { if (Array.isArray(h[k]) && h[k].length) out[k] = h[k]; });
    const t = todayEntries(); if (t.length) out[today()] = t;
    return out;
  }
  const sum = (list, f) => list.reduce((n, x) => n + num(x[f]), 0);

  /* ---------- 1. Macro salvati insieme al pasto ---------- */
  let pending = null;
  document.addEventListener('submit', e => {
    if (e.target !== form) return;
    const name = $('fk-rescue-name'), choice = name && name.fkChoice;
    pending = choice && choice.macro ? { name: name.value.trim(), kcal: num($('fk-rescue-kcal').value), choice } : null;
  }, true);
  form.addEventListener('submit', () => setTimeout(() => {
    if (!pending) { renderAll(); return; }
    const d = read(KEY, null);
    if (d && Array.isArray(d.entries)) {
      for (let i = d.entries.length - 1; i >= 0; i--) {
        const x = d.entries[i];
        if (x.name === pending.name && num(x.kcal) === pending.kcal && !num(x.p) && !num(x.c) && !num(x.f)) {
          // Se hai corretto le calorie a mano, i macro seguono la stessa proporzione.
          const scale = pending.choice.kcal ? pending.kcal / pending.choice.kcal : 1;
          const g = pending.choice.grams * scale, m = pending.choice.macro;
          x.p = r1(m[0] * g / 100); x.c = r1(m[1] * g / 100); x.f = r1(m[2] * g / 100);
          try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
          break;
        }
      }
    }
    pending = null; renderAll();
  }, 0));

  /* ---------- 2. Barre dei macro di oggi ---------- */
  const macroBox = document.createElement('div');
  macroBox.className = 'k-macros'; macroBox.setAttribute('aria-label', 'Macronutrienti di oggi');
  const totals = root.querySelector('.fk-rescue-totals');
  (totals || root.querySelector('p')).after(macroBox);
  function renderMacros() {
    const list = todayEntries(), g = goal();
    const pt = typeof window.fkProfileTargets === 'function' ? window.fkProfileTargets() : null;
    const targets = pt && pt.kcal === g ? { p: pt.p, c: pt.c, f: pt.f } : { p: g * 0.25 / 4, c: g * 0.5 / 4, f: g * 0.25 / 9 };
    const names = { p: 'Proteine', c: 'Carboidrati', f: 'Grassi' };
    const missing = list.filter(x => !num(x.p) && !num(x.c) && !num(x.f) && num(x.kcal) > 0).length;
    macroBox.innerHTML = ['p', 'c', 'f'].map(k => {
      const v = sum(list, k), t = targets[k], pct = Math.min(100, v / t * 100);
      return `<div class="k-macro k-macro-${k}"><div class="k-macro-top"><span>${names[k]}</span><b>${it(v)}<small> / ${it(t)} g</small></b></div><div class="k-macro-bar"><i style="width:${pct}%"></i></div></div>`;
    }).join('') + (missing ? `<p class="k-macro-note">${missing} ${missing === 1 ? 'alimento' : 'alimenti'} senza macro (inseriti a mano o non in elenco).</p>` : '');
  }

  /* ---------- 3. Storico pasti ---------- */
  const card = document.createElement('article');
  card.className = 'k-history'; card.id = 'k-history';
  card.innerHTML = '<h3>Storico pasti</h3><p class="k-history-sub"></p>' +
    '<div class="k-history-chart" role="img"></div>' +
    '<div class="k-history-days" role="tablist" aria-label="Giorni"></div>' +
    '<div class="k-history-detail" role="tabpanel"></div>' +
    '<p class="k-history-status" role="status" aria-live="polite"></p>';
  root.after(card);
  const chart = card.querySelector('.k-history-chart'), days = card.querySelector('.k-history-days'),
    detail = card.querySelector('.k-history-detail'), sub = card.querySelector('.k-history-sub'), status = card.querySelector('.k-history-status');
  let selected = null;

  const dayLabel = (iso, long) => {
    const d = new Date(iso + 'T12:00:00'), t = new Date(today() + 'T12:00:00');
    const diff = Math.round((t - d) / 864e5);
    if (diff === 0) return 'Oggi';
    if (diff === 1) return 'Ieri';
    return d.toLocaleDateString('it-IT', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric' });
  };

  function renderHistory() {
    const h = history(), g = goal();
    // Grafico 7 giorni
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toLocaleDateString('sv-SE'); });
    const vals = last7.map(k => sum(h[k] || [], 'kcal'));
    const logged = vals.filter(Boolean);
    const avg = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : 0;
    const max = Math.max(g * 1.2, ...vals);
    sub.textContent = logged.length
      ? `Media ultimi 7 giorni: ${it(avg)} kcal · ${logged.length} ${logged.length === 1 ? 'giorno registrato' : 'giorni registrati'} · obiettivo ${it(g)} kcal`
      : 'Qui vedrai i giorni passati: calorie, pasti e macro. Inizia registrando i pasti di oggi.';
    chart.setAttribute('aria-label', 'Calorie degli ultimi 7 giorni');
    chart.innerHTML = `<i class="k-goal-line" style="bottom:calc(${g / max} * (100% - 22px))"><span>${it(g)}</span></i>` + last7.map((k, i) => {
      const v = vals[i], over = v > g * 1.1;
      const d = new Date(k + 'T12:00:00');
      return `<button type="button" class="k-hbar${v ? '' : ' is-empty'}${over ? ' is-over' : ''}${k === selected ? ' is-sel' : ''}${k === today() ? ' is-today' : ''}" data-day="${k}" title="${it(v)} kcal">` +
        `<span class="k-hbar-fill" style="height:${v ? Math.max(4, v / max * 100) : 3}%"></span>` +
        `<b>${v ? it(v) : ''}</b><small>${d.toLocaleDateString('it-IT', { weekday: 'narrow' }).toUpperCase()}</small></button>`;
    }).join('');
    // Giorni disponibili
    const keys = Object.keys(h).sort().reverse().slice(0, 60);
    if (!selected || !h[selected]) selected = keys.find(k => k !== today()) || keys[0] || null;
    days.innerHTML = keys.map(k => `<button type="button" role="tab" data-day="${k}" aria-selected="${k === selected}">${esc(dayLabel(k))}<small>${it(sum(h[k], 'kcal'))} kcal</small></button>`).join('');
    renderDetail(h);
  }

  function renderDetail(h) {
    if (!selected || !h[selected]) { detail.innerHTML = ''; return; }
    const list = h[selected], isToday = selected === today();
    const groups = TYPES.map(t => [t, list.filter(x => (x.mealType || 'Pasto') === t)]).filter(([, l]) => l.length);
    const m = ['p', 'c', 'f'].map(k => it(sum(list, k)));
    detail.innerHTML = `<div class="k-day-head"><strong>${esc(dayLabel(selected, true))}</strong><span>${it(sum(list, 'kcal'))} kcal · P ${m[0]} g · C ${m[1]} g · G ${m[2]} g</span></div>` +
      groups.map(([t, l]) => `<div class="k-day-meal"><div class="k-day-meal-top"><b>${t}</b><span>${it(sum(l, 'kcal'))} kcal</span></div><ul>` +
        l.map(x => `<li><span>${esc(x.name)}</span><em>${it(num(x.kcal))} kcal</em>${isToday ? '' : `<button type="button" class="k-copy" data-name="${esc(x.name)}" data-kcal="${num(x.kcal)}" data-type="${esc(x.mealType || 'Spuntino')}" data-p="${num(x.p)}" data-c="${num(x.c)}" data-f="${num(x.f)}" aria-label="Aggiungi ${esc(x.name)} a oggi">+ Oggi</button>`}</li>`).join('') +
        '</ul></div>').join('') +
      (isToday ? '' : '<button type="button" class="k-copy-all">Ripeti tutta la giornata oggi</button>');
  }

  function addToday(items) {
    const d = read(KEY, {}) || {};
    if (d.date !== today()) { d.date = today(); d.entries = []; }
    if (!Array.isArray(d.entries)) d.entries = [];
    items.forEach(x => d.entries.push({ name: x.name, kcal: num(x.kcal), mealType: TYPES.slice(0, 4).includes(x.mealType) ? x.mealType : 'Spuntino', p: num(x.p), c: num(x.c), f: num(x.f) }));
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { status.textContent = 'Salvataggio non riuscito.'; return false; }
    if (typeof window.fkRescueDraw === 'function') window.fkRescueDraw();
    if (typeof render === 'function') render();
    renderAll();
    try { navigator.vibrate && navigator.vibrate(10); } catch (e) {}
    return true;
  }

  card.addEventListener('click', e => {
    const day = e.target.closest('[data-day]');
    if (day) { selected = day.dataset.day; renderHistory(); return; }
    const one = e.target.closest('.k-copy');
    if (one) {
      const x = { name: one.dataset.name, kcal: one.dataset.kcal, mealType: one.dataset.type, p: one.dataset.p, c: one.dataset.c, f: one.dataset.f };
      if (addToday([x])) { status.textContent = `✓ ${x.name} aggiunto a oggi (${x.mealType}).`; one.textContent = '✓'; one.disabled = true; }
      return;
    }
    if (e.target.closest('.k-copy-all')) {
      const list = history()[selected] || [];
      if (list.length && addToday(list)) status.textContent = `✓ ${list.length} alimenti copiati in oggi.`;
    }
  });

  /* ---------- Aggiornamenti ---------- */
  let queued = false;
  function renderAll() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; renderMacros(); renderHistory(); });
  }
  // I totali del diario cambiano a ogni salvataggio o eliminazione: ci agganciamo lì.
  const eaten = $('fk-rescue-eaten');
  if (eaten) new MutationObserver(renderAll).observe(eaten, { childList: true, characterData: true, subtree: true });
  window.addEventListener('storage', renderAll);
  renderAll();

  // Se l'app resta aperta a cavallo della mezzanotte, ricarica per archiviare la giornata.
  const loadedDay = today();
  const checkDay = () => { if (today() !== loadedDay && document.visibilityState === 'visible') location.reload(); };
  document.addEventListener('visibilitychange', checkDay);
  setInterval(checkDay, 60000);
})();
