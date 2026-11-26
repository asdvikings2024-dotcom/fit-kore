// FIT KORE — pasti composti, report del mese e foto dei progressi.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => Number(v) || 0;
  const it = n => Math.round(n).toLocaleString('it-IT');
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const today = () => new Date().toLocaleDateString('sv-SE');
  const toast = m => window.fkToast && window.fkToast(m);
  const TYPES = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];

  /* =================== 1. Pasti composti =================== */
  const COMBOS = 'fk-combos-v1';
  const diary = $('fk-rescue-diary'), meals = $('fk-rescue-meals');
  if (diary && meals) {
    const box = document.createElement('div');
    box.className = 'k-combos';
    const hero = diary.querySelector('.k-cal');
    (hero || meals).insertAdjacentElement(hero ? 'afterend' : 'beforebegin', box);

    const todayEntries = () => { const d = read('fk-nutrition-v1', {}) || {}; return d.date === today() && Array.isArray(d.entries) ? d.entries : []; };
    function renderCombos() {
      const list = read(COMBOS, []) || [];
      box.innerHTML = list.length
        ? `<div class="k-combos-head"><b>Le tue combo</b><small>tocca per aggiungerle a oggi</small></div>
           <div class="k-combos-row">${list.map((c, i) => `<button type="button" class="k-combo" data-i="${i}"><b>${esc(c.name)}</b><small>${c.items.length} alimenti · ${it(c.items.reduce((a, x) => a + num(x.kcal), 0))} kcal</small><i data-del="${i}" aria-label="Elimina combo ${esc(c.name)}" role="button">✕</i></button>`).join('')}</div>`
        : '<p class="k-combos-empty">💡 Salva un pasto che mangi spesso come <b>combo</b> (pulsante ★ su ogni pasto) e rimettilo con un tocco.</p>';
    }
    function addSaveButtons() {
      meals.querySelectorAll('.fk-rescue-meal').forEach(m => {
        const type = m.dataset.meal, head = m.querySelector('.k-meal-head'); if (!head) return;
        let b = head.querySelector('.k-combo-save');
        const has = todayEntries().some(x => x.mealType === type);
        if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'k-combo-save'; b.textContent = '★'; b.setAttribute('aria-label', 'Salva ' + type + ' come combo'); b.title = 'Salva come combo'; head.querySelector('em')?.after(b); }
        b.hidden = !has;
      });
    }
    meals.addEventListener('click', e => {
      const b = e.target.closest('.k-combo-save'); if (!b) return;
      e.stopPropagation();
      const type = b.closest('.fk-rescue-meal').dataset.meal;
      const items = todayEntries().filter(x => x.mealType === type).map(x => ({ name: x.name, kcal: num(x.kcal), p: num(x.p), c: num(x.c), f: num(x.f), mealType: type }));
      if (!items.length) return;
      const list = read(COMBOS, []) || [];
      const name = (type === 'Spuntino' ? 'Spuntino' : type) + ' ' + (list.filter(c => c.type === type).length + 1);
      list.unshift({ name, type, items }); write(COMBOS, list.slice(0, 12));
      renderCombos(); toast(`★ Combo salvata: <b>${esc(name)}</b>`);
    });
    box.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      const list = read(COMBOS, []) || [];
      if (del) {
        e.stopPropagation();
        if (!del.classList.contains('confirm')) { del.classList.add('confirm'); del.textContent = 'Elimina?'; setTimeout(() => { if (del.isConnected) { del.classList.remove('confirm'); del.textContent = '✕'; } }, 3000); return; }
        list.splice(+del.dataset.del, 1); write(COMBOS, list); renderCombos(); return;
      }
      const c = e.target.closest('.k-combo'); if (!c) return;
      const combo = list[+c.dataset.i]; if (!combo) return;
      const d = read('fk-nutrition-v1', {}) || {};
      if (d.date !== today()) { d.date = today(); d.entries = []; }
      if (!Array.isArray(d.entries)) d.entries = [];
      combo.items.forEach(x => d.entries.push({ ...x, mealType: TYPES.includes(combo.type) ? combo.type : 'Spuntino' }));
      if (!write('fk-nutrition-v1', d)) return;
      if (typeof window.fkRescueDraw === 'function') window.fkRescueDraw();
      toast(`🍽️ <b>${esc(combo.name)}</b> aggiunta a ${esc(combo.type)}`);
      try { navigator.vibrate && navigator.vibrate(10); } catch (err) {}
    });
    new MutationObserver(() => requestAnimationFrame(addSaveButtons)).observe(meals, { childList: true });
    window.addEventListener('storage', renderCombos);
    renderCombos(); setTimeout(addSaveButtons, 300);
  }

  /* =================== 2. Report del mese =================== */
  const training = $('allenamenti');
  function place(el, before) {
    el.dataset.kTab = 'progressi'; el.setAttribute('role', 'tabpanel');
    before && before.parentElement === training ? training.insertBefore(el, before) : training.append(el);
    const t = $('k-tab-progressi'); el.hidden = !!t && t.getAttribute('aria-selected') !== 'true';
  }
  function report() {
    const end = new Date(); end.setHours(23, 59, 59, 999); const start = new Date(); start.setDate(end.getDate() - 29); start.setHours(0, 0, 0, 0);
    const inRange = d => { const x = new Date(d); return x >= start && x <= end; };
    const wo = (typeof state !== 'undefined' && Array.isArray(state.workouts) ? state.workouts : []).filter(w => w.completedAt && inRange(w.completedAt));
    const minutes = wo.reduce((a, w) => a + num(w.minutes), 0), days = new Set(wo.map(w => new Date(w.completedAt).toLocaleDateString('sv-SE')));
    const gym = (window.fkGymHistory ? window.fkGymHistory() : []).filter(s => inRange(s.date));
    const vol = gym.reduce((a, s) => a + num(s.volume), 0);
    const best = {};
    gym.forEach(s => s.exercises.forEach(ex => ex.sets.forEach(x => { const e = num(x.kg) * (1 + num(x.reps) / 30); if (!best[ex.name] || e > best[ex.name].e) best[ex.name] = { e, kg: num(x.kg), reps: num(x.reps) }; })));
    const prs = Object.entries(best).sort((a, b) => b[1].e - a[1].e).slice(0, 6);
    const hist = read('fk-nutrition-history-v1', {}) || {}; const t = read('fk-nutrition-v1', {}) || {};
    if (t.date && Array.isArray(t.entries)) hist[t.date] = t.entries;
    const nd = Object.entries(hist).filter(([k, v]) => inRange(k + 'T12:00:00') && Array.isArray(v) && v.length);
    const avg = f => nd.length ? nd.reduce((a, [, v]) => a + v.reduce((b, x) => b + num(x[f]), 0), 0) / nd.length : 0;
    const wl = ((read('fk-weight-log-v1', {}) || {}).entries || []).filter(e => inRange(e.d + 'T12:00:00')).sort((a, b) => a.d < b.d ? -1 : 1);
    const wDelta = wl.length > 1 ? wl[wl.length - 1].kg - wl[0].kg : null;
    const p = read('fk-profile-v1', {}) || {};
    const who = p.name || (window.fkUser && window.fkUser.name) || 'Atleta FIT KORE';
    const period = `${start.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const tile = (v, l, c) => `<div class="t" style="--c:${c}"><b>${v}</b><span>${l}</span></div>`;
    const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Report FIT KORE – ${esc(who)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@700&family=Inter:wght@400;600;700&display=swap">
<style>*{box-sizing:border-box}body{margin:0;font:14px/1.5 Inter,Arial,sans-serif;color:#13170f;background:#f6f4ee}
.page{max-width:780px;margin:0 auto;padding:36px 34px;background:#fff;min-height:100vh}
.hd{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:4px solid #d7f500}
.k{width:54px;height:54px;border-radius:14px;background:#0b0e0c;color:#dfff00;font:400 34px/54px Anton;text-align:center}
h1{font:400 34px/1 Anton;margin:0;text-transform:uppercase}.sub{color:#5d6658;margin-top:4px}
h2{font:400 20px/1 Anton;text-transform:uppercase;margin:28px 0 12px;display:flex;gap:8px;align-items:center}h2:before{content:"";width:5px;height:18px;border-radius:3px;background:#b5d600}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.t{padding:14px;border-radius:14px;background:color-mix(in srgb,var(--c) 14%,#fff);border:1px solid color-mix(in srgb,var(--c) 40%,#fff)}
.t b{display:block;font:italic 700 28px/1 Oswald}.t span{font-size:11.5px;color:#5d6658;font-weight:600}
table{width:100%;border-collapse:collapse}td,th{padding:9px 8px;border-bottom:1px solid #e6e8e1;text-align:left}th{font-size:11px;text-transform:uppercase;color:#5d6658;letter-spacing:.06em}td.r{text-align:right;font:italic 700 16px Oswald}
.note{margin-top:30px;font-size:11.5px;color:#7a8274}.btn{position:fixed;right:18px;bottom:18px;padding:12px 18px;border:0;border-radius:12px;background:#d7f500;font:700 14px Inter;cursor:pointer;box-shadow:0 10px 24px -10px rgba(120,160,0,.8)}
@media print{.btn{display:none}body{background:#fff}.page{padding:0}}</style></head><body><div class="page">
<div class="hd"><div class="k">K</div><div><h1>Report del mese</h1><div class="sub">${esc(who)} · ${period}</div></div></div>
<h2>Allenamento</h2><div class="grid">${tile(wo.length, 'sessioni', '#3ee8ff')}${tile(it(minutes), 'minuti totali', '#d7f500')}${tile(days.size, 'giorni attivi su 30', '#c77dff')}${tile(it(vol), 'kg sollevati in palestra', '#ff8a4c')}</div>
${prs.length ? `<h2>Record personali</h2><table><tr><th>Esercizio</th><th style="text-align:right">Miglior serie</th><th style="text-align:right">Massimale stimato</th></tr>${prs.map(([n, b]) => `<tr><td>${esc(n)}</td><td class="r">${fmt1(b.kg)} kg × ${b.reps}</td><td class="r">${fmt1(b.e)} kg</td></tr>`).join('')}</table>` : ''}
<h2>Alimentazione</h2><div class="grid">${tile(nd.length ? it(avg('kcal')) : '—', 'kcal medie al giorno', '#ff8a4c')}${tile(nd.length ? it(avg('p')) + ' g' : '—', 'proteine medie', '#d7f500')}${tile(nd.length ? it(avg('c')) + ' g' : '—', 'carboidrati medi', '#3ee8ff')}${tile(nd.length ? it(avg('f')) + ' g' : '—', 'grassi medi', '#ffd166')}</div>
<p class="sub">${nd.length} giorni con pasti registrati${num(t.goal) ? ' · obiettivo ' + it(t.goal) + ' kcal' : ''}.</p>
<h2>Peso</h2><div class="grid">${tile(wl.length ? fmt1(wl[wl.length - 1].kg) + ' kg' : '—', 'peso attuale', '#c77dff')}${tile(wDelta === null ? '—' : (wDelta > 0 ? '+' : wDelta < 0 ? '−' : '') + fmt1(Math.abs(wDelta)) + ' kg', 'variazione nel mese', '#3ee8ff')}${tile(wl.length, 'pesate registrate', '#d7f500')}${tile(p.targets ? it(p.targets.kcal) : '—', 'obiettivo kcal profilo', '#ff8a4c')}</div>
<p class="note">Generato da FIT KORE il ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}. Calorie e massimali sono stime indicative e non sostituiscono il parere di un professionista.</p>
</div><button class="btn" onclick="window.print()">Salva come PDF</button></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast('Il browser ha bloccato la nuova finestra: consenti i popup e riprova.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  if (training) {
    const rc = document.createElement('article');
    rc.className = 'k-report'; rc.id = 'k-report';
    rc.innerHTML = '<div><span class="k-report-eyebrow">Ultimi 30 giorni</span><h3>Report del mese</h3><p>Allenamenti, record, calorie e peso in una pagina: salvala in PDF o condividila con il tuo coach.</p></div><button type="button" class="k-report-go">Crea report PDF →</button>';
    place(rc, training.querySelector(':scope > [data-k-tab="progressi"]'));
    rc.querySelector('.k-report-go').addEventListener('click', report);
  }

  /* =================== 3. Foto dei progressi =================== */
  if (training && 'indexedDB' in window) {
    const DBN = 'fk-photos', ST = 'photos';
    const open = () => new Promise((res, rej) => { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(ST, mode); const out = fn(t.objectStore(ST)); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
    const all = () => tx('readonly', s => s.getAll());
    const card = document.createElement('article');
    card.className = 'k-photos'; card.id = 'k-photos';
    place(card, $('k-weight'));
    let urls = [], a = 0, b = 0;
    async function render() {
      urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
      let list = []; try { list = (await all()).sort((x, y) => x.date < y.date ? -1 : 1); } catch (e) {}
      const pics = list.map(p => { const u = URL.createObjectURL(p.blob); urls.push(u); return { ...p, url: u }; });
      if (pics.length >= 2) { if (!pics[a] || !pics[b] || a === b) { a = 0; b = pics.length - 1; } }
      const day = d => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });
      card.innerHTML = `<h3>Foto dei progressi</h3>
        <p class="k-photos-sub">🔒 Restano solo su questo dispositivo: non vanno nel cloud e nessuno le vede.</p>
        ${pics.length >= 2 ? `<div class="k-ba" style="--pos:50%"><img src="${pics[b].url}" alt="Dopo, ${day(pics[b].date)}"><div class="k-ba-before"><img src="${pics[a].url}" alt="Prima, ${day(pics[a].date)}"></div>
          <i class="k-ba-line" aria-hidden="true"></i><span class="k-ba-l">PRIMA · ${day(pics[a].date)}</span><span class="k-ba-r">DOPO · ${day(pics[b].date)}</span>
          <input type="range" min="0" max="100" value="50" aria-label="Confronto prima e dopo"></div>` : pics.length === 1 ? `<div class="k-ba"><img src="${pics[0].url}" alt="Foto del ${day(pics[0].date)}"></div><p class="k-photos-sub">Aggiungi un’altra foto più avanti per vedere il confronto prima/dopo.</p>` : ''}
        ${pics.length ? `<div class="k-thumbs">${pics.map((p, i) => `<button type="button" data-i="${i}" class="${i === a ? 'is-a' : ''}${i === b ? ' is-b' : ''}"><img src="${p.url}" alt=""><small>${day(p.date)}</small><i data-del="${p.id}" role="button" aria-label="Elimina foto">✕</i></button>`).join('')}</div>
          ${pics.length >= 2 ? '<p class="k-photos-sub">Tocca una miniatura per sceglierla come “prima”, tocca di nuovo per “dopo”.</p>' : ''}` : ''}
        <label class="k-photo-add"><input type="file" accept="image/*" capture="user" hidden><span>📸 Aggiungi foto di oggi</span></label>`;
    }
    async function addFile(file) {
      if (!file || !/^image\//.test(file.type)) return;
      try {
        const img = await createImageBitmap(file);
        const s = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
        await tx('readwrite', st => st.put({ id: Date.now().toString(36), date: new Date().toISOString(), blob }));
        const n = (await all()).length; a = 0; b = n - 1;
        toast('📸 Foto salvata sul dispositivo'); render();
      } catch (e) { console.warn('FIT KORE foto:', e); toast('Non riesco a salvare la foto.'); }
    }
    card.addEventListener('change', e => { if (e.target.type === 'file') { addFile(e.target.files[0]); e.target.value = ''; } });
    card.addEventListener('input', e => { if (e.target.type === 'range') e.target.closest('.k-ba').style.setProperty('--pos', e.target.value + '%'); });
    card.addEventListener('click', async e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        if (!del.classList.contains('confirm')) { del.classList.add('confirm'); del.textContent = '?'; setTimeout(() => { if (del.isConnected) { del.classList.remove('confirm'); del.textContent = '✕'; } }, 3000); return; }
        await tx('readwrite', st => st.delete(del.dataset.del)); a = 0; b = 0; render(); return;
      }
      const t = e.target.closest('.k-thumbs button'); if (!t) return;
      const i = +t.dataset.i;
      if (i === a || i === b) return;
      if (i < b) a = i; else b = i;
      render();
    });
    render();
  }
})();
