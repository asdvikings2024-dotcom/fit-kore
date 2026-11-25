// FIT KORE — LED dinamici: strisce luminose sulle card principali e bagliori legati ai progressi.
(function () {
  'use strict';
  // Card che ricevono il bordo LED rotante (con velocità diverse).
  const TARGETS = [['#k-coach', ''], ['.k-cal', 'slow'], ['#k-gym', ''], ['#k-streak', 'slow'], ['.k-install', 'fast'], ['#fk-admin-panel.has-pending', 'fast']];
  function strip(el, speed) {
    if (!el || el.querySelector(':scope > .k-led-strip')) return;
    const s = document.createElement('span');
    s.className = 'k-led-strip' + (speed ? ' ' + speed : ''); s.setAttribute('aria-hidden', 'true');
    // offset casuale: i LED non girano tutti in sincronia
    s.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    el.append(s);
  }
  function apply() {
    TARGETS.forEach(([sel, speed]) => document.querySelectorAll(sel).forEach(el => {
      const target = el.classList.contains('k-cal') ? el.closest('article') : el;
      strip(target, speed);
    }));
    document.querySelectorAll('.k-ex').forEach(ex => { if (ex.querySelector('.k-set.is-done')) strip(ex, 'fast'); });
    // Bagliore proporzionale al progresso
    document.querySelectorAll('.k-ring').forEach(r => {
      const C = parseFloat(r.getAttribute('stroke-dasharray')), off = parseFloat(r.style.strokeDashoffset || C);
      const g = String(C ? Math.max(0, Math.min(1, 1 - off / C)).toFixed(2) : 0);
      if (r.style.getPropertyValue('--glow') !== g) r.style.setProperty('--glow', g);
    });
    const cal = document.querySelector('.k-cal-fill');
    if (cal) {
      const L = parseFloat(cal.style.strokeDasharray), off = parseFloat(cal.style.strokeDashoffset || L);
      const g = String(L ? Math.max(0, Math.min(1, 1 - off / L)).toFixed(2) : 0);
      if (cal.style.getPropertyValue('--glow') !== g) cal.style.setProperty('--glow', g);
    }
  }
  let q = false;
  const schedule = () => { if (q) return; q = true; setTimeout(() => { q = false; apply(); }, 120); };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  apply();
})();
