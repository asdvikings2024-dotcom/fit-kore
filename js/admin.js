// FIT KORE — area amministratore: gestione degli iscritti.
// Caricato da firebase-auth.js solo per gli account presenti in /admins.

const STATUS = {
  pending: ['In attesa', 'k-st-pending'],
  approved: ['Approvato', 'k-st-approved'],
  suspended: ['Sospeso', 'k-st-suspended'],
  rejected: ['Rifiutato', 'k-st-rejected']
};
const ACTIONS = {
  pending: [['approved', 'Approva', 'primary'], ['rejected', 'Rifiuta', '']],
  approved: [['suspended', 'Sospendi', '']],
  suspended: [['approved', 'Riattiva', 'primary']],
  rejected: [['approved', 'Approva', 'primary']]
};
const CONFIRM = { approved: 'Confermi l’approvazione?', rejected: 'Confermi il rifiuto?', suspended: 'Confermi la sospensione?' };

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const when = ts => {
  const d = ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
  return d ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

export function mountAdmin({ db, F, me, messages }) {
  const dash = document.getElementById('dashboard');
  if (!dash) return;
  document.getElementById('fk-admin-panel')?.remove();
  document.getElementById('k-admin-sheet')?.remove();

  // Card compatta in Home
  const card = document.createElement('article');
  card.id = 'fk-admin-panel'; card.className = 'k-admin-card';
  card.innerHTML = '<div><span class="k-admin-eyebrow">Area amministratore</span><strong class="k-admin-count">Caricamento…</strong></div><button type="button" class="k-admin-open">Gestisci iscritti →</button>';
  const coach = document.getElementById('k-coach');
  (coach ? coach.nextElementSibling : dash.firstElementChild)?.before(card);

  // Foglio di gestione
  const sheet = document.createElement('div');
  sheet.id = 'k-admin-sheet'; sheet.className = 'k-sheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'k-admin-title');
  sheet.innerHTML = `
    <div class="k-sheet-panel k-admin-panel">
      <div class="k-sheet-head"><h2 id="k-admin-title">Iscritti</h2><button type="button" class="k-sheet-close" aria-label="Chiudi">✕</button></div>
      <div class="k-admin-filters" role="tablist" aria-label="Filtra per stato">
        ${[['pending', 'In attesa'], ['approved', 'Approvati'], ['suspended', 'Sospesi'], ['rejected', 'Rifiutati'], ['all', 'Tutti']]
          .map(([k, l]) => `<button type="button" role="tab" data-f="${k}" aria-selected="${k === 'pending'}">${l}<b></b></button>`).join('')}
      </div>
      <input type="search" class="k-admin-search" placeholder="Cerca per email" aria-label="Cerca per email">
      <div class="k-admin-list" aria-live="polite"></div>
      <p class="k-admin-status" role="status"></p>
      <button type="button" class="k-admin-reload">Aggiorna elenco</button>
    </div>`;
  document.body.append(sheet);

  const list = sheet.querySelector('.k-admin-list'), status = sheet.querySelector('.k-admin-status'), search = sheet.querySelector('.k-admin-search');
  let members = [], filter = 'pending';

  async function load() {
    list.innerHTML = '<p class="k-admin-empty">Caricamento…</p>';
    try {
      const snap = await F.getDocs(F.collection(db, 'members'));
      members = [];
      snap.forEach(d => members.push({ id: d.id, ref: d.ref, ...d.data() }));
      members.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      status.textContent = '';
    } catch (e) {
      console.error('FIT KORE admin:', e);
      list.innerHTML = '<p class="k-admin-empty">Impossibile caricare gli iscritti.</p>';
      status.textContent = messages[e?.code] || '';
      return;
    }
    paint();
  }
  function paint() {
    const counts = { all: members.length };
    for (const m of members) counts[m.status] = (counts[m.status] || 0) + 1;
    sheet.querySelectorAll('[data-f]').forEach(b => { b.querySelector('b').textContent = counts[b.dataset.f] || 0; b.setAttribute('aria-selected', b.dataset.f === filter); });
    const pending = counts.pending || 0;
    card.querySelector('.k-admin-count').textContent = pending
      ? `${pending} ${pending === 1 ? 'richiesta' : 'richieste'} in attesa`
      : `${counts.all || 0} ${counts.all === 1 ? 'iscritto' : 'iscritti'} · nessuna richiesta in attesa`;
    card.classList.toggle('has-pending', pending > 0);
    const q = search.value.trim().toLocaleLowerCase('it');
    const rows = members.filter(m => (filter === 'all' || m.status === filter) && (!q || String(m.email || '').toLocaleLowerCase('it').includes(q)));
    if (!rows.length) { list.innerHTML = '<p class="k-admin-empty">Nessun iscritto in questo elenco.</p>'; return; }
    list.innerHTML = rows.map(m => {
      const [label, cls] = STATUS[m.status] || [m.status, ''];
      const acts = (ACTIONS[m.status] || []).filter(([next]) => !(m.id === me && next !== 'approved'));
      return `<div class="k-admin-row" data-id="${esc(m.id)}">
        <div class="k-admin-who"><strong>${esc(m.email || m.id)}${m.id === me ? ' <em>(tu)</em>' : ''}</strong>
          <span>Iscritto il ${when(m.createdAt)}${m.reviewedAt ? ' · aggiornato il ' + when(m.reviewedAt) : ''}</span></div>
        <span class="k-chip ${cls}">${label}</span>
        <div class="k-admin-acts">${acts.map(([next, t, kind]) => `<button type="button" class="${kind}" data-next="${next}">${t}</button>`).join('')}</div>
      </div>`;
    }).join('');
  }
  async function act(btn) {
    const row = btn.closest('.k-admin-row'), m = members.find(x => x.id === row.dataset.id), next = btn.dataset.next;
    if (!m) return;
    // Conferma in due tocchi, senza finestre del browser.
    if (!btn.classList.contains('confirm')) {
      row.querySelectorAll('button.confirm').forEach(b => { b.classList.remove('confirm'); b.textContent = b.dataset.label; });
      btn.dataset.label = btn.textContent; btn.textContent = CONFIRM[next] || 'Confermi?'; btn.classList.add('confirm');
      setTimeout(() => { if (btn.isConnected && btn.classList.contains('confirm')) { btn.classList.remove('confirm'); btn.textContent = btn.dataset.label; } }, 4000);
      return;
    }
    row.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
      await F.updateDoc(m.ref, { status: next, reviewedAt: F.serverTimestamp() });
      m.status = next; m.reviewedAt = { toDate: () => new Date() };
      status.textContent = `✓ ${m.email || 'Iscritto'}: ${STATUS[next][0].toLowerCase()}.`;
      paint();
    } catch (e) {
      console.error('FIT KORE admin:', e);
      status.textContent = messages[e?.code] || 'Aggiornamento non riuscito.';
      row.querySelectorAll('button').forEach(b => { b.disabled = false; });
    }
  }

  const open = () => { sheet.hidden = false; document.body.classList.add('k-sheet-open'); requestAnimationFrame(() => sheet.classList.add('is-open')); load(); };
  const close = () => { sheet.classList.remove('is-open'); document.body.classList.remove('k-sheet-open'); setTimeout(() => { sheet.hidden = true; }, 280); };
  card.querySelector('.k-admin-open').addEventListener('click', open);
  sheet.querySelector('.k-sheet-close').addEventListener('click', close);
  sheet.addEventListener('click', e => {
    if (e.target === sheet) return close();
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; paint(); return; }
    const b = e.target.closest('[data-next]'); if (b) act(b);
  });
  sheet.querySelector('.k-admin-reload').addEventListener('click', load);
  search.addEventListener('input', paint);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });
  load();
}
