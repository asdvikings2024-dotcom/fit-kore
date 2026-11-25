// FIT KORE — profilo con obiettivo calcolato e Home "da coach" con tre anelli.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const PROFILE = 'fk-profile-v1', NUT = 'fk-nutrition-v1', WATER = 'fk-water-v1';
  const today = () => new Date().toLocaleDateString('sv-SE');
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const num = v => Number(v) || 0;
  const it = n => Math.round(n).toLocaleString('it-IT');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dash = $('dashboard');
  if (!dash) return;

  /* =================== Calcolo dell'obiettivo =================== */
  const ACTIVITY = [
    [1.2, 'Sedentario', 'lavoro da seduto, poco movimento'],
    [1.375, 'Leggero', '1–3 allenamenti a settimana'],
    [1.55, 'Moderato', '3–5 allenamenti a settimana'],
    [1.725, 'Intenso', '6–7 allenamenti a settimana'],
    [1.9, 'Atleta', 'allenamenti doppi o lavoro fisico']
  ];
  const GOALS = { lose: ['Dimagrire', 0.85, 2.0], keep: ['Mantenere', 1, 1.6], gain: ['Aumentare massa', 1.1, 1.8] };

  function compute(p) {
    const w = num(p.weight), h = num(p.height), a = num(p.age);
    if (!(w >= 30 && w <= 300 && h >= 120 && h <= 230 && a >= 14 && a <= 100)) return null;
    // Mifflin-St Jeor
    const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'f' ? -161 : 5);
    const tdee = bmr * (num(p.activity) || 1.375);
    const g = GOALS[p.goal] || GOALS.keep;
    let kcal = tdee * g[1];
    const floor = p.sex === 'f' ? 1200 : 1500;
    kcal = Math.round(Math.max(kcal, Math.min(floor, tdee)) / 10) * 10;
    const prot = Math.round(w * g[2]);
    const fat = Math.round(Math.max(w * 0.8, kcal * 0.25 / 9));
    const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
    const water = Math.round(w * 33 / 250) * 250;
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p: prot, c: carb, f: fat, water };
  }
  window.fkProfileTargets = () => { const p = read(PROFILE, null); return p && p.targets ? p.targets : null; };

  function applyGoal(kcal) {
    const d = read(NUT, {}) || {};
    if (d.date !== today()) { d.date = today(); d.entries = []; }
    d.goal = kcal;
    try { localStorage.setItem(NUT, JSON.stringify(d)); } catch (e) {}
    const g = $('fk-cal-goal'); if (g) g.value = kcal;
    if (typeof window.fkRescueDraw === 'function') window.fkRescueDraw();
    if (typeof render === 'function') render();
  }

  /* =================== Foglio "Il tuo profilo" =================== */
  const sheet = document.createElement('div');
  sheet.className = 'k-sheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'k-profile-title');
  sheet.innerHTML = `
  <form class="k-sheet-panel" id="k-profile-form" novalidate>
    <div class="k-sheet-head"><h2 id="k-profile-title">Il tuo profilo</h2><button type="button" class="k-sheet-close" aria-label="Chiudi">✕</button></div>
    <p class="k-sheet-intro">Calcolo il tuo fabbisogno e gli obiettivi di calorie, macro e acqua.</p>
    <label for="k-p-name">Come ti chiami?</label><input id="k-p-name" maxlength="30" autocomplete="given-name" placeholder="Nome">
    <fieldset class="k-seg"><legend>Sesso</legend>
      <label><input type="radio" name="k-p-sex" value="m" checked><span>Uomo</span></label>
      <label><input type="radio" name="k-p-sex" value="f"><span>Donna</span></label></fieldset>
    <div class="k-row3">
      <div><label for="k-p-age">Età</label><input id="k-p-age" type="number" inputmode="numeric" min="14" max="100" placeholder="anni"></div>
      <div><label for="k-p-height">Altezza</label><input id="k-p-height" type="number" inputmode="numeric" min="120" max="230" placeholder="cm"></div>
      <div><label for="k-p-weight">Peso</label><input id="k-p-weight" type="text" inputmode="decimal" autocomplete="off" placeholder="kg"></div>
    </div>
    <label for="k-p-activity">Quanto ti muovi?</label>
    <select id="k-p-activity">${ACTIVITY.map(([v, n, d]) => `<option value="${v}">${n} · ${d}</option>`).join('')}</select>
    <fieldset class="k-seg k-seg3"><legend>Obiettivo</legend>
      ${Object.entries(GOALS).map(([k, [n]], i) => `<label><input type="radio" name="k-p-goal" value="${k}"${i === 1 ? ' checked' : ''}><span>${n}</span></label>`).join('')}</fieldset>
    <label for="k-p-train">Minuti di allenamento al giorno</label>
    <input id="k-p-train" type="number" inputmode="numeric" min="5" max="240" value="30">
    <div class="k-result" aria-live="polite"></div>
    <button type="submit" class="k-sheet-save">Salva e applica</button>
    <p class="k-sheet-note">Stima indicativa (formula Mifflin-St Jeor), non è un consiglio medico. In gravidanza, con patologie o per diete particolari chiedi a un professionista.</p>
  </form>`;
  document.body.append(sheet);
  const f = sheet.querySelector('form'), result = sheet.querySelector('.k-result');

  function formProfile() {
    return {
      name: $('k-p-name').value.trim(),
      sex: f.querySelector('[name="k-p-sex"]:checked').value,
      age: num($('k-p-age').value), height: num($('k-p-height').value), weight: Math.round(num(String($('k-p-weight').value).replace(',', '.')) * 10) / 10,
      activity: num($('k-p-activity').value), goal: f.querySelector('[name="k-p-goal"]:checked').value,
      trainMin: Math.min(240, Math.max(5, num($('k-p-train').value) || 30))
    };
  }
  function preview() {
    const t = compute(formProfile());
    result.innerHTML = t
      ? `<div class="k-result-main"><span>Il tuo obiettivo</span><b>${it(t.kcal)} kcal</b><small>fabbisogno ${it(t.tdee)} kcal · metabolismo a riposo ${it(t.bmr)}</small></div>
         <div class="k-result-macros"><span><b>${t.p} g</b>proteine</span><span><b>${t.c} g</b>carboidrati</span><span><b>${t.f} g</b>grassi</span><span><b>${(t.water / 1000).toLocaleString('it-IT')} l</b>acqua</span></div>`
      : '<p class="k-result-empty">Inserisci età, altezza e peso per vedere il calcolo.</p>';
    return t;
  }
  let lastFocus = null;
  function openSheet() {
    const p = read(PROFILE, {}) || {};
    $('k-p-name').value = p.name || (window.fkUser && window.fkUser.name ? window.fkUser.name.split(' ')[0] : '');
    f.querySelector(`[name="k-p-sex"][value="${p.sex === 'f' ? 'f' : 'm'}"]`).checked = true;
    $('k-p-age').value = p.age || ''; $('k-p-height').value = p.height || '';
    $('k-p-weight').value = String(p.weight || num(localStorage.getItem('fk-live-weight-v1')) || '').replace('.', ',');
    $('k-p-activity').value = String(p.activity || 1.375);
    f.querySelector(`[name="k-p-goal"][value="${GOALS[p.goal] ? p.goal : 'keep'}"]`).checked = true;
    $('k-p-train').value = p.trainMin || 30;
    preview();
    lastFocus = document.activeElement;
    sheet.hidden = false; document.body.classList.add('k-sheet-open');
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    setTimeout(() => (p.age ? sheet.querySelector('.k-sheet-close') : $('k-p-name')).focus({ preventScroll: true }), 50);
  }
  function closeSheet() {
    sheet.classList.remove('is-open'); document.body.classList.remove('k-sheet-open');
    setTimeout(() => { sheet.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); }, 280);
  }
  f.addEventListener('input', preview);
  f.addEventListener('change', preview);
  sheet.querySelector('.k-sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const p = formProfile(), t = preview();
    if (!t) { $('k-p-age').focus(); return; }
    p.targets = t; p.updatedAt = Date.now();
    try { localStorage.setItem(PROFILE, JSON.stringify(p)); if (p.weight) localStorage.setItem('fk-live-weight-v1', String(p.weight)); } catch (err) {}
    applyGoal(t.kcal);
    closeSheet(); renderCoach(true);
    try { navigator.vibrate && navigator.vibrate([10, 30, 10]); } catch (err) {}
  });
  window.fkOpenProfile = openSheet;
  // Nuovo peso registrato: aggiorna profilo e obiettivi (se il profilo esiste).
  window.fkUpdateWeight = kg => {
    const p = read(PROFILE, null);
    if (!p) return null;
    p.weight = kg;
    const t = compute(p);
    if (!t) return null;
    const before = p.targets && p.targets.kcal;
    p.targets = t; p.updatedAt = Date.now();
    try { localStorage.setItem(PROFILE, JSON.stringify(p)); } catch (e) {}
    applyGoal(t.kcal); schedule();
    return { kcal: t.kcal, changed: before !== t.kcal };
  };

  /* =================== Card coach in Home =================== */
  const card = document.createElement('article');
  card.className = 'k-coach'; card.id = 'k-coach';
  card.innerHTML = `
    <div class="k-coach-head"><div><span class="k-coach-hello"></span><h2 class="k-coach-msg"></h2></div>
      <button type="button" class="k-coach-profile" aria-label="Profilo e obiettivi">${'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'}</button></div>
    <div class="k-coach-body">
      <svg class="k-rings" viewBox="0 0 200 200" role="img" aria-label="Anelli di oggi">
        <defs>
          <linearGradient id="k-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ff7a"/><stop offset="1" stop-color="#bfff00"/></linearGradient>
          <linearGradient id="k-g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff3ff"/><stop offset="1" stop-color="#2fb8ff"/></linearGradient>
          <linearGradient id="k-g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b8c6ff"/></linearGradient>
        </defs>
        ${[[88, 'k-g1', 'kcal'], [66, 'k-g2', 'train'], [44, 'k-g3', 'water']].map(([r, g, k]) =>
          `<circle class="k-ring-bg" cx="100" cy="100" r="${r}"/><circle class="k-ring k-ring-${k}" cx="100" cy="100" r="${r}" stroke="url(#${g})" stroke-dasharray="${(2 * Math.PI * r).toFixed(1)}" stroke-dashoffset="${(2 * Math.PI * r).toFixed(1)}"/>`).join('')}
      </svg>
      <ul class="k-coach-stats">
        <li class="k-st-kcal"><i></i><div><span>Calorie</span><b data-k="kcal"></b></div><button type="button" class="k-coach-goal">Obiettivo</button></li>
        <li class="k-st-train"><i></i><div><span>Allenamento</span><b data-k="train"></b></div><button type="button" class="k-coach-train">Inizia</button></li>
        <li class="k-st-water"><i></i><div><span>Acqua</span><b data-k="water"></b></div><button type="button" class="k-coach-water" aria-label="Aggiungi 250 ml di acqua">+250 ml</button></li>
      </ul>
    </div>
    <button type="button" class="k-coach-cta" hidden>Calcola il tuo obiettivo personale →</button>`;
  const firstBlock = dash.querySelector('.hx-hero') || dash.firstElementChild;
  dash.insertBefore(card, firstBlock);

  function hello() {
    const h = new Date().getHours();
    return h < 5 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  }
  function data() {
    const n = read(NUT, {}) || {}, p = read(PROFILE, null);
    const entries = n.date === today() && Array.isArray(n.entries) ? n.entries : [];
    let kcal = entries.reduce((a, x) => a + num(x.kcal), 0);
    if (typeof state !== 'undefined' && Array.isArray(state.meals)) kcal += state.meals.reduce((a, m) => a + num(m.kcal), 0);
    const goal = num(n.goal) || 2000;
    const t = today();
    const train = (typeof state !== 'undefined' && Array.isArray(state.workouts) ? state.workouts : [])
      .filter(w => w && w.completedAt && new Date(w.completedAt).toLocaleDateString('sv-SE') === t)
      .reduce((a, w) => a + num(w.minutes), 0);
    const trainGoal = (p && p.trainMin) || 30;
    const ws = read(WATER, {}) || {};
    const water = ws.date === t && Array.isArray(ws.entries) ? ws.entries.reduce((a, x) => a + num(x), 0) : 0;
    const waterGoal = (p && p.targets && p.targets.water) || 2000;
    const meals = new Set(entries.map(x => x.mealType));
    return { kcal, goal, train, trainGoal, water, waterGoal, meals, profile: p };
  }
  function message(d) {
    const h = new Date().getHours(), left = d.goal - d.kcal;
    if (d.kcal > d.goal * 1.1) return `Sei ${it(d.kcal - d.goal)} kcal sopra l’obiettivo: punta su verdure e proteine magre.`;
    if (d.train >= d.trainGoal && d.kcal >= d.goal * 0.85) return 'Giornata completa: allenamento fatto e calorie a posto. 🔥';
    if (d.train >= d.trainGoal) return `Allenamento fatto! Ti restano ${it(Math.max(0, left))} kcal per oggi.`;
    if (h < 11 && !d.meals.has('Colazione') && !d.kcal) return 'Inizia bene: registra la colazione.';
    if (h >= 12 && h < 15 && !d.meals.has('Pranzo')) return 'È ora di pranzo: cosa mangi oggi?';
    if (h >= 19 && h < 22 && !d.meals.has('Cena') && d.kcal) return `Per cena ti restano ${it(Math.max(0, left))} kcal.`;
    if (d.water < d.waterGoal * 0.4 && h >= 14) return 'Ricordati di bere: sei indietro con l’acqua.';
    if (d.train > 0) return `Ancora ${it(d.trainGoal - d.train)} minuti per chiudere l’anello dell’allenamento.`;
    return h >= 18 ? 'C’è ancora tempo per un allenamento veloce.' : 'Oggi si spinge forte. Muoviti almeno ' + d.trainGoal + ' minuti.';
  }
  let firstPaint = true;
  function renderCoach(celebrate) {
    const d = data();
    const name = (d.profile && d.profile.name) || (window.fkUser && window.fkUser.name ? window.fkUser.name.split(' ')[0] : '');
    card.querySelector('.k-coach-hello').textContent = hello() + (name ? ', ' + name : '');
    card.querySelector('.k-coach-msg').textContent = message(d);
    const set = (k, v, g, unit) => {
      card.querySelector(`[data-k="${k}"]`).innerHTML = `${it(v)}<small> / ${it(g)} ${unit}</small>`;
      const ring = card.querySelector('.k-ring-' + k), C = parseFloat(ring.getAttribute('stroke-dasharray'));
      const pct = Math.min(1, g ? v / g : 0);
      ring.style.strokeDashoffset = String(C * (1 - pct));
      ring.classList.toggle('is-full', pct >= 1);
    };
    const apply = () => {
      set('kcal', d.kcal, d.goal, 'kcal'); set('train', d.train, d.trainGoal, 'min'); set('water', d.water, d.waterGoal, 'ml');
    };
    if (firstPaint && !reduce) { firstPaint = false; requestAnimationFrame(() => requestAnimationFrame(apply)); } else apply();
    card.querySelector('.k-coach-cta').hidden = !!(d.profile && d.profile.targets);
    if (celebrate && !reduce) { card.classList.remove('k-pop'); void card.offsetWidth; card.classList.add('k-pop'); }
  }

  card.querySelector('.k-coach-profile').addEventListener('click', openSheet);
  card.querySelector('.k-coach-cta').addEventListener('click', openSheet);
  card.querySelector('.k-coach-goal').addEventListener('click', openSheet);
  card.querySelector('.k-coach-train').addEventListener('click', () => $('hx-start') ? $('hx-start').click() : document.querySelector('[data-page="allenamenti"]')?.click());
  card.querySelector('.k-coach-water').addEventListener('click', () => {
    const btn = $('fk-water-add');
    if (btn) btn.click();
    else {
      const ws = read(WATER, {}) || {};
      if (ws.date !== today() || !Array.isArray(ws.entries)) { ws.date = today(); ws.entries = []; }
      ws.entries.push(250); try { localStorage.setItem(WATER, JSON.stringify(ws)); } catch (e) {}
    }
    renderCoach();
    try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
  });
  // Il link "Modifica obiettivo" della vecchia card apre il profilo.
  document.addEventListener('click', e => {
    if (e.target.closest('.k-goal-link')) { e.preventDefault(); e.stopImmediatePropagation(); openSheet(); }
  }, true);

  // Aggiornamenti: pasti, allenamenti, acqua, sincronizzazione.
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; renderCoach(); }); };
  ['fk-rescue-eaten', 'traincount', 'fk-water-total', 'd-kcal'].forEach(id => {
    const el = $(id); if (el) new MutationObserver(schedule).observe(el, { childList: true, characterData: true, subtree: true });
  });
  window.addEventListener('storage', schedule);
  window.addEventListener('fk-user', schedule);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(); });
  setInterval(schedule, 5 * 60000);
  renderCoach();
})();
