// FIT KORE — community: classifica settimanale facoltativa e sfida della settimana.
// Si condividono solo nickname, minuti, sessioni e giorni di fila della settimana.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'fk-community-v1';
  const CHALLENGE = 150; // minuti di sfida settimanale
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const dash = $('dashboard');
  if (!dash) return;

  function isoWeek(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
    return `${y}-W${String(w).padStart(2, '0')}`;
  }
  function myStats() {
    const list = typeof state !== 'undefined' && Array.isArray(state.workouts) ? state.workouts : [];
    const now = new Date(), wk = isoWeek(now);
    let minutes = 0, sessions = 0; const days = new Set();
    for (const w of list) {
      if (!w || !w.completedAt) continue;
      const d = new Date(w.completedAt); if (isNaN(+d)) continue;
      days.add(d.toLocaleDateString('sv-SE'));
      if (isoWeek(d) === wk) { minutes += Math.max(0, Number(w.minutes) || 0); sessions++; }
    }
    let streak = 0; const x = new Date(now);
    if (!days.has(x.toLocaleDateString('sv-SE'))) x.setDate(x.getDate() - 1);
    while (days.has(x.toLocaleDateString('sv-SE'))) { streak++; x.setDate(x.getDate() - 1); }
    return { week: wk, minutes: Math.min(10080, Math.round(minutes)), sessions: Math.min(200, sessions), streak: Math.min(3650, streak) };
  }

  /* ---------- Card ---------- */
  const card = document.createElement('article');
  card.className = 'k-comm'; card.id = 'k-comm'; card.hidden = true;
  const graph = dash.querySelector('.kore-graph');
  graph ? graph.after(card) : dash.append(card);
  let metric = 'minutes', rows = [], busy = false;

  function render(msg) {
    const c = read(), me = myStats(), fb = window.fkFirebase;
    if (!fb) { card.hidden = true; return; }
    card.hidden = false;
    const pct = Math.min(1, me.minutes / CHALLENGE);
    const challenge = `<div class="k-chal"><div class="k-chal-top"><span>🔥 Sfida della settimana</span><b>${me.minutes}<small> / ${CHALLENGE} min</small></b></div>
      <div class="k-chal-bar"><i style="width:${pct * 100}%"></i></div>
      <small>${pct >= 1 ? 'Sfida completata! 🏆' : `Allenati ${CHALLENGE} minuti entro domenica.`}${rows.length ? ` · ${rows.filter(r => r.minutes >= CHALLENGE).length} di ${rows.length} l’hanno già completata` : ''}</small></div>`;
    if (!c.joined) {
      card.innerHTML = `<div class="k-comm-head"><div><span class="k-comm-eyebrow">Community FIT KORE</span><h3>Classifica della settimana</h3></div></div>
        ${challenge}
        <p class="k-comm-text">Entra nella classifica con un nickname e sfida gli altri iscritti. Condividi solo <b>minuti, sessioni e giorni di fila</b> della settimana: mai pasti, peso o note. Puoi uscire quando vuoi.</p>
        <form class="k-comm-join" novalidate><input maxlength="24" placeholder="Il tuo nickname" aria-label="Nickname" value="${esc(c.name || (window.fkUser && window.fkUser.name ? window.fkUser.name.split(' ')[0] : ''))}"><button type="submit">Partecipa</button></form>
        <p class="k-comm-msg" role="status">${esc(msg || '')}</p>`;
      return;
    }
    const sorted = rows.slice().sort((a, b) => (b[metric] - a[metric]) || (b.minutes - a.minutes));
    const unit = { minutes: 'min', sessions: 'sessioni', streak: 'giorni' }[metric];
    const medal = i => ['🥇', '🥈', '🥉'][i] || String(i + 1);
    card.innerHTML = `<div class="k-comm-head"><div><span class="k-comm-eyebrow">Community FIT KORE</span><h3>Classifica della settimana</h3></div>
        <button type="button" class="k-comm-refresh" aria-label="Aggiorna classifica">↻</button></div>
      ${challenge}
      <div class="k-comm-tabs" role="tablist">${[['minutes', 'Minuti'], ['sessions', 'Sessioni'], ['streak', 'Di fila']].map(([k, l]) => `<button type="button" role="tab" data-m="${k}" aria-selected="${k === metric}">${l}</button>`).join('')}</div>
      <ol class="k-comm-list">${sorted.length ? sorted.slice(0, 15).map((r, i) => `<li class="${r.id === fb.uid ? 'is-me' : ''}${i < 3 ? ' top' + (i + 1) : ''}"><span class="k-rank">${medal(i)}</span><b>${esc(r.name)}${r.id === fb.uid ? ' <em>(tu)</em>' : ''}</b><span class="k-val">${r[metric]} <small>${unit}</small></span></li>`).join('') : '<li class="k-comm-empty">Ancora nessuno questa settimana: inizia tu!</li>'}</ol>
      <p class="k-comm-msg" role="status">${esc(msg || '')}</p>
      <button type="button" class="k-comm-leave">Esci dalla classifica</button>`;
  }

  async function load() {
    const fb = window.fkFirebase; if (!fb) return;
    try {
      const snap = await fb.F.getDocs(fb.F.collection(fb.db, 'leaderboard'));
      const wk = isoWeek(); rows = [];
      snap.forEach(d => { const v = d.data(); if (v.week === wk) rows.push({ id: d.id, name: v.name, minutes: v.minutes | 0, sessions: v.sessions | 0, streak: v.streak | 0 }); });
      render();
    } catch (e) { console.warn('FIT KORE community:', e); render('Classifica non disponibile in questo momento.'); }
  }
  async function publish() {
    const fb = window.fkFirebase, c = read();
    if (!fb || !c.joined || busy) return;
    busy = true;
    try {
      const s = myStats();
      await fb.F.setDoc(fb.F.doc(fb.db, 'leaderboard', fb.uid), { name: c.name, ...s, updatedAt: fb.F.serverTimestamp() });
      await load();
    } catch (e) { console.warn('FIT KORE community:', e); render('Non riesco ad aggiornare la classifica.'); }
    finally { busy = false; }
  }

  card.addEventListener('submit', async e => {
    e.preventDefault();
    const name = card.querySelector('.k-comm-join input').value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return render('Scegli un nickname di almeno 2 caratteri.');
    write({ joined: true, name }); render('Ingresso in classifica…'); await publish();
    if (window.fkConfetti) window.fkConfetti();
  });
  card.addEventListener('click', async e => {
    const m = e.target.closest('[data-m]'); if (m) { metric = m.dataset.m; render(); return; }
    if (e.target.closest('.k-comm-refresh')) { await publish(); return; }
    const leave = e.target.closest('.k-comm-leave');
    if (leave) {
      if (!leave.classList.contains('confirm')) { leave.classList.add('confirm'); leave.textContent = 'Tocca di nuovo per uscire'; setTimeout(() => { if (leave.isConnected) { leave.classList.remove('confirm'); leave.textContent = 'Esci dalla classifica'; } }, 4000); return; }
      const fb = window.fkFirebase, c = read();
      try { await fb.F.deleteDoc(fb.F.doc(fb.db, 'leaderboard', fb.uid)); } catch (err) { console.warn(err); }
      write({ joined: false, name: c.name }); rows = rows.filter(r => r.id !== fb.uid); render('Sei uscito dalla classifica: i tuoi numeri sono stati rimossi.');
    }
  });

  // Dopo un allenamento la classifica si aggiorna da sola.
  let t = null;
  const count = $('traincount');
  if (count) new MutationObserver(() => { clearTimeout(t); t = setTimeout(publish, 2500); }).observe(count, { childList: true, characterData: true, subtree: true });
  const start = () => { read().joined ? publish() : load(); };
  window.addEventListener('fk-firebase', start);
  if (window.fkFirebase) start();
})();
