// FIT KORE — promemoria: pasti, acqua, allenamento e peso.
// Notifiche locali: arrivano mentre l'app è aperta o installata e attiva in background.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'fk-reminders-v1', SENT = 'fk-rem-sent';
  const today = () => new Date().toLocaleDateString('sv-SE');
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const DEF = { on: false, meals: true, water: true, train: true, weight: true, lunch: '13:00', dinner: '20:00', trainAt: '18:00' };
  const cfg = () => ({ ...DEF, ...(read(KEY, {}) || {}) });
  const supported = 'Notification' in window;

  /* ---------- Card nel Diario ---------- */
  const diary = $('diario');
  if (!diary) return;
  const card = document.createElement('article');
  card.className = 'k-rem'; card.id = 'k-rem';
  const vault = $('fk-data-vault');
  vault ? diary.insertBefore(card, vault) : diary.append(card);

  function render() {
    const c = cfg(), perm = supported ? Notification.permission : 'unsupported';
    const row = (k, title, sub) => `<label class="k-rem-row"><span><b>${title}</b><small>${sub}</small></span><input type="checkbox" role="switch" data-k="${k}"${c[k] ? ' checked' : ''}${c.on ? '' : ' disabled'}><i aria-hidden="true"></i></label>`;
    card.innerHTML = `<div class="k-rem-head"><h3>Promemoria</h3>
        <label class="k-rem-master"><input type="checkbox" role="switch" data-k="on"${c.on ? ' checked' : ''} aria-label="Attiva promemoria"><i aria-hidden="true"></i></label></div>
      <p class="k-rem-sub">${c.on ? 'Ti avviso solo quando serve: se hai già registrato, niente notifica.' : 'Attivali per non dimenticare pasti, acqua e allenamenti.'}</p>
      ${row('meals', 'Pasti', `pranzo alle <input type="time" data-t="lunch" value="${c.lunch}"> · cena alle <input type="time" data-t="dinner" value="${c.dinner}">`)}
      ${row('water', 'Acqua', 'ogni 2 ore tra le 10 e le 20, se sei indietro')}
      ${row('train', 'Allenamento', `alle <input type="time" data-t="trainAt" value="${c.trainAt}"> nei giorni del tuo piano`)}
      ${row('weight', 'Peso', 'il lunedì mattina')}
      <p class="k-rem-note">${!supported ? 'Questo browser non supporta le notifiche: vedrai i promemoria dentro l’app.'
        : perm === 'denied' ? 'Le notifiche sono bloccate nelle impostazioni del browser: vedrai i promemoria dentro l’app.'
        : 'Le notifiche arrivano mentre FIT KORE è aperta o installata sul telefono. Su iPhone servono iOS 16.4 o successivo e l’app aggiunta alla schermata Home.'}</p>
      <button type="button" class="k-rem-test"${c.on ? '' : ' hidden'}>Prova una notifica</button>`;
  }
  async function enable() {
    if (supported && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (e) {}
    }
  }
  card.addEventListener('change', async e => {
    const c = cfg();
    const k = e.target.dataset.k, t = e.target.dataset.t;
    if (k) c[k] = e.target.checked;
    if (t && /^\d{2}:\d{2}$/.test(e.target.value)) c[t] = e.target.value;
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (err) {}
    if (!t) render();
    if (k === 'on' && c.on) { await enable(); render(); }
  });
  card.addEventListener('click', e => { if (e.target.closest('.k-rem-test')) notify('test', 'FIT KORE', 'I promemoria funzionano. 💪', 'dashboard', true); });

  /* ---------- Invio ---------- */
  async function notify(id, title, body, page, force) {
    const sent = read(SENT, {}), stamp = today();
    if (!force && sent[id] === stamp) return;
    sent[id] = stamp; try { localStorage.setItem(SENT, JSON.stringify(sent)); } catch (e) {}
    let shown = false;
    if (supported && Notification.permission === 'granted') {
      try {
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
        const opts = { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'fk-' + id, data: { page } };
        if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
        shown = true;
      } catch (e) {}
    }
    // Se l'app è in primo piano mostriamo comunque il messaggio dentro l'app.
    if ((!shown || document.visibilityState === 'visible') && window.fkToast) window.fkToast(`🔔 ${body}`);
  }
  const at = hm => { const [h, m] = hm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; };
  function check() {
    const c = cfg(); if (!c.on) return;
    const now = new Date(), h = now.getHours();
    const n = read('fk-nutrition-v1', {}) || {}, entries = n.date === today() && Array.isArray(n.entries) ? n.entries : [];
    const has = t => entries.some(x => x.mealType === t);
    if (c.meals) {
      const l = at(c.lunch), d = at(c.dinner);
      if (now >= l && now - l < 2 * 36e5 && !has('Pranzo')) notify('lunch', 'Pranzo', 'Non hai ancora registrato il pranzo: bastano due tocchi.', 'alimentazione');
      if (now >= d && now - d < 2 * 36e5 && !has('Cena')) notify('dinner', 'Cena', 'Ricordati di registrare la cena.', 'alimentazione');
    }
    if (c.water && h >= 10 && h <= 20 && h % 2 === 0) {
      const w = read('fk-water-v1', {}) || {}, ml = w.date === today() && Array.isArray(w.entries) ? w.entries.reduce((a, x) => a + (Number(x) || 0), 0) : 0;
      const p = read('fk-profile-v1', null), goal = (p && p.targets && p.targets.water) || 2000;
      const expected = goal * Math.min(1, (h - 8) / 12);
      if (ml < expected * 0.7) notify('water-' + h, 'Acqua', `Sei a ${ml.toLocaleString('it-IT')} ml su ${goal.toLocaleString('it-IT')}: bevi un bicchiere.`, 'dashboard');
    }
    if (c.train) {
      const plan = typeof window.fkPlanToday === 'function' ? window.fkPlanToday() : '';
      const t = at(c.trainAt);
      const done = typeof state !== 'undefined' && Array.isArray(state.workouts) && state.workouts.some(w => w.completedAt && new Date(w.completedAt).toLocaleDateString('sv-SE') === today());
      if (plan && !done && now >= t && now - t < 3 * 36e5) notify('train', 'Allenamento', `Oggi tocca ${plan}: si parte?`, 'allenamenti');
    }
    if (c.weight && now.getDay() === 1 && h >= 7 && h < 11) {
      const log = read('fk-weight-log-v1', {}) || {};
      if (!(Array.isArray(log.entries) && log.entries.some(e => e.d === today()))) notify('weight', 'Peso', 'È lunedì: registra il peso per vedere i tuoi progressi.', 'allenamenti');
    }
  }
  render();
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(check, 1500); });
  setTimeout(check, 4000);
  // Apertura da notifica: vai alla sezione giusta.
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.fkPage) document.querySelector(`[data-page="${e.data.fkPage}"]`)?.click();
  });
})();
