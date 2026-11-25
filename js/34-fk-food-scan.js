// FIT KORE — codice a barre e ricerca prodotti (Open Food Facts, database libero).
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const nameInput = $('fk-rescue-name');
  if (!nameInput) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const OFF = 'https://world.openfoodfacts.org';
  const FIELDS = 'code,product_name,product_name_it,generic_name_it,brands,nutriments,serving_quantity,serving_size,quantity';
  const ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.0/+esm';

  /* ---------- Pulsanti accanto al campo ---------- */
  const tools = document.createElement('div');
  tools.className = 'k-scan-tools';
  tools.innerHTML = '<button type="button" class="k-scan-btn" data-act="scan"><span aria-hidden="true">▦</span> Scansiona codice</button><button type="button" class="k-scan-btn" data-act="search"><span aria-hidden="true">⌕</span> Cerca prodotto</button>';
  const label = document.querySelector('label[for="fk-rescue-name"]');
  (label || nameInput).insertAdjacentElement(label ? 'afterend' : 'beforebegin', tools);

  /* ---------- Foglio ---------- */
  const sheet = document.createElement('div');
  sheet.className = 'k-sheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'k-scan-title');
  sheet.innerHTML = `<div class="k-sheet-panel k-scan">
    <div class="k-sheet-head"><h2 id="k-scan-title">Prodotto</h2><button type="button" class="k-sheet-close" aria-label="Chiudi">✕</button></div>
    <div class="k-scan-cam" hidden><video playsinline muted></video><i class="k-scan-laser"></i><p class="k-scan-tip">Inquadra il codice a barre</p></div>
    <form class="k-scan-form" novalidate>
      <input class="k-scan-q" type="search" autocomplete="off" placeholder="Nome prodotto o codice a barre" aria-label="Nome prodotto o codice a barre">
      <button type="submit">Cerca</button>
    </form>
    <p class="k-scan-status" role="status" aria-live="polite"></p>
    <div class="k-scan-results"></div>
    <p class="k-scan-credit">Dati da <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a>, database libero e collaborativo: controlla sempre l’etichetta.</p>
  </div>`;
  document.body.append(sheet);
  const cam = sheet.querySelector('.k-scan-cam'), video = cam.querySelector('video'), q = sheet.querySelector('.k-scan-q'),
    status = sheet.querySelector('.k-scan-status'), results = sheet.querySelector('.k-scan-results');

  let stopScan = null, stream = null, found = [];
  function open(mode) {
    results.innerHTML = ''; status.textContent = ''; q.value = '';
    sheet.hidden = false; document.body.classList.add('k-sheet-open'); requestAnimationFrame(() => sheet.classList.add('is-open'));
    if (mode === 'scan') startCamera(); else { cam.hidden = true; setTimeout(() => q.focus(), 120); }
  }
  function close() {
    stopCamera();
    sheet.classList.remove('is-open'); document.body.classList.remove('k-sheet-open');
    setTimeout(() => { sheet.hidden = true; }, 280);
  }

  /* ---------- Fotocamera ---------- */
  async function startCamera() {
    cam.hidden = false;
    status.textContent = 'Avvio fotocamera…';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { cam.hidden = true; status.textContent = 'Fotocamera non disponibile: scrivi il codice qui sotto.'; return; }
    try {
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        video.srcObject = stream; await video.play();
        status.textContent = 'Inquadra il codice a barre del prodotto.';
        let alive = true;
        stopScan = () => { alive = false; };
        const loop = async () => {
          if (!alive) return;
          try { const codes = await detector.detect(video); if (codes && codes[0]) return onCode(codes[0].rawValue); } catch (e) {}
          setTimeout(loop, 220);
        };
        loop();
      } else {
        // Safari e altri browser senza BarcodeDetector: libreria ZXing caricata solo quando serve.
        const { BrowserMultiFormatReader } = await import(ZXING);
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result) => {
          if (result) onCode(result.getText ? result.getText() : result.text);
        });
        stopScan = () => controls.stop();
        status.textContent = 'Inquadra il codice a barre del prodotto.';
      }
    } catch (e) {
      console.warn('FIT KORE scan:', e);
      cam.hidden = true;
      status.textContent = e && e.name === 'NotAllowedError'
        ? 'Permesso fotocamera negato: abilitalo nelle impostazioni del browser, oppure scrivi il codice qui sotto.'
        : 'Non riesco ad avviare la fotocamera: scrivi il codice a barre o il nome del prodotto.';
    }
  }
  function stopCamera() {
    try { stopScan && stopScan(); } catch (e) {}
    stopScan = null;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (video.srcObject) { try { video.srcObject.getTracks().forEach(t => t.stop()); } catch (e) {} video.srcObject = null; }
  }
  function onCode(code) {
    stopCamera(); cam.hidden = true;
    try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
    q.value = code; lookup(code);
  }

  /* ---------- Open Food Facts ---------- */
  function toItem(p) {
    const n = p.nutriments || {};
    let kcal = num(n['energy-kcal_100g']);
    if (!kcal && n['energy_100g']) kcal = Math.round(num(n['energy_100g']) / 4.184);
    const name = (p.product_name_it || p.product_name || p.generic_name_it || '').trim();
    if (!name || !kcal) return null;
    const brand = (p.brands || '').split(',')[0].trim();
    const serving = num(p.serving_quantity);
    const full = brand && !name.toLocaleLowerCase('it').includes(brand.toLocaleLowerCase('it')) ? `${name} · ${brand}` : name;
    return {
      name: full.slice(0, 80), kcal: Math.round(kcal), unit: serving ? 'porzione' : 'porzione da 100 g', grams: serving && serving < 2000 ? Math.round(serving) : 100,
      macro: [num(n.proteins_100g), num(n.carbohydrates_100g), num(n.fat_100g)].map(v => Math.round(v * 10) / 10),
      product: true, code: p.code, terms: [[]]
    };
  }
  async function lookup(text) {
    const t = text.trim();
    if (!t) return;
    results.innerHTML = ''; found = [];
    status.textContent = 'Ricerca…';
    try {
      let products = [];
      if (/^\d{8,14}$/.test(t)) {
        const r = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(t)}.json?fields=${FIELDS}`);
        const j = await r.json();
        if (j && j.product) products = [j.product];
      } else {
        const r = await fetch(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(t)}&search_simple=1&action=process&json=1&page_size=15&lc=it&cc=it&fields=${FIELDS}`);
        const j = await r.json();
        products = (j && j.products) || [];
      }
      found = products.map(toItem).filter(Boolean);
      if (!found.length) { status.textContent = /^\d+$/.test(t) ? 'Prodotto non trovato nel database. Prova a cercarlo per nome.' : 'Nessun prodotto con calorie trovato. Prova con un altro nome.'; return; }
      status.textContent = found.length === 1 ? 'Trovato:' : `${found.length} prodotti trovati:`;
      results.innerHTML = found.map((it, i) => `<button type="button" class="k-scan-item" data-i="${i}"><b>${esc(it.name)}</b>
        <span>${it.kcal} kcal/100 g · P ${it.macro[0]} · C ${it.macro[1]} · G ${it.macro[2]}${it.unit === 'porzione' ? ' · porzione ' + it.grams + ' g' : ''}</span></button>`).join('');
      if (found.length === 1 && /^\d+$/.test(t)) results.querySelector('.k-scan-item').focus();
    } catch (e) {
      console.warn('FIT KORE OFF:', e);
      status.textContent = navigator.onLine ? 'Il database non risponde: riprova tra poco.' : 'Sei offline: la ricerca prodotti richiede la connessione.';
    }
  }
  function pick(it) {
    close();
    if (typeof nameInput.fkSetItem === 'function') nameInput.fkSetItem(it);
    else { nameInput.value = it.name; const k = $('fk-rescue-kcal'); if (k) k.value = Math.round(it.kcal * it.grams / 100); }
    setTimeout(() => $('fk-rescue-kcal')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }

  tools.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) open(b.dataset.act); });
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('.k-sheet-close')) return close();
    const it = e.target.closest('.k-scan-item'); if (it) pick(found[+it.dataset.i]);
  });
  sheet.querySelector('form').addEventListener('submit', e => { e.preventDefault(); stopCamera(); cam.hidden = true; lookup(q.value); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });
})();
