// FIT KORE — app installabile: service worker, invito all'installazione, scorciatoie.
(function () {
  'use strict';
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOSSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios|gsa\//i.test(ua);
  const DISMISS = 'fk-install-dismissed';

  // Service worker (offline). Sui file locali non serve.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(e => console.warn('FIT KORE SW:', e)));
  }

  // Scorciatoie dell'icona: ?go=alimentazione / ?go=allenamenti
  const go = new URLSearchParams(location.search).get('go');
  if (go) setTimeout(() => document.querySelector('[data-page="' + CSS.escape(go) + '"]')?.click(), 300);
  if (standalone) document.documentElement.classList.add('k-standalone');

  if (standalone) return;
  let dismissedAt = 0;
  try { dismissedAt = Number(localStorage.getItem(DISMISS)) || 0; } catch (e) {}
  if (Date.now() - dismissedAt < 14 * 864e5) return; // "Non ora" vale due settimane

  let deferred = null;
  const card = document.createElement('article');
  card.className = 'k-install'; card.hidden = true;
  card.innerHTML =
    '<img src="./icons/icon-192.png" alt="" width="56" height="56">' +
    '<div class="k-install-text"><strong>Installa FIT KORE</strong><span></span></div>' +
    '<div class="k-install-actions"><button type="button" class="k-install-go">Installa</button><button type="button" class="k-install-later">Non ora</button></div>';
  const text = card.querySelector('span'), goBtn = card.querySelector('.k-install-go');
  const dash = document.getElementById('dashboard');
  const anchor = dash && (dash.querySelector('#hx-start') || dash.firstElementChild);
  if (anchor) anchor.after(card); else return;

  function show(mode) {
    if (mode === 'ios') {
      text.innerHTML = 'Tocca <b>Condividi</b> <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> e poi <b>Aggiungi alla schermata Home</b>: si apre a tutto schermo, come un’app.';
      goBtn.hidden = true;
    } else {
      text.textContent = 'Aggiungila alla schermata Home: si apre a tutto schermo e funziona anche senza connessione.';
      goBtn.hidden = false;
    }
    card.hidden = false;
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; show('prompt'); });
  window.addEventListener('appinstalled', () => { card.remove(); });
  if (isIOSSafari) show('ios');

  goBtn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    deferred = null;
    if (choice && choice.outcome === 'accepted') card.remove();
  });
  card.querySelector('.k-install-later').addEventListener('click', () => {
    try { localStorage.setItem(DISMISS, String(Date.now())); } catch (e) {}
    card.remove();
  });
})();
