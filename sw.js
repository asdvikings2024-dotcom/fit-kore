// FIT KORE — service worker: l'app si apre anche senza connessione.
const VERSION = 'fk-20261125h';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/icon-512.png', './privacy.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isFirebaseSdk = url => url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
const isFont = url => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pagina: prima la rete (aggiornamenti subito), se offline la copia salvata.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // File dell'app con versione, SDK Firebase con versione e font: dalla cache, poi rete.
  const sameOrigin = url.origin === self.location.origin;
  if ((sameOrigin && url.searchParams.has('v')) || isFirebaseSdk(url) || isFont(url)) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // Altri file dell'app: rete, e in caso di errore la cache.
  if (sameOrigin) {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req)));
  }
  // Tutto il resto (Firestore, login Google) passa direttamente alla rete.
});
