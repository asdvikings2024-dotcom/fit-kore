// FIT KORE — progressi: andamento del peso e mappa dei giorni di allenamento.
// Riordina anche le card storiche (obiettivo sessioni, registrazioni, note).
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LOG = 'fk-weight-log-v1';
  const iso = d => d.toLocaleDateString('sv-SE');
  const today = () => iso(new Date());
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const num = v => Number(v) || 0;
  const kg = v => v.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const training = $('allenamenti');
  if (!training) return;

  /* ---------- Posizione nelle schede ---------- */
  function intoProgress(el, before) {
    el.dataset.kTab = 'progressi';
    el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', 'k-tab-progressi');
    const ref = before && before.parentElement === training ? before : null;
    ref ? training.insertBefore(el, ref) : training.append(el);
    const tab = $('k-tab-progressi');
    el.hidden = !!tab && tab.getAttribute('aria-selected') !== 'true';
  }
  const firstProgress = training.querySelector(':scope > [data-k-tab="progressi"]');

  /* =================== Mappa della costanza =================== */
  const streakCard = document.createElement('article');
  streakCard.className = 'k-streak'; streakCard.id = 'k-streak';
  streakCard.innerHTML = '<h3>Costanza</h3><div class="k-streak-stats"></div><div class="k-heat" role="img"></div><div class="k-heat-legend"><span>meno</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>più</span></div>';
  intoProgress(streakCard, firstProgress);

  function minutesByDay() {
    const out = {};
    const list = typeof state !== 'undefined' && Array.isArray(state.workouts) ? state.workouts : [];
    for (const w of list) {
      if (!w || !w.completedAt) continue;
      const d = new Date(w.completedAt); if (isNaN(+d)) continue;
      const k = iso(d); out[k] = (out[k] || 0) + Math.max(1, num(w.minutes));
    }
    return out;
  }
  function renderStreak() {
    const m = minutesByDay(), now = new Date(); now.setHours(12, 0, 0, 0);
    // Serie: giorni consecutivi fino a oggi (o fino a ieri, se oggi non ti sei ancora allenato).
    let streak = 0; const d = new Date(now);
    if (!m[iso(d)]) d.setDate(d.getDate() - 1);
    while (m[iso(d)]) { streak++; d.setDate(d.getDate() - 1); }
    let best = 0, run = 0;
    const keys = Object.keys(m).sort();
    if (keys.length) {
      const start = new Date(keys[0] + 'T12:00:00');
      for (const x = new Date(start); x <= now; x.setDate(x.getDate() + 1)) { run = m[iso(x)] ? run + 1 : 0; best = Math.max(best, run); }
    }
    let active30 = 0, min7 = 0;
    for (let i = 0; i < 30; i++) { const x = new Date(now); x.setDate(x.getDate() - i); if (m[iso(x)]) active30++; if (i < 7) min7 += m[iso(x)] || 0; }
    streakCard.querySelector('.k-streak-stats').innerHTML =
      `<div><b>${streak}</b><span>${streak === 1 ? 'giorno di fila' : 'giorni di fila'}</span></div>` +
      `<div><b>${best}</b><span>record serie</span></div>` +
      `<div><b>${active30}</b><span>giorni attivi su 30</span></div>` +
      `<div><b>${Math.round(min7)}</b><span>minuti in 7 giorni</span></div>`;
    // Griglia 12 settimane, lunedì in alto.
    const weeks = 12, end = new Date(now), dow = (end.getDay() + 6) % 7;
    const start = new Date(end); start.setDate(end.getDate() - dow - (weeks - 1) * 7);
    let html = '';
    for (let w = 0; w < weeks; w++) {
      html += '<div class="k-heat-col">';
      for (let r = 0; r < 7; r++) {
        const x = new Date(start); x.setDate(start.getDate() + w * 7 + r);
        const future = x > end, v = m[iso(x)] || 0;
        const lvl = future ? 'fut' : v === 0 ? 'l0' : v < 20 ? 'l1' : v < 45 ? 'l2' : 'l3';
        const label = x.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + (v ? ' · ' + Math.round(v) + ' min' : '');
        html += `<i class="${lvl}${iso(x) === today() ? ' is-today' : ''}" title="${label}"></i>`;
      }
      html += '</div>';
    }
    const heat = streakCard.querySelector('.k-heat');
    heat.innerHTML = '<div class="k-heat-days"><span>L</span><span></span><span>M</span><span></span><span>V</span><span></span><span>D</span></div>' + html;
    heat.setAttribute('aria-label', `Allenamenti delle ultime ${weeks} settimane: ${active30} giorni attivi negli ultimi 30`);
  }

  /* =================== Peso =================== */
  const weightCard = document.createElement('article');
  weightCard.className = 'k-weight'; weightCard.id = 'k-weight';
  weightCard.innerHTML = `<h3>Peso</h3>
    <div class="k-weight-stats"></div>
    <div class="k-weight-chart"></div>
    <form class="k-weight-form" novalidate>
      <label for="k-weight-in">Peso di oggi</label>
      <div class="k-weight-row"><input id="k-weight-in" type="text" inputmode="decimal" autocomplete="off" pattern="[0-9]+([.,][0-9])?" placeholder="kg"><button type="submit">Registra</button></div>
    </form>
    <p class="k-weight-msg" role="status" aria-live="polite"></p>`;
  intoProgress(weightCard, streakCard);
  const form = weightCard.querySelector('form'), input = $('k-weight-in'), msg = weightCard.querySelector('.k-weight-msg');

  function entries() {
    const v = read(LOG, null);
    return v && Array.isArray(v.entries) ? v.entries.filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.d) && num(e.kg) > 0).sort((a, b) => a.d < b.d ? -1 : 1) : [];
  }
  function change(list, days) {
    if (list.length < 2) return null;
    const last = list[list.length - 1], cut = new Date(last.d + 'T12:00:00'); cut.setDate(cut.getDate() - days);
    const ref = list.filter(e => new Date(e.d + 'T12:00:00') <= cut).pop() || list[0];
    return ref === last ? null : last.kg - ref.kg;
  }
  function renderWeight() {
    const list = entries(), last = list[list.length - 1];
    const fmtCh = v => v === null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + kg(Math.abs(v)) + ' kg';
    weightCard.querySelector('.k-weight-stats').innerHTML = last
      ? `<div><b>${kg(last.kg)}</b><span>kg attuali</span></div><div><b>${fmtCh(change(list, 7))}</b><span>in 7 giorni</span></div><div><b>${fmtCh(change(list, 30))}</b><span>in 30 giorni</span></div>`
      : '<p class="k-weight-empty">Registra il peso una volta a settimana, sempre alla stessa ora: qui vedrai l’andamento.</p>';
    const chart = weightCard.querySelector('.k-weight-chart');
    const pts = list.slice(-60);
    if (pts.length < 2) { chart.innerHTML = ''; chart.hidden = true; }
    else {
      chart.hidden = false;
      const W = 320, H = 140, P = 18;
      const t0 = new Date(pts[0].d + 'T12:00:00'), t1 = new Date(pts[pts.length - 1].d + 'T12:00:00');
      const span = Math.max(1, t1 - t0);
      const vals = pts.map(p => p.kg), lo = Math.min(...vals) - 0.5, hi = Math.max(...vals) + 0.5;
      const X = p => P + (new Date(p.d + 'T12:00:00') - t0) / span * (W - 2 * P);
      const Y = v => P + (hi - v) / (hi - lo) * (H - 2 * P);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(p.kg).toFixed(1)).join(' ');
      const area = line + ` L${X(pts[pts.length - 1]).toFixed(1)} ${H - P} L${X(pts[0]).toFixed(1)} ${H - P} Z`;
      chart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento del peso: da ${kg(pts[0].kg)} a ${kg(last.kg)} kg">
        <defs><linearGradient id="k-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77dff" stop-opacity=".35"/><stop offset="1" stop-color="#c77dff" stop-opacity="0"/></linearGradient><linearGradient id="k-wline-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c77dff"/><stop offset=".6" stop-color="#3ee8ff"/><stop offset="1" stop-color="#dfff00"/></linearGradient></defs>
        <text x="${P}" y="12" class="k-wt">${kg(hi - 0.5)}</text><text x="${P}" y="${H - 4}" class="k-wt">${kg(lo + 0.5)}</text>
        <path d="${area}" fill="url(#k-wg)"/><path d="${line}" class="k-wline"/>
        ${pts.map((p, i) => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}" class="${i === pts.length - 1 ? 'k-wlast' : 'k-wdot'}"><title>${new Date(p.d + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}: ${kg(p.kg)} kg</title></circle>`).join('')}
      </svg>`;
    }
    if (!input.value && last && last.d === today()) input.placeholder = kg(last.kg) + ' kg (oggi)';
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = Math.round(num(String(input.value).replace(',', '.')) * 10) / 10;
    if (!(v >= 30 && v <= 300)) { msg.textContent = 'Inserisci un peso tra 30 e 300 kg.'; input.focus(); return; }
    const list = entries().filter(x => x.d !== today());
    list.push({ d: today(), kg: v });
    try {
      localStorage.setItem(LOG, JSON.stringify({ entries: list.slice(-400) }));
      localStorage.setItem('fk-live-weight-v1', String(v));
    } catch (err) { msg.textContent = 'Salvataggio non riuscito.'; return; }
    input.value = '';
    const upd = typeof window.fkUpdateWeight === 'function' ? window.fkUpdateWeight(v) : null;
    msg.textContent = '✓ Peso registrato.' + (upd && upd.changed ? ` Obiettivo aggiornato a ${upd.kcal.toLocaleString('it-IT')} kcal.` : '');
    renderWeight();
    try { navigator.vibrate && navigator.vibrate(10); } catch (err) {}
  });

  /* =================== Card storiche =================== */
  const byTitle = (root, re) => [...root.querySelectorAll(':scope > article')].find(a => re.test(a.querySelector('h3')?.textContent || ''));
  const dash = $('dashboard');
  if (dash) {
    // "Obiettivo allenamenti" va tra i progressi; "Gestisci registrazioni" duplicava eliminazioni e backup.
    const goalCard = byTitle(dash, /obiettivo allenamenti/i);
    if (goalCard) { goalCard.classList.add('k-goalcard'); intoProgress(goalCard, $('fk-manage-workouts')); }
    const manage = byTitle(dash, /gestisci registrazioni/i);
    if (manage) manage.hidden = true;
  }
  const diary = $('diario');
  if (diary) {
    // "Ultima nota" ripeteva la nota già mostrata in "Gestisci nota".
    const cards = diary.querySelectorAll('.lower > article');
    if (cards[1] && /ultima nota/i.test(cards[1].textContent)) cards[1].hidden = true;
    const vault = $('fk-data-vault'), file = $('fk-vault-file');
    if (vault && file && !vault.querySelector('.k-file')) {
      const label = document.createElement('label');
      label.className = 'k-file'; label.htmlFor = 'fk-vault-file';
      label.innerHTML = '<span>Scegli il file di backup</span><small>nessun file selezionato</small>';
      file.before(label); file.classList.add('k-file-input');
      file.addEventListener('change', () => { label.querySelector('small').textContent = file.files && file.files[0] ? file.files[0].name : 'nessun file selezionato'; });
    }
  }

  /* ---------- Aggiornamenti ---------- */
  const refresh = () => { renderStreak(); renderWeight(); };
  const count = $('traincount');
  if (count) new MutationObserver(refresh).observe(count, { childList: true, characterData: true, subtree: true });
  window.addEventListener('storage', refresh);
  refresh();
})();
