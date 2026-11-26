// FIT KORE — sfondi con foto di palestra (Unsplash, licenza gratuita), uno per sezione.
(function () {
  'use strict';
  const html = document.documentElement;
  const KEY = 'fk-look';
  const PHOTOS = {
    dashboard: { id: 'photo-1728486145245-d4cb0c9c3470', by: 'Rick Barrett · Ambitious Studio', page: 'https://unsplash.com/photos/w7jYaN7GqyA' },
    alimentazione: { id: 'photo-1775993167276-743bbcde77e1', by: 'Palak Pitroda', page: 'https://unsplash.com/photos/EC4mdytpvmk' },
    allenamenti: { id: 'photo-1775993167571-cd1ff4cadada', by: 'Palak Pitroda', page: 'https://unsplash.com/photos/M60S0E3XuM8' },
    diario: { id: 'photo-1637430308606-86576d8fef3c', by: 'Mohamed Fareed', page: 'https://unsplash.com/photos/rbSNsoXk-3A' }
  };
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const enabled = () => read().photos !== false;
  const w = Math.min(1600, Math.round((window.innerWidth || 430) * Math.min(2, window.devicePixelRatio || 1) * 1.1));

  const bg = document.createElement('div');
  bg.className = 'k-photo-bg'; bg.setAttribute('aria-hidden', 'true');
  Object.keys(PHOTOS).forEach(s => { const i = document.createElement('i'); i.dataset.s = s; bg.append(i); });
  document.body.prepend(bg);

  function show() {
    const on = enabled();
    html.classList.toggle('k-has-photo', on);
    bg.hidden = !on;
    if (!on) return;
    const sec = html.dataset.sec || 'dashboard';
    bg.querySelectorAll('i').forEach(i => {
      const active = i.dataset.s === sec;
      if (active && !i.style.backgroundImage) i.style.backgroundImage = `url(https://images.unsplash.com/${PHOTOS[i.dataset.s].id}?w=${w}&q=70&auto=format&fit=crop)`;
      i.classList.toggle('on', active);
    });
    // precarica le altre dopo qualche secondo
    setTimeout(() => bg.querySelectorAll('i').forEach(i => { if (!i.style.backgroundImage) i.style.backgroundImage = `url(https://images.unsplash.com/${PHOTOS[i.dataset.s].id}?w=${w}&q=70&auto=format&fit=crop)`; }), 4000);
  }
  new MutationObserver(show).observe(html, { attributes: true, attributeFilter: ['data-sec'] });

  // Opzione e crediti nella card Aspetto
  function addOption() {
    const card = document.getElementById('k-look');
    if (!card || card.querySelector('[data-photos]')) return;
    const on = enabled();
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="k-look-label">Foto di palestra sullo sfondo</p>
      <div class="k-look-seg" role="radiogroup" aria-label="Foto di sfondo" style="grid-template-columns:repeat(2,1fr)">
        <button type="button" role="radio" data-photos="1" aria-checked="${on}"><b>Sì</b><small>una per sezione</small></button>
        <button type="button" role="radio" data-photos="0" aria-checked="${!on}"><b>No</b><small>solo aurora</small></button></div>
      <p class="k-look-credit">Foto da <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>: ${Object.values(PHOTOS).filter((p, i, a) => a.findIndex(q => q.by === p.by) === i).map(p => `<a href="${p.page}" target="_blank" rel="noopener">${p.by}</a>`).join(', ')}.</p>`;
    card.append(...wrap.childNodes);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-photos]'); if (!b) return;
    const l = read(); l.photos = b.dataset.photos === '1';
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (err) {}
    b.parentElement.querySelectorAll('[data-photos]').forEach(x => x.setAttribute('aria-checked', x === b));
    show();
  });
  new MutationObserver(addOption).observe(document.getElementById('diario') || document.body, { childList: true, subtree: true });
  addOption(); show();
})();
