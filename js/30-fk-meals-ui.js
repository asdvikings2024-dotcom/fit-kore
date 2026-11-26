// FIT KORE — nuova grafica del diario alimentare: indicatore calorie e pasti a card.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = $('fk-rescue-diary'), meals = $('fk-rescue-meals');
  if (!root || !meals) return;
  const KEY = 'fk-nutrition-v1';
  const today = () => new Date().toLocaleDateString('sv-SE');
  const num = v => Number(v) || 0;
  const it = n => Math.round(n).toLocaleString('it-IT');
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const SPLIT = { Colazione: 0.25, Pranzo: 0.35, Cena: 0.3, Spuntino: 0.1 };
  const ICON = { Colazione: ['☀️', '#ffd166'], Pranzo: ['🍝', '#dfff00'], Cena: ['🌙', '#8fb3ff'], Spuntino: ['🍎', '#ff8f8f'] };

  /* ---------- Indicatore calorie ---------- */
  const hero = document.createElement('div');
  hero.className = 'k-cal';
  hero.innerHTML = `
    <div class="k-cal-gauge">
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <defs><linearGradient id="k-calg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9dff4a"/><stop offset="1" stop-color="#dfff00"/></linearGradient><linearGradient id="k-calg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5fd2"/><stop offset=".45" stop-color="#ff8a4c"/><stop offset="1" stop-color="#dfff00"/></linearGradient></defs>
        <path class="k-cal-track" d="M 30 140 A 80 80 0 1 1 190 140"/>
        <path class="k-cal-fill" d="M 30 140 A 80 80 0 1 1 190 140"/>
      </svg>
      <div class="k-cal-center"><small>rimanenti</small><b data-left>0</b><span>kcal</span></div>
    </div>
    <div class="k-cal-row">
      <div><small>Mangiate</small><b data-eaten>0</b></div>
      <div><small>Obiettivo</small><b data-goal>0</b></div>
      <div><small>Pasti</small><b data-count>0</b></div>
    </div>`;
  const totals = root.querySelector('.fk-rescue-totals');
  (totals || root.querySelector('p') || root.firstElementChild).after(hero);
  const fill = hero.querySelector('.k-cal-fill');
  const LEN = fill.getTotalLength ? fill.getTotalLength() : 377;
  fill.style.strokeDasharray = LEN; fill.style.strokeDashoffset = LEN;

  function entriesToday() {
    const d = read();
    return { goal: num(d.goal) || 2000, list: d.date === today() && Array.isArray(d.entries) ? d.entries : [] };
  }
  function paintHero() {
    const { goal, list } = entriesToday();
    let eaten = list.reduce((a, x) => a + num(x.kcal), 0);
    if (typeof state !== 'undefined' && Array.isArray(state.meals)) eaten += state.meals.reduce((a, m) => a + num(m.kcal), 0);
    const left = goal - eaten, pct = Math.min(1, eaten / goal);
    hero.querySelector('[data-left]').textContent = it(Math.abs(left));
    hero.querySelector('.k-cal-center small').textContent = left >= 0 ? 'rimanenti' : 'oltre l’obiettivo';
    hero.classList.toggle('is-over', left < 0);
    hero.querySelector('[data-eaten]').textContent = it(eaten);
    hero.querySelector('[data-goal]').textContent = it(goal);
    hero.querySelector('[data-count]').textContent = list.length;
    fill.style.strokeDashoffset = String(LEN * (1 - pct));
  }

  /* ---------- Pasti a card ---------- */
  function paintMeals() {
    const { goal, list } = entriesToday();
    meals.querySelectorAll('.fk-rescue-meal').forEach(box => {
      const type = box.dataset.meal;
      const items = list.filter(x => x.mealType === type);
      const sum = items.reduce((a, x) => a + num(x.kcal), 0), target = Math.round(goal * (SPLIT[type] || 0.25));
      let head = box.querySelector('.k-meal-head');
      if (!head) {
        head = document.createElement('div'); head.className = 'k-meal-head';
        const [ico, col] = ICON[type] || ['🍽️', '#dfff00'];
        head.innerHTML = `<i class="k-meal-ico" style="--c:${col}">${ico}</i><div class="k-meal-txt"><b>${type}</b><small></small></div><em></em>`;
        box.prepend(head);
        const bar = document.createElement('div'); bar.className = 'k-meal-bar'; bar.innerHTML = '<i></i>';
        head.after(bar);
        const add = box.querySelector('[data-add]');
        if (add) { box.append(add); add.classList.add('k-meal-add'); add.textContent = '+ Aggiungi'; add.setAttribute('aria-label', 'Aggiungi alimento a ' + type); }
      }
      const sub = items.length ? `${items.length} ${items.length === 1 ? 'alimento' : 'alimenti'}` : `consigliate ~${it(target)} kcal`;
      const smallEl = head.querySelector('.k-meal-txt small');
      if (smallEl.textContent !== sub) smallEl.textContent = sub;
      const emHtml = `${it(sum)}<small> / ${it(target)}</small>`, em = head.querySelector('em');
      if (em.innerHTML !== emHtml) em.innerHTML = emHtml;
      const pct = target ? sum / target : 0;
      const bar = box.querySelector('.k-meal-bar i');
      bar.style.width = Math.min(100, pct * 100) + '%';
      box.classList.toggle('is-over', pct > 1.15);
      box.classList.toggle('is-empty', !items.length);
      // Righe alimenti: nome, macro, calorie e pulsante elimina compatto.
      const lis = box.querySelectorAll('ul > li');
      lis.forEach((li, i) => {
        const x = items[i]; if (!x || li.dataset.k === '1') return;
        const del = li.querySelector('button');
        li.dataset.k = '1';
        li.textContent = '';
        const name = document.createElement('div'); name.className = 'k-food';
        const n = document.createElement('b'); n.textContent = x.name; name.append(n);
        if (num(x.p) || num(x.c) || num(x.f)) {
          const m = document.createElement('small');
          m.innerHTML = `<i class="p">P ${it(num(x.p))}</i><i class="c">C ${it(num(x.c))}</i><i class="f">G ${it(num(x.f))}</i>`;
          name.append(m);
        }
        const k = document.createElement('span'); k.className = 'k-food-kcal'; k.textContent = it(num(x.kcal)) + ' kcal';
        li.append(name, k);
        if (del) { del.textContent = '✕'; del.className = 'k-food-del'; del.setAttribute('aria-label', 'Elimina ' + x.name); li.append(del); }
      });
    });
  }

  let queued = false;
  const paint = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; paintHero(); paintMeals(); }); };
  new MutationObserver(paint).observe(meals, { childList: true, subtree: true });
  const eaten = $('fk-rescue-eaten');
  if (eaten) new MutationObserver(paint).observe(eaten, { childList: true, characterData: true, subtree: true });
  window.addEventListener('storage', paint);
  paint();
})();
