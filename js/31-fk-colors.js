// FIT KORE — colore d'accento per sezione (il giallo fluo resta il colore principale).
(function () {
  'use strict';
  const html = document.documentElement;
  const set = () => {
    const active = document.querySelector('.section.active');
    if (active && html.dataset.sec !== active.id) html.dataset.sec = active.id;
  };
  document.querySelectorAll('.section').forEach(s => new MutationObserver(set).observe(s, { attributes: true, attributeFilter: ['class'] }));
  set();
  // Colore per muscolo nei chip della palestra.
  const MUSCLE = { Petto: '#ff6b6b', Schiena: '#4d9bff', Spalle: '#b06cff', Gambe: '#9dff4a', Glutei: '#ff5fd2', Bicipiti: '#3ee8ff', Tricipiti: '#ff9f43', Addome: '#ffd84d', Cardio: '#2ee6a6' };
  const paint = root => root.querySelectorAll('.k-ex-muscle:not([data-c]), .k-picker-muscles [data-m]:not([data-c]), .k-pick span:not([data-c])').forEach(el => {
    const name = el.dataset.m || el.textContent.split('·')[0].trim();
    if (MUSCLE[name]) { el.style.setProperty('--mc', MUSCLE[name]); el.dataset.c = '1'; }
  });
  new MutationObserver(() => paint(document)).observe(document.body, { childList: true, subtree: true });
  paint(document);
})();
