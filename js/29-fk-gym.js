// FIT KORE — registro palestra: esercizi, serie × ripetizioni × kg, recupero, record.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'fk-gym-v1';
  const training = $('allenamenti');
  if (!training) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  /* ---------- Libreria esercizi ---------- */
  const LIB = {
    Petto: ['Panca piana bilanciere', 'Panca inclinata manubri', 'Panca piana manubri', 'Panca inclinata bilanciere', 'Croci ai cavi', 'Croci con manubri', 'Chest press', 'Pectoral machine', 'Dip alle parallele', 'Piegamenti'],
    Schiena: ['Trazioni alla sbarra', 'Lat machine', 'Rematore bilanciere', 'Rematore manubrio', 'Pulley basso', 'Pulldown braccia tese', 'T-bar row', 'Stacco da terra', 'Hyperextension'],
    Spalle: ['Military press', 'Lento avanti manubri', 'Alzate laterali', 'Alzate frontali', 'Alzate posteriori', 'Face pull', 'Arnold press', 'Tirate al mento', 'Shoulder press machine'],
    Gambe: ['Squat', 'Front squat', 'Pressa', 'Affondi', 'Bulgarian split squat', 'Leg extension', 'Leg curl', 'Stacco rumeno', 'Hack squat', 'Calf raise in piedi', 'Calf seduto'],
    Glutei: ['Hip thrust', 'Glute bridge', 'Abductor machine', 'Kickback ai cavi', 'Step up'],
    Bicipiti: ['Curl bilanciere', 'Curl manubri', 'Curl a martello', 'Curl alla panca Scott', 'Curl ai cavi', 'Curl concentrato'],
    Tricipiti: ['Push down ai cavi', 'French press', 'Estensioni sopra la testa', 'Dip alla panca', 'Panca presa stretta', 'Kickback manubrio'],
    Addome: ['Plank', 'Crunch', 'Crunch ai cavi', 'Leg raise', 'Russian twist', 'Ab wheel', 'Mountain climber'],
    Cardio: ['Tapis roulant', 'Cyclette', 'Ellittica', 'Vogatore', 'Corda', 'Burpees']
  };
  const MUSCLE = {};
  Object.entries(LIB).forEach(([m, list]) => list.forEach(n => { MUSCLE[n] = m; }));
  const TEMPLATES = {
    'Push': ['Panca piana bilanciere', 'Panca inclinata manubri', 'Military press', 'Alzate laterali', 'Push down ai cavi', 'French press'],
    'Pull': ['Trazioni alla sbarra', 'Rematore bilanciere', 'Lat machine', 'Face pull', 'Curl bilanciere', 'Curl a martello'],
    'Gambe': ['Squat', 'Pressa', 'Stacco rumeno', 'Leg extension', 'Leg curl', 'Calf raise in piedi'],
    'Full body': ['Squat', 'Panca piana bilanciere', 'Rematore bilanciere', 'Military press', 'Plank'],
    'Upper': ['Panca piana bilanciere', 'Lat machine', 'Lento avanti manubri', 'Rematore manubrio', 'Curl manubri', 'Push down ai cavi'],
    'Lower': ['Squat', 'Stacco rumeno', 'Affondi', 'Hip thrust', 'Leg curl', 'Calf seduto']
  };
  const REST_DEFAULT = 90;

  /* ---------- Dati ---------- */
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') return { active: v.active || null, history: Array.isArray(v.history) ? v.history : [], rest: v.rest || REST_DEFAULT }; } catch (e) {}
    return { active: null, history: [], rest: REST_DEFAULT };
  }
  let db = load();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ active: db.active, history: db.history.slice(-200), rest: db.rest })); } catch (e) {} }

  const e1rm = s => num(s.kg) * (1 + num(s.reps) / 30); // Epley
  function lastFor(name) {
    for (let i = db.history.length - 1; i >= 0; i--) {
      const ex = db.history[i].exercises.find(x => x.name === name);
      if (ex && ex.sets.length) return { date: db.history[i].date, sets: ex.sets };
    }
    return null;
  }
  function bestFor(name) {
    let best = null;
    for (const s of db.history) for (const ex of s.exercises) if (ex.name === name) for (const set of ex.sets) {
      if (num(set.kg) > 0 && num(set.reps) > 0 && (!best || e1rm(set) > e1rm(best))) best = { kg: num(set.kg), reps: num(set.reps), date: s.date };
    }
    return best;
  }
  const summary = sets => {
    const s = sets.filter(x => num(x.reps) > 0);
    if (!s.length) return '';
    const kgs = s.map(x => num(x.kg)), same = kgs.every(k => k === kgs[0]), reps = s.map(x => num(x.reps));
    const sameReps = reps.every(r => r === reps[0]);
    return (sameReps ? s.length + '×' + reps[0] : reps.join('/')) + (kgs[0] ? ' · ' + (same ? fmt(kgs[0]) : fmt(Math.min(...kgs)) + '–' + fmt(Math.max(...kgs))) + ' kg' : '');
  };
  const ago = iso => {
    const d = Math.round((new Date().setHours(12, 0, 0, 0) - new Date(iso).setHours(12, 0, 0, 0)) / 864e5);
    return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : d < 7 ? d + ' giorni fa' : new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };
  const volume = exs => exs.reduce((a, ex) => a + ex.sets.filter(s => s.done).reduce((b, s) => b + num(s.kg) * num(s.reps), 0), 0);

  /* ---------- Card ---------- */
  const card = document.createElement('article');
  card.className = 'k-gym'; card.id = 'k-gym';
  card.dataset.kTab = 'sessione';
  const firstSession = training.querySelector(':scope > [data-k-tab="sessione"]');
  firstSession ? training.insertBefore(card, firstSession) : training.append(card);
  { const tab = $('k-tab-sessione'); card.hidden = !!tab && tab.getAttribute('aria-selected') === 'false'; }

  let tick = null;
  function render() {
    clearInterval(tick);
    if (db.active) return renderActive();
    const last = db.history[db.history.length - 1];
    const prs = Object.keys(MUSCLE).map(n => [n, bestFor(n)]).filter(([, b]) => b).sort((a, b) => b[1].date < a[1].date ? -1 : 1).slice(0, 4);
    card.innerHTML = `
      <div class="k-gym-hero">
        <span class="k-gym-eyebrow">Palestra</span>
        <h3 class="k-gym-title">Serie, ripetizioni e carichi</h3>
        <p>Scegli un modello o parti da zero: FIT KORE ricorda i pesi dell’ultima volta e ti avvisa quando batti un record.</p>
      </div>
      <div class="k-gym-templates">${Object.keys(TEMPLATES).map(t => `<button type="button" data-tpl="${esc(t)}"><b>${esc(t)}</b><small>${TEMPLATES[t].length} esercizi</small></button>`).join('')}</div>
      <button type="button" class="k-gym-start" data-tpl="">Allenamento libero →</button>
      ${last ? `<div class="k-gym-last"><span>Ultimo allenamento</span><b>${esc(last.name)}</b><small>${ago(last.date)} · ${last.minutes} min · ${last.sets} serie · ${fmt(last.volume)} kg sollevati</small></div>` : ''}
      ${prs.length ? `<div class="k-gym-prs"><span>Record personali</span>${prs.map(([n, b]) => `<div><b>${esc(n)}</b><em>${fmt(b.kg)} kg × ${b.reps}</em></div>`).join('')}</div>` : ''}`;
  }

  function renderActive() {
    const a = db.active;
    const doneSets = a.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.done).length, 0);
    card.innerHTML = `
      <div class="k-gym-bar">
        <div><span class="k-gym-eyebrow">In corso</span><input class="k-gym-name" value="${esc(a.name)}" aria-label="Nome allenamento" maxlength="40"></div>
        <div class="k-gym-clock" aria-label="Durata"><b data-clock>0:00</b><small>${doneSets} serie · ${fmt(volume(a.exercises))} kg</small></div>
      </div>
      <div class="k-gym-list">${a.exercises.map((ex, i) => exerciseHtml(ex, i)).join('') || '<p class="k-gym-empty">Aggiungi il primo esercizio.</p>'}</div>
      <button type="button" class="k-gym-add">+ Aggiungi esercizio</button>
      <div class="k-gym-end"><button type="button" class="k-gym-cancel">Annulla</button><button type="button" class="k-gym-finish">Termina e salva</button></div>`;
    const clock = card.querySelector('[data-clock]');
    const upd = () => { const s = Math.floor((Date.now() - a.startedAt) / 1000); clock.textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') : Math.floor(s / 60)) + ':' + String(s % 60).padStart(2, '0'); };
    upd(); tick = setInterval(upd, 1000);
  }
  function exerciseHtml(ex, i) {
    const last = lastFor(ex.name), best = bestFor(ex.name);
    return `<div class="k-ex" data-i="${i}">
      <div class="k-ex-head"><div><b>${esc(ex.name)}</b><span class="k-ex-muscle">${esc(MUSCLE[ex.name] || 'Personalizzato')}</span></div>
        <button type="button" class="k-ex-del" aria-label="Rimuovi ${esc(ex.name)}">✕</button></div>
      <p class="k-ex-hint">${last ? 'Ultima volta (' + ago(last.date) + '): ' + esc(summary(last.sets)) : 'Prima volta: scegli un carico comodo.'}${best ? ' · <span class="k-ex-pr">Record ' + fmt(best.kg) + ' kg × ' + best.reps + '</span>' : ''}</p>
      <div class="k-sets"><div class="k-set k-set-head"><span>Serie</span><span>kg</span><span>Ripetizioni</span><span></span></div>
      ${ex.sets.map((s, j) => {
        const prev = last && last.sets[j];
        return `<div class="k-set${s.done ? ' is-done' : ''}${s.pr ? ' is-pr' : ''}" data-j="${j}">
          <span class="k-set-n">${s.pr ? '🏆' : j + 1}</span>
          <input inputmode="decimal" data-f="kg" value="${s.kg === '' || s.kg == null ? '' : esc(String(s.kg).replace('.', ','))}" placeholder="${prev ? esc(String(prev.kg).replace('.', ',')) : '0'}" aria-label="Chili serie ${j + 1}">
          <input inputmode="numeric" data-f="reps" value="${s.reps === '' || s.reps == null ? '' : esc(s.reps)}" placeholder="${prev ? esc(prev.reps) : '10'}" aria-label="Ripetizioni serie ${j + 1}">
          <button type="button" class="k-set-ok" aria-pressed="${!!s.done}" aria-label="Serie ${j + 1} completata">✓</button>
        </div>`;
      }).join('')}</div>
      <div class="k-ex-foot"><button type="button" class="k-set-add">+ Serie</button>${ex.sets.length > 1 ? '<button type="button" class="k-set-rm">− Serie</button>' : ''}</div>
    </div>`;
  }

  /* ---------- Azioni ---------- */
  function newExercise(name) {
    const last = lastFor(name);
    const n = last ? Math.min(6, last.sets.length) : 3;
    return { name, sets: Array.from({ length: n }, () => ({ kg: '', reps: '', done: false })) };
  }
  function start(tpl) {
    db.active = { name: tpl || 'Allenamento libero', startedAt: Date.now(), exercises: (TEMPLATES[tpl] || []).map(newExercise) };
    persist(); render(); buzz(10);
    if (!tpl) openPicker();
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function finish() {
    const a = db.active; if (!a) return;
    const exercises = a.exercises.map(ex => ({ name: ex.name, sets: ex.sets.filter(s => s.done && num(s.reps) > 0).map(s => ({ kg: num(s.kg), reps: num(s.reps) })) })).filter(ex => ex.sets.length);
    if (!exercises.length) { status('Completa almeno una serie (✓) prima di salvare.'); return; }
    const minutes = Math.max(1, Math.round((Date.now() - a.startedAt) / 60000));
    const sets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
    const vol = exercises.reduce((v, ex) => v + ex.sets.reduce((b, s) => b + s.kg * s.reps, 0), 0);
    const prs = a.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.pr).length, 0);
    const date = new Date().toISOString();
    db.history.push({ id: Date.now().toString(36), date, name: a.name, minutes, sets, volume: Math.round(vol), exercises });
    db.active = null; persist(); stopRest();
    // Registra anche nel registro allenamenti dell'app (anelli, grafici, costanza, mappa).
    try {
      if (typeof state !== 'undefined' && typeof save === 'function') {
        state.workouts.push({ name: a.name, minutes, completedAt: date, kind: 'sets', sets, volume: Math.round(vol) });
        save();
      }
    } catch (e) { console.warn('FIT KORE gym:', e); }
    render();
    if (window.fkToast) window.fkToast(`💪 ${esc(a.name)} salvato · <b>${sets} serie · ${fmt(vol)} kg</b>${prs ? ' · 🏆 ' + prs : ''}`);
    buzz([20, 40, 20]);
  }
  function status(msg) {
    let p = card.querySelector('.k-gym-status');
    if (!p) { p = document.createElement('p'); p.className = 'k-gym-status'; p.setAttribute('role', 'status'); card.append(p); }
    p.textContent = msg;
  }

  card.addEventListener('click', e => {
    const t = e.target;
    const tpl = t.closest('[data-tpl]'); if (tpl) return start(tpl.dataset.tpl);
    if (t.closest('.k-gym-add')) return openPicker();
    if (t.closest('.k-gym-finish')) return finish();
    const cancel = t.closest('.k-gym-cancel');
    if (cancel) {
      if (!cancel.classList.contains('confirm')) { cancel.classList.add('confirm'); cancel.textContent = 'Sicuro? Tocca di nuovo'; setTimeout(() => { if (cancel.isConnected) { cancel.classList.remove('confirm'); cancel.textContent = 'Annulla'; } }, 3500); return; }
      db.active = null; persist(); stopRest(); render(); return;
    }
    const exEl = t.closest('.k-ex'); if (!exEl || !db.active) return;
    const ex = db.active.exercises[+exEl.dataset.i];
    if (t.closest('.k-ex-del')) { db.active.exercises.splice(+exEl.dataset.i, 1); persist(); render(); return; }
    if (t.closest('.k-set-add')) { const l = ex.sets[ex.sets.length - 1] || {}; ex.sets.push({ kg: l.kg ?? '', reps: l.reps ?? '', done: false }); persist(); render(); return; }
    if (t.closest('.k-set-rm')) { ex.sets.pop(); persist(); render(); return; }
    const ok = t.closest('.k-set-ok');
    if (ok) {
      const row = ok.closest('.k-set'), s = ex.sets[+row.dataset.j];
      // Se i campi sono vuoti usa i valori suggeriti (ultima volta).
      const kgIn = row.querySelector('[data-f="kg"]'), rIn = row.querySelector('[data-f="reps"]');
      if (s.kg === '' && kgIn.placeholder && kgIn.placeholder !== '0') s.kg = num(kgIn.placeholder);
      if (s.reps === '' && rIn.placeholder) s.reps = num(rIn.placeholder);
      s.done = !s.done;
      if (s.done) {
        const best = bestFor(ex.name);
        const otherBest = ex.sets.filter((x, j) => x.done && j !== +row.dataset.j && x.pr).length;
        s.pr = num(s.reps) > 0 && num(s.kg) > 0 && (!best || e1rm(s) > e1rm(best)) && !otherBest && !!best;
        if (s.pr) { if (window.fkConfetti) window.fkConfetti(); if (window.fkToast) window.fkToast(`🏆 Nuovo record: <b>${esc(ex.name)} ${fmt(num(s.kg))} kg × ${num(s.reps)}</b>`); buzz([30, 50, 30]); }
        else buzz(12);
        startRest();
      } else s.pr = false;
      persist(); render();
    }
  });
  card.addEventListener('input', e => {
    if (!db.active) return;
    if (e.target.classList.contains('k-gym-name')) { db.active.name = e.target.value.slice(0, 40) || 'Allenamento'; persist(); return; }
    const f = e.target.dataset.f; if (!f) return;
    const exEl = e.target.closest('.k-ex'), row = e.target.closest('.k-set');
    const s = db.active.exercises[+exEl.dataset.i].sets[+row.dataset.j];
    s[f] = e.target.value === '' ? '' : num(e.target.value);
    persist();
  });
  // Invio sul campo ripetizioni = serie fatta.
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.dataset.f) { e.preventDefault(); e.target.closest('.k-set')?.querySelector('.k-set-ok')?.click(); }
  });

  /* ---------- Timer di recupero ---------- */
  const rest = document.createElement('div');
  rest.className = 'k-rest'; rest.hidden = true; rest.setAttribute('role', 'timer'); rest.setAttribute('aria-live', 'off');
  rest.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" class="k-rest-bg"/><circle cx="22" cy="22" r="19" class="k-rest-ring" stroke-dasharray="119.4" stroke-dashoffset="0"/></svg>' +
    '<div class="k-rest-text"><span>Recupero</span><b>1:30</b></div><button type="button" data-d="-15">−15</button><button type="button" data-d="15">+15</button><button type="button" class="k-rest-skip">Salta</button>';
  document.body.append(rest);
  let restEnd = 0, restTotal = 0, restTimer = null;
  function startRest() {
    restTotal = db.rest || REST_DEFAULT; restEnd = Date.now() + restTotal * 1000;
    rest.hidden = false; requestAnimationFrame(() => rest.classList.add('show'));
    clearInterval(restTimer); restTimer = setInterval(restTick, 250); restTick();
  }
  function stopRest() { clearInterval(restTimer); rest.classList.remove('show'); setTimeout(() => { rest.hidden = true; }, 300); }
  function restTick() {
    const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));
    rest.querySelector('b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    rest.querySelector('.k-rest-ring').style.strokeDashoffset = String(119.4 * (1 - left / Math.max(1, restTotal)));
    if (left <= 0) { stopRest(); buzz([60, 80, 60]); if (window.fkToast) window.fkToast('⏱️ Recupero finito: <b>prossima serie!</b>'); }
  }
  rest.addEventListener('click', e => {
    const d = e.target.closest('[data-d]');
    if (d) { restEnd += num(d.dataset.d) * 1000; restTotal = Math.max(15, restTotal + num(d.dataset.d)); db.rest = Math.max(15, Math.min(600, (db.rest || REST_DEFAULT) + num(d.dataset.d))); persist(); restTick(); }
    if (e.target.closest('.k-rest-skip')) stopRest();
  });

  /* ---------- Scelta esercizi ---------- */
  const picker = document.createElement('div');
  picker.className = 'k-sheet'; picker.hidden = true; picker.setAttribute('role', 'dialog'); picker.setAttribute('aria-modal', 'true'); picker.setAttribute('aria-label', 'Aggiungi esercizio');
  picker.innerHTML = `<div class="k-sheet-panel k-picker">
    <div class="k-sheet-head"><h2>Aggiungi esercizio</h2><button type="button" class="k-sheet-close" aria-label="Chiudi">✕</button></div>
    <input type="search" class="k-picker-search" placeholder="Cerca o scrivi un esercizio nuovo" aria-label="Cerca esercizio">
    <div class="k-picker-muscles">${['Tutti', ...Object.keys(LIB)].map((m, i) => `<button type="button" data-m="${m}" aria-pressed="${i === 0}">${m}</button>`).join('')}</div>
    <div class="k-picker-list"></div></div>`;
  document.body.append(picker);
  let muscle = 'Tutti';
  function paintPicker() {
    const q = picker.querySelector('.k-picker-search').value.trim().toLocaleLowerCase('it');
    const used = new Set((db.active ? db.active.exercises : []).map(x => x.name));
    const custom = [...new Set(db.history.flatMap(s => s.exercises.map(x => x.name)).filter(n => !MUSCLE[n]))];
    const all = Object.keys(MUSCLE).concat(custom);
    const list = all.filter(n => (muscle === 'Tutti' || MUSCLE[n] === muscle) && (!q || n.toLocaleLowerCase('it').includes(q)));
    const exact = all.some(n => n.toLocaleLowerCase('it') === q);
    picker.querySelector('.k-picker-list').innerHTML =
      (q && !exact ? `<button type="button" class="k-pick k-pick-new" data-name="${esc(q.charAt(0).toUpperCase() + q.slice(1))}"><b>+ Aggiungi “${esc(q)}”</b><span>esercizio personalizzato</span></button>` : '') +
      list.map(n => { const l = lastFor(n); return `<button type="button" class="k-pick" data-name="${esc(n)}"${used.has(n) ? ' disabled' : ''}><b>${esc(n)}</b><span>${esc(MUSCLE[n] || 'Personalizzato')}${l ? ' · ultima: ' + esc(summary(l.sets)) : ''}${used.has(n) ? ' · già aggiunto' : ''}</span></button>`; }).join('');
  }
  function openPicker() {
    picker.querySelector('.k-picker-search').value = ''; paintPicker();
    picker.hidden = false; document.body.classList.add('k-sheet-open'); requestAnimationFrame(() => picker.classList.add('is-open'));
  }
  function closePicker() { picker.classList.remove('is-open'); document.body.classList.remove('k-sheet-open'); setTimeout(() => { picker.hidden = true; }, 280); }
  picker.addEventListener('input', paintPicker);
  picker.addEventListener('click', e => {
    if (e.target === picker || e.target.closest('.k-sheet-close')) return closePicker();
    const m = e.target.closest('[data-m]');
    if (m) { muscle = m.dataset.m; picker.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', b === m)); paintPicker(); return; }
    const p = e.target.closest('.k-pick');
    if (p && db.active) { db.active.exercises.push(newExercise(p.dataset.name)); persist(); closePicker(); render(); buzz(8); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !picker.hidden) closePicker(); });

  // "Inizia allenamento" in Home porta alla palestra.
  window.fkGymStart = start;
  window.fkGymTemplates = Object.keys(TEMPLATES);
  window.fkGymActive = () => !!db.active;
  window.fkGymHistory = () => load().history;
  render();
})();
