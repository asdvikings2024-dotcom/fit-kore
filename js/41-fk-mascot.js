// FIT KORE — la squadra delle mascotte: Kory (Home e Diario), Pepe (Cibo), Ghisa (Allena).
// Stanno in un angolo, respirano, e ogni tanto dicono una frase utile presa dai tuoi dati.
(function () {
  'use strict';
  const html = document.documentElement, KEY = 'fk-look', SEEN = 'fk-mascot-seen';
  const ART = {"kory": "<svg viewBox=\"0 0 240 270\" aria-hidden=\"true\"><defs><linearGradient id=\"ky-b\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbff5c\"/><stop offset=\".55\" stop-color=\"#e4ff00\"/><stop offset=\"1\" stop-color=\"#b9ec00\"/></linearGradient><clipPath id=\"ky-c\"><path d=\"M160 8 L52 136 L108 136 L80 222 L198 92 L140 92 L186 8 Z\"/></clipPath></defs><g stroke=\"#0b0e06\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"120\" cy=\"256\" rx=\"70\" ry=\"9\" fill=\"#000\" opacity=\".45\" stroke=\"none\"/><path d=\"M86 206 L84 236 M104 194 L148 234\" stroke-width=\"20\"/><path d=\"M86 206 L84 236 M104 194 L148 234\" stroke=\"#c4ee00\" stroke-width=\"11\"/><path d=\"M66 232 h30 a12 12 0 0 1 12 12 v4 h-48 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M132 230 h30 a12 12 0 0 1 12 12 v4 h-48 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M60 246 h46 M128 244 h46\" stroke=\"#dfff00\" stroke-width=\"4\"/><path d=\"M72 116 L48 92 L44 66\" fill=\"none\" stroke-width=\"20\"/><path d=\"M72 116 L48 92 L44 66\" fill=\"none\" stroke=\"#c4ee00\" stroke-width=\"11\"/><path d=\"M176 110 L200 116 L216 96\" fill=\"none\" stroke-width=\"20\"/><path d=\"M176 110 L200 116 L216 96\" fill=\"none\" stroke=\"#c4ee00\" stroke-width=\"11\"/><rect x=\"30\" y=\"44\" width=\"30\" height=\"28\" rx=\"9\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M36 52 h18\" stroke=\"#dfff00\" stroke-width=\"3\"/><rect x=\"204\" y=\"74\" width=\"30\" height=\"28\" rx=\"9\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M210 82 h18\" stroke=\"#dfff00\" stroke-width=\"3\"/><path d=\"M160 8 L52 136 L108 136 L80 222 L198 92 L140 92 L186 8 Z\" fill=\"url(#ky-b)\" stroke-width=\"6\"/></g><g clip-path=\"url(#ky-c)\"><path d=\"M180 0 L240 0 L240 270 L96 270 L150 100 Z\" fill=\"#7fae00\" opacity=\".38\"/><path d=\"M156 20 L70 124\" stroke=\"#fff\" stroke-opacity=\".6\" stroke-width=\"6\" stroke-linecap=\"round\"/></g><path d=\"M112 64 L162 56\" stroke=\"#0b0e06\" stroke-width=\"13\" stroke-linecap=\"round\"/><path d=\"M112 64 L162 56\" stroke=\"#14180c\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M116 63 L158 57\" stroke=\"#dfff00\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><g class=\"face\"><path d=\"M88 122 Q100 110 114 119 Q102 131 88 122 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M126 119 Q139 109 152 117 Q139 129 126 119 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><circle cx=\"104\" cy=\"120\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"141\" cy=\"118\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"106\" cy=\"118\" r=\"1.8\" fill=\"#fff\"/><circle cx=\"143\" cy=\"116\" r=\"1.8\" fill=\"#fff\"/><path d=\"M85 109 L113 114 M156 104 L128 112\" stroke=\"#0b0e06\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M112 146 Q128 150 142 136\" fill=\"none\" stroke=\"#0b0e06\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g></svg>", "ghisa": "<svg viewBox=\"0 0 240 270\" aria-hidden=\"true\"><defs><radialGradient id=\"gh-b\" cx=\".33\" cy=\".3\" r=\".85\"><stop offset=\"0\" stop-color=\"#7c8672\"/><stop offset=\".5\" stop-color=\"#3a4234\"/><stop offset=\"1\" stop-color=\"#1a1e16\"/></radialGradient><linearGradient id=\"gh-h\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#5d6654\"/><stop offset=\".5\" stop-color=\"#8a9480\"/><stop offset=\"1\" stop-color=\"#3a4234\"/></linearGradient><clipPath id=\"gh-c\"><circle cx=\"120\" cy=\"150\" r=\"78\"/></clipPath></defs><ellipse cx=\"120\" cy=\"256\" rx=\"80\" ry=\"9\" fill=\"#000\" opacity=\".45\"/><g stroke=\"#0b0e06\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M78 92 Q78 22 120 22 Q162 22 162 92\" fill=\"none\" stroke-width=\"32\"/><path d=\"M78 92 Q78 22 120 22 Q162 22 162 92\" fill=\"none\" stroke=\"url(#gh-h)\" stroke-width=\"22\"/><path d=\"M54 158 L24 140 L28 96\" fill=\"none\" stroke-width=\"24\"/><path d=\"M54 158 L24 140 L28 96\" fill=\"none\" stroke=\"#4a5342\" stroke-width=\"15\"/><path d=\"M186 158 L216 140 L212 96\" fill=\"none\" stroke-width=\"24\"/><path d=\"M186 158 L216 140 L212 96\" fill=\"none\" stroke=\"#4a5342\" stroke-width=\"15\"/><rect x=\"12\" y=\"72\" width=\"32\" height=\"30\" rx=\"9\" fill=\"#14180c\" stroke-width=\"5\"/><rect x=\"196\" y=\"72\" width=\"32\" height=\"30\" rx=\"9\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M18 80 h20 M202 80 h20\" stroke=\"#dfff00\" stroke-width=\"3\"/><path d=\"M70 222 h36 a12 12 0 0 1 12 12 v6 h-54 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M134 222 h36 a12 12 0 0 1 12 12 v6 h-54 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M64 238 h52 M128 238 h52\" stroke=\"#dfff00\" stroke-width=\"4\"/><circle cx=\"120\" cy=\"150\" r=\"78\" fill=\"url(#gh-b)\" stroke-width=\"6\"/></g><g clip-path=\"url(#gh-c)\"><circle cx=\"168\" cy=\"196\" r=\"92\" fill=\"#000\" opacity=\".28\"/><ellipse cx=\"84\" cy=\"108\" rx=\"26\" ry=\"13\" fill=\"#fff\" opacity=\".16\" transform=\"rotate(-28 84 108)\"/><path d=\"M30 112 Q120 92 210 112 L210 130 Q120 110 30 130 Z\" fill=\"#14180c\"/><path d=\"M30 121 Q120 101 210 121\" stroke=\"#dfff00\" stroke-width=\"3\" fill=\"none\"/><path d=\"M60 196 l14 -6 M164 200 l12 4\" stroke=\"#fff\" stroke-opacity=\".12\" stroke-width=\"3\" stroke-linecap=\"round\"/></g><g class=\"face\"><path d=\"M84 148 Q97 137 112 146 Q98 157 84 148 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M128 146 Q143 137 156 148 Q142 157 128 146 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><circle cx=\"100\" cy=\"147\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"140\" cy=\"147\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"102\" cy=\"145\" r=\"1.8\" fill=\"#fff\"/><circle cx=\"142\" cy=\"145\" r=\"1.8\" fill=\"#fff\"/><path d=\"M80 134 L112 141 M160 134 L128 141\" stroke=\"#dfff00\" stroke-width=\"6.5\" stroke-linecap=\"round\"/><path d=\"M106 172 Q120 168 134 172\" fill=\"none\" stroke=\"#dfff00\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g><rect x=\"98\" y=\"186\" width=\"44\" height=\"32\" rx=\"8\" fill=\"#dfff00\" stroke=\"#0b0e06\" stroke-width=\"4\"/><path d=\"M112 193 v18 M112 203 l12 -10 M116 200 l10 11\" stroke=\"#0b0e06\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>", "pepe": "<svg viewBox=\"0 0 240 270\" aria-hidden=\"true\"><defs><linearGradient id=\"pp-b\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#a6f7ff\"/><stop offset=\".45\" stop-color=\"#3ee8ff\"/><stop offset=\"1\" stop-color=\"#1679c4\"/></linearGradient><clipPath id=\"pp-c\"><path d=\"M120 12 C150 64 186 108 186 160 a66 66 0 0 1 -132 0 C54 108 90 64 120 12 Z\"/></clipPath></defs><ellipse cx=\"120\" cy=\"256\" rx=\"66\" ry=\"9\" fill=\"#000\" opacity=\".45\"/><g stroke=\"#0b0e06\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M98 214 L94 236 M142 214 L146 236\" stroke-width=\"18\"/><path d=\"M98 214 L94 236 M142 214 L146 236\" stroke=\"#22b4dc\" stroke-width=\"9\"/><path d=\"M70 230 h30 a12 12 0 0 1 12 12 v4 h-48 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M128 230 h30 a12 12 0 0 1 12 12 v4 h-48 a4 4 0 0 1 -4 -4 z\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M64 244 h46 M124 244 h46\" stroke=\"#3ee8ff\" stroke-width=\"4\"/><path d=\"M60 172 L34 178 L30 152\" fill=\"none\" stroke-width=\"20\"/><path d=\"M60 172 L34 178 L30 152\" fill=\"none\" stroke=\"#22b4dc\" stroke-width=\"11\"/><rect x=\"14\" y=\"96\" width=\"34\" height=\"62\" rx=\"9\" fill=\"#dfff00\" stroke-width=\"5\"/><rect x=\"20\" y=\"84\" width=\"22\" height=\"14\" rx=\"3\" fill=\"#14180c\" stroke-width=\"4\"/><path d=\"M14 118 h34\" stroke-width=\"4\"/><rect x=\"18\" y=\"140\" width=\"28\" height=\"22\" rx=\"8\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M180 166 L206 150 L208 120\" fill=\"none\" stroke-width=\"20\"/><path d=\"M180 166 L206 150 L208 120\" fill=\"none\" stroke=\"#22b4dc\" stroke-width=\"11\"/><rect x=\"194\" y=\"98\" width=\"28\" height=\"28\" rx=\"8\" fill=\"#14180c\" stroke-width=\"5\"/><path d=\"M200 106 h16\" stroke=\"#3ee8ff\" stroke-width=\"3\"/><path d=\"M120 12 C150 64 186 108 186 160 a66 66 0 0 1 -132 0 C54 108 90 64 120 12 Z\" fill=\"url(#pp-b)\" stroke-width=\"6\"/></g><g clip-path=\"url(#pp-c)\"><path d=\"M150 40 C200 120 200 220 120 240 L240 240 L240 0 Z\" fill=\"#0b3d6b\" opacity=\".32\"/><path d=\"M104 52 C88 84 76 112 74 146\" stroke=\"#fff\" stroke-opacity=\".75\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M40 112 Q120 96 200 112 L200 130 Q120 114 40 130 Z\" fill=\"#14180c\"/><path d=\"M40 121 Q120 105 200 121\" stroke=\"#dfff00\" stroke-width=\"3\" fill=\"none\"/></g><g class=\"face\"><path d=\"M86 160 Q98 149 112 157 Q100 169 86 160 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M128 157 Q142 149 154 160 Q140 169 128 157 Z\" fill=\"#fff\" stroke=\"#0b0e06\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><circle cx=\"101\" cy=\"159\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"139\" cy=\"159\" r=\"5.5\" fill=\"#0b0e06\"/><circle cx=\"103\" cy=\"157\" r=\"1.8\" fill=\"#fff\"/><circle cx=\"141\" cy=\"157\" r=\"1.8\" fill=\"#fff\"/><path d=\"M84 146 L111 150 M156 146 L129 150\" stroke=\"#0b0e06\" stroke-width=\"5.5\" stroke-linecap=\"round\"/><path d=\"M106 184 Q120 192 134 182\" fill=\"none\" stroke=\"#0b0e06\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g></svg>"};
  const WHO = { dashboard: 'kory', alimentazione: 'pepe', allenamenti: 'ghisa', diario: 'kory' };
  const NAME = { kory: 'Kory', pepe: 'Pepe', ghisa: 'Ghisa' };
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const enabled = () => read().mascot !== false;
  const it = n => Math.round(n).toLocaleString('it-IT');
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function lines(who) {
    let d = null; try { d = window.fkDayData && window.fkDayData(); } catch (e) {}
    const h = new Date().getHours(), out = [];
    const plan = typeof window.fkPlanToday === 'function' ? window.fkPlanToday() : '';
    if (h >= 23 || h < 5) out.push({ t: 'È tardi. Il recupero è allenamento: vai a dormire.', mood: 'sleepy' });
    if (d) {
      const left = d.goal - d.kcal, wl = d.waterGoal - d.water;
      if (who === 'pepe') {
        if (d.kcal > d.goal * 1.1) out.push({ t: `${it(d.kcal - d.goal)} kcal oltre. Domani si riparte, oggi leggero.`, mood: 'worried' });
        else if (d.kcal === 0 && h >= 10) out.push({ t: 'Niente registrato oggi. Partiamo dalla colazione?' });
        else if (left > 0 && left < 350) out.push({ t: `Altri ${it(left)} kcal. Chiudi la giornata pulito.` });
        else if (left > 0) out.push({ t: `Ti restano ${it(left)} kcal. Proteine in ogni pasto.` });
        if (wl > 0 && h >= 12) out.push({ t: `${wl >= 1000 ? (wl / 1000).toFixed(1).replace('.', ',') + ' litri' : it(wl) + ' ml'} d’acqua indietro. Bevi.`, mood: wl > 1000 ? 'worried' : '' });
        if (wl <= 0) out.push({ t: 'Acqua al completo. Ottimo lavoro.', mood: 'happy' });
      } else if (who === 'ghisa') {
        if (d.train >= d.trainGoal) out.push({ t: `${it(d.train)} minuti fatti. Lavoro serio.`, mood: 'happy' });
        else if (plan) out.push({ t: `Da piano oggi: ${plan}. Niente scuse.` });
        else out.push({ t: d.train ? `${it(d.trainGoal - d.train)} minuti al traguardo. Chiudiamolo.` : 'Oggi zero minuti. Anche 20 contano.' });
        out.push({ t: pick(['Tecnica prima del carico.', 'Riscaldati bene: 5 minuti cambiano tutto.', 'Una serie in più della volta scorsa.', 'Recupero tra le serie: 60–90 secondi.']) });
      } else {
        const done = (d.kcal >= d.goal * 0.85 && d.kcal <= d.goal * 1.1 ? 1 : 0) + (d.train >= d.trainGoal ? 1 : 0) + (d.water >= d.waterGoal ? 1 : 0);
        if (done === 3) out.push({ t: 'Tre obiettivi su tre. Giornata da campione.', mood: 'happy' });
        else if (done) out.push({ t: `${done} obiettivi su 3. Manca poco.` });
        else out.push({ t: h < 12 ? 'Nuova giornata. Si parte forte.' : 'Ancora tutto da fare. Un passo alla volta.' });
        if (plan && d.train < d.trainGoal) out.push({ t: `Oggi tocca a ${plan}.` });
        if (who === 'kory' && html.dataset.sec === 'diario') out.push({ t: 'Scrivi come ti senti: aiuta più di quanto pensi.' });
      }
    }
    if (!out.length) out.push({ t: 'Sono qui. Toccami quando vuoi un consiglio.' });
    return out;
  }

  const box = document.createElement('div');
  box.className = 'k-mascot'; box.setAttribute('aria-live', 'polite');
  box.innerHTML = '<div class="k-mascot-bubble" hidden><span></span><button type="button" aria-label="Chiudi">×</button></div><button type="button" class="k-mascot-char" aria-label="Mascotte: tocca per un consiglio"></button>';
  document.body.append(box); box.classList.add('k-tuck');
  const bubble = box.querySelector('.k-mascot-bubble'), txt = bubble.querySelector('span'), ch = box.querySelector('.k-mascot-char');
  let who = '', idx = 0, hideT = null, sayT = null;
  const tuck = on => box.classList.toggle('k-tuck', on);

  function setWho() {
    const w = WHO[html.dataset.sec] || 'kory';
    if (w === who) return false;
    who = w; idx = 0; clearTimeout(sayT); clearTimeout(hideT); bubble.hidden = true; box.dataset.mood = '';
    ch.innerHTML = ART[w]; box.dataset.who = w;
    ch.setAttribute('aria-label', `${NAME[w]}: tocca per un consiglio`);
    box.classList.remove('k-in'); void box.offsetWidth; box.classList.add('k-in');
    return true;
  }
  function say(line, ms) {
    if (!line) return;
    txt.textContent = line.t; bubble.hidden = false; tuck(false);
    box.dataset.mood = line.mood || '';
    box.classList.remove('k-talk'); void box.offsetWidth; box.classList.add('k-talk');
    clearTimeout(hideT); hideT = setTimeout(() => { bubble.hidden = true; box.dataset.mood = ''; tuck(true); }, ms || 7000);
  }
  function next() { const l = lines(who); say(l[idx % l.length]); idx++; }
  function onSection() {
    if (!enabled()) return;
    setWho();
    // una frase all'apertura di ogni sezione, al massimo ogni 20 minuti
    let seen = {}; try { seen = JSON.parse(sessionStorage.getItem(SEEN) || '{}'); } catch (e) {}
    const k = html.dataset.sec || 'dashboard', now = Date.now();
    if (!seen[k] || now - seen[k] > 20 * 60 * 1000) {
      seen[k] = now; try { sessionStorage.setItem(SEEN, JSON.stringify(seen)); } catch (e) {}
      sayT = setTimeout(next, 1200);
    } else { bubble.hidden = true; tuck(true); }
  }
  function apply() {
    const on = enabled();
    box.hidden = !on; html.classList.toggle('k-has-mascot', on);
    if (on) onSection();
  }
  ch.addEventListener('click', () => { if (bubble.hidden) next(); else next(); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} });
  bubble.querySelector('button').addEventListener('click', () => { bubble.hidden = true; clearTimeout(hideT); tuck(true); });
  new MutationObserver(apply).observe(html, { attributes: true, attributeFilter: ['data-sec'] });

  // festeggia insieme ai coriandoli
  const conf = window.fkConfetti;
  if (typeof conf === 'function') window.fkConfetti = function () {
    if (enabled()) { box.classList.remove('k-cheer'); void box.offsetWidth; box.classList.add('k-cheer'); say({ t: pick(['Obiettivo centrato. Avanti così.', 'Così si fa.', 'Lavoro serio. Bravo.']), mood: 'happy' }, 5000); }
    return conf.apply(this, arguments);
  };

  // Opzione in Aspetto
  function addOption() {
    const card = document.getElementById('k-look');
    if (!card || card.querySelector('[data-mascot]')) return;
    const on = enabled(), w = document.createElement('div');
    w.innerHTML = `<p class="k-look-label">Mascotte</p><div class="k-look-seg" role="radiogroup" aria-label="Mascotte" style="grid-template-columns:repeat(2,1fr)">
      <button type="button" role="radio" data-mascot="1" aria-checked="${on}"><b>Sì</b><small>Kory, Pepe e Ghisa</small></button>
      <button type="button" role="radio" data-mascot="0" aria-checked="${!on}"><b>No</b><small>nascoste</small></button></div>`;
    const credit = card.querySelector('.k-look-credit');
    credit ? credit.before(...w.childNodes) : card.append(...w.childNodes);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mascot]'); if (!b) return;
    const l = read(); l.mascot = b.dataset.mascot === '1';
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (err) {}
    b.parentElement.querySelectorAll('[data-mascot]').forEach(x => x.setAttribute('aria-checked', x === b));
    if (l.mascot) { try { sessionStorage.removeItem(SEEN); } catch (err) {} }
    apply();
  });
  new MutationObserver(addOption).observe(document.getElementById('diario') || document.body, { childList: true, subtree: true });
  addOption();
  setTimeout(apply, 600);
})();
