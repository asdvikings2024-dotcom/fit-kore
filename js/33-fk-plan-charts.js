// FIT KORE — piano settimanale e grafici per esercizio.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const training = $('allenamenti');
  if (!training) return;
  const PLAN = 'fk-plan-v1';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => Number(v) || 0;
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
  const DAYS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Gio'], [5, 'Ven'], [6, 'Sab'], [0, 'Dom']];
  const COLORS = { Push: '#ff6b6b', Pull: '#4d9bff', Gambe: '#9dff4a', 'Full body': '#ffd84d', Upper: '#c77dff', Lower: '#2ee6a6', Cardio: '#3ee8ff', Corsa: '#ff8a4c' };
  const SHORT = { 'Full body': 'Full', Cardio: 'Cardio', Corsa: 'Corsa', Gambe: 'Gambe' };
  const OPTIONS = () => ['', ...(window.fkGymTemplates || ['Push', 'Pull', 'Gambe', 'Full body', 'Upper', 'Lower']), 'Cardio', 'Corsa'];

  function readPlan() { try { const v = JSON.parse(localStorage.getItem(PLAN) || 'null'); return v && v.days ? v : { days: {} }; } catch (e) { return { days: {} }; } }
  window.fkPlanToday = () => readPlan().days[new Date().getDay()] || '';

  function place(el, tab, before) {
    el.dataset.kTab = tab; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', 'k-tab-' + tab);
    before && before.parentElement === training ? training.insertBefore(el, before) : training.append(el);
    const t = $('k-tab-' + tab); el.hidden = !!t && t.getAttribute('aria-selected') !== 'true';
  }

  /* =================== Piano settimanale =================== */
  const plan = document.createElement('article');
  plan.className = 'k-plan'; plan.id = 'k-plan';
  const gym = $('k-gym');
  place(plan, 'sessione', gym ? gym.nextElementSibling : null);

  function renderPlan(editing) {
    const p = readPlan(), today = new Date().getDay();
    const todayName = p.days[today] || '';
    if (editing) {
      plan.innerHTML = `<h3>Piano settimanale</h3><p>Scegli cosa allenare ogni giorno. La Home ti ricorderà l’allenamento di oggi.</p>
        <div class="k-plan-edit">${DAYS.map(([d, l]) => `<label><span>${l}</span><select data-day="${d}">${OPTIONS().map(o => `<option value="${esc(o)}"${(p.days[d] || '') === o ? ' selected' : ''}>${o ? esc(o) : 'Riposo'}</option>`).join('')}</select></label>`).join('')}</div>
        <div class="k-plan-actions"><button type="button" class="k-plan-preset">Proposta 4 giorni</button><button type="button" class="k-plan-save">Salva piano</button></div>`;
      return;
    }
    const any = Object.values(p.days).some(Boolean);
    plan.innerHTML = `<div class="k-plan-head"><h3>Piano settimanale</h3><button type="button" class="k-plan-edit-btn">${any ? 'Modifica' : 'Crea piano'}</button></div>
      <div class="k-plan-week">${DAYS.map(([d, l]) => { const n = p.days[d] || ''; return `<div class="k-plan-day${d === today ? ' is-today' : ''}${n ? '' : ' is-rest'}" style="--pc:${COLORS[n] || '#5a635a'}"><span>${l}</span><b title="${n ? esc(n) : 'Riposo'}">${n ? esc(SHORT[n] || n) : '—'}</b></div>`; }).join('')}</div>
      ${todayName && window.fkGymTemplates && window.fkGymTemplates.includes(todayName) && !(window.fkGymActive && window.fkGymActive())
        ? `<button type="button" class="k-plan-go" style="--pc:${COLORS[todayName]}">Oggi: ${esc(todayName)} · inizia →</button>`
        : (!any ? '<p class="k-plan-hint">Crea il tuo piano: in Home vedrai ogni giorno cosa allenare.</p>' : '')}`;
  }
  plan.addEventListener('click', e => {
    if (e.target.closest('.k-plan-edit-btn')) return renderPlan(true);
    if (e.target.closest('.k-plan-preset')) {
      const preset = { 1: 'Push', 2: 'Pull', 3: '', 4: 'Gambe', 5: 'Full body', 6: 'Cardio', 0: '' };
      plan.querySelectorAll('select[data-day]').forEach(s => { s.value = preset[s.dataset.day] ?? ''; });
      return;
    }
    if (e.target.closest('.k-plan-save')) {
      const days = {};
      plan.querySelectorAll('select[data-day]').forEach(s => { if (s.value) days[s.dataset.day] = s.value; });
      try { localStorage.setItem(PLAN, JSON.stringify({ days })); } catch (err) {}
      renderPlan(false); window.dispatchEvent(new Event('fk-plan'));
      if (window.fkToast) window.fkToast('📅 Piano salvato');
      return;
    }
    const go = e.target.closest('.k-plan-go');
    if (go && window.fkGymStart) window.fkGymStart(window.fkPlanToday());
  });

  /* =================== Grafici per esercizio =================== */
  const chart = document.createElement('article');
  chart.className = 'k-exchart'; chart.id = 'k-exchart';
  place(chart, 'progressi', $('k-weight'));
  let current = '';
  const e1rm = s => num(s.kg) * (1 + num(s.reps) / 30);

  function seriesFor(name, hist) {
    return hist.map(s => {
      const ex = s.exercises.find(x => x.name === name); if (!ex || !ex.sets.length) return null;
      const best = ex.sets.reduce((b, x) => e1rm(x) > e1rm(b) ? x : b, ex.sets[0]);
      return { d: s.date, e: e1rm(best), kg: num(best.kg), reps: num(best.reps), vol: ex.sets.reduce((a, x) => a + num(x.kg) * num(x.reps), 0), sets: ex.sets.length };
    }).filter(Boolean);
  }
  function renderChart() {
    const hist = window.fkGymHistory ? window.fkGymHistory() : [];
    const count = {};
    hist.forEach(s => s.exercises.forEach(x => { count[x.name] = (count[x.name] || 0) + 1; }));
    const names = Object.keys(count).sort((a, b) => count[b] - count[a]);
    if (!names.length) {
      chart.innerHTML = '<h3>Progressi per esercizio</h3><p class="k-ex-empty">Dopo il primo allenamento in palestra qui vedrai come crescono i tuoi carichi, esercizio per esercizio.</p>';
      return;
    }
    if (!names.includes(current)) current = names[0];
    const pts = seriesFor(current, hist).slice(-30);
    const best = pts.reduce((b, p) => !b || p.e > b.e ? p : b, null), last = pts[pts.length - 1], first = pts[0];
    const delta = pts.length > 1 ? last.e - first.e : 0;
    let svg = '';
    if (pts.length > 1) {
      const W = 320, H = 150, P = 20, lo = Math.min(...pts.map(p => p.e)) * 0.95, hi = Math.max(...pts.map(p => p.e)) * 1.03;
      const X = i => P + i / (pts.length - 1) * (W - 2 * P), Y = v => P + (hi - v) / (hi - lo || 1) * (H - 2 * P);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.e).toFixed(1)).join(' ');
      const area = line + ` L${X(pts.length - 1).toFixed(1)} ${H - P} L${P} ${H - P} Z`;
      svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento di ${esc(current)}">
        <defs><linearGradient id="k-exg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4d7cff"/><stop offset=".6" stop-color="#3ee8ff"/><stop offset="1" stop-color="#dfff00"/></linearGradient>
        <linearGradient id="k-exa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ee8ff" stop-opacity=".3"/><stop offset="1" stop-color="#3ee8ff" stop-opacity="0"/></linearGradient></defs>
        <path d="${area}" fill="url(#k-exa)"/><path d="${line}" class="k-exline"/>
        ${pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.e).toFixed(1)}" r="${p === best ? 6 : 3.5}" class="${p === best ? 'k-exbest' : 'k-exdot'}"><title>${new Date(p.d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}: ${fmt(p.kg)} kg × ${p.reps}</title></circle>`).join('')}
      </svg>`;
    }
    chart.innerHTML = `<h3>Progressi per esercizio</h3>
      <select class="k-ex-select" aria-label="Scegli l’esercizio">${names.map(n => `<option${n === current ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <div class="k-ex-stats">
        <div><b>${fmt(best.kg)}<small> kg × ${best.reps}</small></b><span>record</span></div>
        <div><b>${fmt(best.e)}<small> kg</small></b><span>massimale stimato</span></div>
        <div><b class="${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}">${delta > 0 ? '+' : delta < 0 ? '−' : ''}${fmt(Math.abs(delta))}<small> kg</small></b><span>da ${pts.length} sessioni</span></div>
      </div>
      ${svg || '<p class="k-ex-empty">Serve almeno un secondo allenamento con questo esercizio per vedere il grafico.</p>'}
      <p class="k-ex-foot">Massimale stimato con la formula di Epley sulla serie migliore di ogni sessione.</p>`;
  }
  chart.addEventListener('change', e => { if (e.target.classList.contains('k-ex-select')) { current = e.target.value; renderChart(); } });

  /* ---------- Aggiornamenti ---------- */
  const refresh = () => { if (!plan.querySelector('select')) renderPlan(false); renderChart(); };
  window.addEventListener('storage', refresh);
  const count = $('traincount'); if (count) new MutationObserver(refresh).observe(count, { childList: true, characterData: true, subtree: true });
  const gymCard = $('k-gym'); if (gymCard) new MutationObserver(() => { if (!plan.querySelector('select')) renderPlan(false); }).observe(gymCard, { childList: true });
  renderPlan(false); renderChart();
  window.dispatchEvent(new Event('fk-plan'));
})();
