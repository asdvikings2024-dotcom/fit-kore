// FIT KORE — stima automatica delle calorie mentre scrivi il nome dell'alimento.
// Valori indicativi per 100 g (fonti: tabelle CREA / etichette medie), con una porzione tipica.
(function () {
  'use strict';

  // [nome, kcal per 100 g, unità, grammi per unità, sinonimi...]
  const DB = [
    // Colazione e dolci
    ['Biscotto frollino', 470, 'biscotto', 10, 'biscotti', 'frollini', 'macina', 'pan di stelle', 'gocciole'],
    ['Biscotto secco', 420, 'biscotto', 6, 'oro saiwa', 'biscotti secchi', 'oro'],
    ['Biscotto integrale', 440, 'biscotto', 10, 'biscotti integrali', 'digestive'],
    ['Fetta biscottata', 410, 'fetta', 8, 'fette biscottate'],
    ['Cornetto vuoto', 410, 'cornetto', 50, 'brioche', 'croissant', 'cornetto semplice'],
    ['Cornetto alla crema', 380, 'cornetto', 75, 'brioche crema', 'cornetto crema', 'cornetto cioccolato', 'cornetto marmellata'],
    ['Crostata', 400, 'fetta', 80, 'crostatina', 'torta di marmellata'],
    ['Torta', 380, 'fetta', 70, 'ciambellone', 'torta margherita', 'plumcake', 'dolce'],
    ['Muffin', 400, 'muffin', 80, 'tortina'],
    ['Merendina', 420, 'merendina', 35, 'snack dolce', 'kinder', 'flauto', 'buondi'],
    ['Krapfen', 400, 'pezzo', 70, 'bombolone', 'graffa', 'ciambella fritta', 'donut', 'ciambella'],
    ['Cannolo siciliano', 350, 'cannolo', 120, 'cannolo'],
    ['Tiramisù', 300, 'porzione', 120, 'tiramisu'],
    ['Panna cotta', 230, 'porzione', 120],
    ['Gelato', 220, 'coppetta', 100, 'cono', 'gelato cono', 'coppa gelato'],
    ['Pandoro', 410, 'fetta', 80],
    ['Panettone', 370, 'fetta', 80, 'colomba'],
    ['Pancake', 230, 'pancake', 40, 'pancakes', 'crepe', 'crepes'],
    ['Cioccolato fondente', 545, 'quadretto', 5, 'cioccolata fondente', 'fondente'],
    ['Cioccolato al latte', 545, 'quadretto', 5, 'cioccolata', 'cioccolato'],
    ['Crema spalmabile', 540, 'cucchiaino', 15, 'nutella', 'crema alle nocciole'],
    ['Marmellata', 250, 'cucchiaino', 15, 'confettura'],
    ['Miele', 304, 'cucchiaino', 10],
    ['Zucchero', 392, 'cucchiaino', 5, 'zuccherino', 'bustina di zucchero'],
    ['Caramella', 390, 'caramella', 5, 'caramelle', 'gommose', 'orsetti'],
    ['Cereali', 375, 'porzione', 30, 'corn flakes', 'cornflakes', 'cereali colazione', 'special k'],
    ['Muesli', 370, 'porzione', 40, 'granola'],
    ['Fiocchi d’avena', 380, 'porzione', 40, 'avena', 'fiocchi di avena', 'porridge'],
    ['Barretta ai cereali', 400, 'barretta', 25, 'barretta cereali'],
    ['Barretta proteica', 350, 'barretta', 60, 'protein bar'],

    // Bevande
    ['Caffè espresso', 5, 'tazzina', 30, 'caffe', 'caffè', 'espresso', 'ristretto'],
    ['Caffè zuccherato', 70, 'tazzina', 30, 'caffe con zucchero', 'caffè con zucchero'],
    ['Cappuccino', 52, 'tazza', 150, 'cappuccio'],
    ['Caffè latte', 50, 'tazza', 200, 'caffellatte', 'latte macchiato'],
    ['Latte intero', 64, 'bicchiere', 200, 'latte'],
    ['Latte parzialmente scremato', 46, 'bicchiere', 200, 'latte ps', 'latte parz'],
    ['Latte scremato', 35, 'bicchiere', 200],
    ['Latte di soia', 40, 'bicchiere', 200, 'bevanda di soia', 'latte vegetale', 'latte di avena', 'latte di mandorla'],
    ['Tè', 1, 'tazza', 200, 'te', 'the', 'tisana', 'infuso'],
    ['Tè freddo', 30, 'bicchiere', 250, 'te freddo', 'estathe', 'the freddo'],
    ['Succo di frutta', 50, 'bicchiere', 200, 'succo', 'succo di frutta'],
    ['Spremuta d’arancia', 45, 'bicchiere', 200, 'spremuta', 'succo arancia'],
    ['Coca-Cola', 42, 'lattina', 330, 'coca cola', 'cola', 'aranciata', 'fanta', 'sprite', 'bibita', 'pepsi'],
    ['Coca-Cola Zero', 0.3, 'lattina', 330, 'coca zero', 'cola zero', 'bibita zero', 'light'],
    ['Birra', 43, 'bottiglia', 330, 'birretta', 'lager', 'pinta'],
    ['Vino rosso', 85, 'bicchiere', 125, 'vino', 'rosso'],
    ['Vino bianco', 80, 'bicchiere', 125, 'bianco'],
    ['Prosecco', 75, 'calice', 125, 'spumante', 'champagne'],
    ['Spritz', 70, 'bicchiere', 200, 'aperol', 'aperol spritz', 'campari spritz'],
    ['Gin tonic', 85, 'bicchiere', 200, 'cocktail', 'vodka lemon', 'rum cola'],
    ['Acqua', 0, 'bicchiere', 200, 'acqua frizzante', 'acqua naturale'],
    ['Proteine in polvere', 380, 'misurino', 30, 'whey', 'shake proteico', 'proteine', 'frullato proteico'],

    // Primi piatti (porzioni pronte, condite)
    ['Pasta (cruda)', 355, 'porzione', 80, 'pasta secca', 'spaghetti crudi', 'penne crude'],
    ['Pasta al pomodoro', 140, 'piatto', 280, 'pasta', 'spaghetti', 'penne', 'pasta pomodoro', 'spaghetti al pomodoro', 'pasta al sugo', 'rigatoni', 'fusilli'],
    ['Pasta al pesto', 160, 'piatto', 280, 'trofie al pesto', 'pesto'],
    ['Pasta alla carbonara', 210, 'piatto', 280, 'carbonara'],
    ['Pasta al ragù', 175, 'piatto', 280, 'ragu', 'bolognese', 'tagliatelle al ragu'],
    ['Pasta all’amatriciana', 185, 'piatto', 280, 'amatriciana', 'gricia'],
    ['Pasta cacio e pepe', 200, 'piatto', 250, 'cacio e pepe'],
    ['Pasta integrale (cruda)', 340, 'porzione', 80, 'pasta integrale'],
    ['Lasagna', 160, 'porzione', 300, 'lasagne', 'pasta al forno'],
    ['Risotto', 140, 'piatto', 300, 'risotto ai funghi', 'risotto alla milanese'],
    ['Riso bianco (cotto)', 130, 'porzione', 180, 'riso', 'riso in bianco', 'riso basmati'],
    ['Riso (crudo)', 360, 'porzione', 80, 'riso crudo'],
    ['Gnocchi', 150, 'porzione', 200, 'gnocchi di patate'],
    ['Tortellini', 300, 'porzione', 125, 'ravioli', 'cappelletti', 'agnolotti'],
    ['Cous cous (crudo)', 360, 'porzione', 80, 'cous cous', 'couscous', 'bulgur', 'quinoa'],
    ['Minestrone', 45, 'piatto', 300, 'minestra', 'zuppa di verdure', 'vellutata'],
    ['Pasta e fagioli', 110, 'piatto', 300, 'pasta e ceci', 'zuppa di legumi'],

    // Pizza, pane e piatti veloci
    ['Pizza margherita', 245, 'pizza', 330, 'pizza', 'margherita', 'pizza intera'],
    ['Pizza al taglio', 270, 'trancio', 120, 'trancio di pizza', 'pizzetta', 'fetta di pizza'],
    ['Focaccia', 300, 'pezzo', 100, 'schiacciata'],
    ['Piadina farcita', 270, 'piadina', 230, 'piadina', 'piadina prosciutto', 'piada'],
    ['Panino imbottito', 260, 'panino', 180, 'panino', 'panino al prosciutto', 'sandwich'],
    ['Toast', 270, 'toast', 120, 'toast prosciutto e formaggio'],
    ['Tramezzino', 250, 'tramezzino', 100],
    ['Hamburger (panino)', 250, 'panino', 220, 'hamburger', 'burger', 'big mac', 'cheeseburger'],
    ['Kebab', 215, 'kebab', 350, 'piadina kebab', 'doner'],
    ['Crocchette di pollo', 260, 'pezzo', 16, 'nuggets', 'chicken nuggets'],
    ['Arancino', 225, 'arancino', 200, 'arancina', 'arancini'],
    ['Supplì', 230, 'supplì', 120, 'suppli'],
    ['Sushi', 150, 'pezzo', 30, 'nigiri', 'uramaki', 'hosomaki', 'roll'],
    ['Poke bowl', 140, 'bowl', 400, 'poke', 'pokè'],
    ['Pane', 265, 'fetta', 50, 'pane bianco', 'pagnotta', 'baguette'],
    ['Pane integrale', 245, 'fetta', 50],
    ['Panino (rosetta)', 270, 'panino', 60, 'rosetta', 'michetta', 'pane panino'],
    ['Pan carré', 270, 'fetta', 25, 'pancarre', 'pan bauletto', 'pane in cassetta'],
    ['Grissini', 410, 'grissino', 5, 'grissino'],
    ['Crackers', 430, 'pacchetto', 25, 'cracker', 'crackers'],
    ['Gallette di riso', 380, 'galletta', 8, 'galletta', 'gallette', 'gallette di mais'],
    ['Taralli', 450, 'porzione', 30, 'tarallini'],

    // Carne, pesce, uova
    ['Petto di pollo', 165, 'porzione', 150, 'pollo', 'pollo ai ferri', 'pollo alla piastra', 'tacchino', 'petto di tacchino'],
    ['Pollo arrosto', 190, 'porzione', 150, 'cosce di pollo', 'pollo al forno'],
    ['Cotoletta', 240, 'cotoletta', 150, 'cotoletta alla milanese', 'pollo impanato', 'cordon bleu'],
    ['Hamburger di manzo', 250, 'hamburger', 120, 'svizzera', 'burger di manzo'],
    ['Bistecca di manzo', 200, 'porzione', 150, 'bistecca', 'manzo', 'tagliata', 'filetto', 'carne rossa', 'carne'],
    ['Vitello', 110, 'porzione', 150, 'fettina', 'scaloppina'],
    ['Maiale', 220, 'porzione', 150, 'braciola', 'lonza', 'arista'],
    ['Salsiccia', 300, 'salsiccia', 100],
    ['Würstel', 280, 'würstel', 50, 'wurstel', 'wurstel', 'hot dog'],
    ['Polpette', 220, 'porzione', 150, 'polpette al sugo'],
    ['Uovo', 128, 'uovo', 55, 'uova', 'uovo sodo', 'uova sode', 'uovo alla coque', 'uovo all’occhio'],
    ['Frittata', 180, 'porzione', 120, 'omelette', 'uova strapazzate'],
    ['Salmone', 185, 'porzione', 150, 'salmone al forno', 'salmone affumicato'],
    ['Tonno sott’olio', 190, 'scatoletta', 60, 'tonno', 'tonno in scatola'],
    ['Tonno al naturale', 103, 'scatoletta', 60],
    ['Merluzzo', 80, 'porzione', 150, 'nasello', 'platessa', 'pesce bianco', 'pesce'],
    ['Orata', 120, 'porzione', 150, 'branzino', 'spigola'],
    ['Pesce spada', 110, 'porzione', 150],
    ['Gamberi', 70, 'porzione', 150, 'gamberetti', 'mazzancolle'],
    ['Frittura di pesce', 250, 'porzione', 150, 'calamari fritti', 'fritto misto'],
    ['Bastoncini di pesce', 200, 'bastoncino', 25, 'bastoncini', 'findus'],

    // Salumi e formaggi
    ['Prosciutto crudo', 270, 'fetta', 15, 'crudo', 'prosciutto'],
    ['Prosciutto cotto', 215, 'fetta', 20, 'cotto'],
    ['Bresaola', 150, 'fetta', 10],
    ['Mortadella', 315, 'fetta', 20],
    ['Salame', 400, 'fetta', 10, 'salamino', 'chorizo'],
    ['Speck', 300, 'fetta', 15],
    ['Mozzarella', 250, 'mozzarella', 125, 'fiordilatte', 'bocconcini'],
    ['Burrata', 300, 'burrata', 125, 'stracciatella'],
    ['Parmigiano', 390, 'cucchiaio', 10, 'grana', 'grana padano', 'parmigiano reggiano'],
    ['Ricotta', 145, 'porzione', 100],
    ['Stracchino', 300, 'porzione', 60, 'crescenza'],
    ['Formaggio', 350, 'porzione', 50, 'formaggi', 'fontina', 'emmental', 'provola', 'scamorza', 'asiago', 'pecorino', 'gorgonzola'],
    ['Formaggio spalmabile', 250, 'cucchiaio', 30, 'philadelphia', 'robiola'],
    ['Feta', 265, 'porzione', 50],
    ['Yogurt bianco', 66, 'vasetto', 125, 'yogurt'],
    ['Yogurt greco 0%', 57, 'vasetto', 170, 'yogurt greco', 'greco', 'fage', 'skyr'],
    ['Yogurt alla frutta', 95, 'vasetto', 125],

    // Legumi e verdure
    ['Lenticchie (cotte)', 116, 'porzione', 150, 'lenticchie'],
    ['Fagioli (cotti)', 100, 'porzione', 150, 'fagioli', 'borlotti', 'cannellini'],
    ['Ceci (cotti)', 120, 'porzione', 150, 'ceci'],
    ['Piselli', 70, 'porzione', 150],
    ['Hummus', 170, 'cucchiaio', 30],
    ['Tofu', 120, 'porzione', 100, 'seitan', 'tempeh'],
    ['Insalata', 15, 'porzione', 80, 'insalata verde', 'lattuga', 'rucola', 'misticanza'],
    ['Pomodoro', 18, 'pomodoro', 150, 'pomodori', 'pomodorini'],
    ['Verdure grigliate', 60, 'porzione', 200, 'verdure', 'grigliata di verdure', 'melanzane', 'zucchine', 'peperoni'],
    ['Verdure lesse', 25, 'porzione', 200, 'spinaci', 'broccoli', 'fagiolini', 'bietola', 'cavolfiore'],
    ['Carota', 35, 'carota', 80, 'carote'],
    ['Patate lesse', 85, 'porzione', 200, 'patate', 'patate bollite', 'pure', 'purè'],
    ['Patate al forno', 150, 'porzione', 200],
    ['Patatine fritte', 310, 'porzione', 150, 'patatine', 'fries', 'patate fritte'],
    ['Patatine in busta', 535, 'sacchetto', 25, 'chips', 'pringles', 'san carlo'],
    ['Popcorn', 400, 'porzione', 30],

    // Frutta
    ['Mela', 52, 'mela', 180, 'mele'],
    ['Banana', 89, 'banana', 120, 'banane'],
    ['Arancia', 45, 'arancia', 200, 'arance'],
    ['Mandarino', 53, 'mandarino', 80, 'mandarini', 'clementina', 'clementine'],
    ['Pera', 55, 'pera', 170, 'pere'],
    ['Kiwi', 60, 'kiwi', 80],
    ['Fragole', 30, 'porzione', 150, 'fragola'],
    ['Uva', 70, 'porzione', 150],
    ['Pesca', 40, 'pesca', 150, 'pesche', 'nettarina'],
    ['Albicocca', 48, 'albicocca', 40, 'albicocche'],
    ['Ciliegie', 63, 'porzione', 150, 'ciliegia'],
    ['Ananas', 50, 'fetta', 100],
    ['Anguria', 30, 'fetta', 300, 'cocomero'],
    ['Melone', 34, 'fetta', 200],
    ['Frutti di bosco', 45, 'porzione', 125, 'mirtilli', 'lamponi', 'more'],
    ['Avocado', 200, 'mezzo avocado', 100],
    ['Datteri', 280, 'dattero', 8, 'dattero'],
    ['Frutta secca', 600, 'porzione', 30, 'noci', 'mandorle', 'nocciole', 'anacardi', 'pistacchi', 'arachidi', 'noccioline'],
    ['Burro d’arachidi', 590, 'cucchiaio', 15, 'burro di arachidi', 'peanut butter'],

    // Condimenti
    ['Olio d’oliva', 899, 'cucchiaio', 10, 'olio', 'olio evo', 'olio extravergine'],
    ['Burro', 750, 'noce', 10],
    ['Maionese', 680, 'cucchiaio', 15],
    ['Ketchup', 110, 'cucchiaio', 15, 'senape', 'salsa barbecue'],
    ['Sugo di pomodoro', 50, 'porzione', 100, 'passata', 'salsa di pomodoro'],
    ['Panna', 300, 'cucchiaio', 15, 'panna da cucina', 'panna montata']
  ];

  const WORDNUM = { un: 1, uno: 1, una: 1, 'un’': 1, mezzo: 0.5, mezza: 0.5, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10 };
  const STOP = new Set(['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'al', 'alla', 'allo', 'ai', 'agli', 'alle', 'con', 'e', 'in', 'il', 'lo', 'la', 'i', 'gli', 'le', 'a', 'da', 'per', 'g', 'gr', 'grammi', 'ml', 'pz', 'pezzi', 'pezzo', 'fetta', 'fette', 'porzione', 'porzioni', 'piatto', 'bicchiere', 'tazza', 'tazzina', 'cucchiaio', 'cucchiaini', 'cucchiaino', 'vasetto']);

  const norm = s => s.toLocaleLowerCase('it').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const stem = w => w.length > 4 ? w.replace(/(i|e|a|o|he|hi)$/, '') : w;

  const index = DB.map(([name, kcal, unit, grams, ...aliases]) => ({
    name, kcal, unit, grams,
    terms: [name, ...aliases].map(t => norm(t).split(' ').filter(w => w && !STOP.has(w)).map(stem))
  }));

  // Estrae quantità dal testo: "2 biscotti", "pasta 120 g", "mezzo panino".
  function parseQty(text) {
    const t = ' ' + text.toLocaleLowerCase('it') + ' ';
    const g = t.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|grammi|ml)\b/);
    if (g) return { grams: parseFloat(g[1].replace(',', '.')) };
    const n = t.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?=\s)/);
    if (n) return { units: parseFloat(n[1].replace(',', '.')) };
    for (const [w, v] of Object.entries(WORDNUM)) if (new RegExp('(^|\\s)' + w + '(\\s|$)').test(t)) return { units: v };
    return {};
  }

  function search(text) {
    const words = norm(text).split(' ').filter(w => w && !STOP.has(w) && !/^\d/.test(w) && !(w in WORDNUM)).map(stem);
    if (!words.length) return [];
    const results = [];
    for (const item of index) {
      let best = 0;
      for (const term of item.terms) {
        let hit = 0;
        for (const w of words) {
          if (term.some(t => t === w)) hit += 3;
          else if (term.some(t => t.startsWith(w) || (w.length >= 4 && w.startsWith(t) && t.length >= 4))) hit += 2;
        }
        if (!hit) continue;
        // Preferisce i termini che coprono tutte le parole scritte e niente di più.
        const score = hit - Math.abs(term.length - words.length) * 0.6 + (term === item.terms[0] ? 0.3 : 0);
        best = Math.max(best, score);
      }
      if (best >= 1.9) results.push({ item, score: best });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 5).map(r => r.item);
  }

  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
  const kcalOf = (item, grams) => Math.max(item.kcal ? 1 : 0, Math.round(item.kcal * grams / 100));

  function attach(nameInput, kcalInput) {
    if (!nameInput || !kcalInput || nameInput.dataset.fkEstimate) return;
    nameInput.dataset.fkEstimate = '1';
    nameInput.setAttribute('autocomplete', 'off');

    const box = document.createElement('div');
    box.className = 'k-est';
    box.innerHTML =
      '<ul class="k-est-list" role="listbox" aria-label="Alimenti suggeriti"></ul>' +
      '<div class="k-est-qty" hidden>' +
      '<button type="button" class="k-est-minus" aria-label="Diminuisci quantità">−</button>' +
      '<div class="k-est-qty-text"><input type="number" class="k-est-n" min="0" step="any" inputmode="decimal" aria-label="Quantità" form="k-est-none"><span class="k-est-unit"></span></div>' +
      '<button type="button" class="k-est-plus" aria-label="Aumenta quantità">+</button>' +
      '<button type="button" class="k-est-mode">in grammi</button>' +
      '</div>' +
      '<p class="k-est-note" role="status" aria-live="polite"></p>';
    nameInput.insertAdjacentElement('afterend', box);
    const list = box.querySelector('.k-est-list'), qtyRow = box.querySelector('.k-est-qty'),
      nInput = box.querySelector('.k-est-n'), unitEl = box.querySelector('.k-est-unit'),
      modeBtn = box.querySelector('.k-est-mode'), note = box.querySelector('.k-est-note');

    const kLabel = document.querySelector('label[for="' + kcalInput.id + '"]');
    const badge = document.createElement('span'); badge.className = 'k-est-badge'; badge.textContent = 'stima automatica'; badge.hidden = true;
    if (kLabel) kLabel.append(' ', badge);

    let chosen = null, byGrams = false, manual = false, lastAuto = '';

    function update() {
      if (!chosen) return;
      const n = Math.max(0, parseFloat(nInput.value) || 0);
      const grams = byGrams ? n : n * chosen.grams;
      unitEl.textContent = byGrams ? 'grammi' : ('× ' + chosen.unit + ' da ' + chosen.grams + ' g = ' + fmt(grams) + ' g');
      modeBtn.textContent = byGrams ? 'a ' + chosen.unit : 'in grammi';
      const kcal = kcalOf(chosen, grams);
      if (!manual) { kcalInput.value = kcal ? String(kcal) : ''; lastAuto = kcalInput.value; badge.hidden = false; }
      note.textContent = chosen.name + ' · ' + chosen.kcal + ' kcal/100 g → circa ' + kcal + ' kcal. Stima indicativa: per prodotti confezionati vale l’etichetta.';
      list.querySelectorAll('li').forEach(li => li.setAttribute('aria-selected', li.dataset.name === chosen.name));
    }
    function choose(item, qty) {
      chosen = item; manual = false; qtyRow.hidden = false;
      if (qty && qty.grams) { byGrams = true; nInput.value = qty.grams; }
      else { byGrams = false; nInput.value = qty && qty.units ? qty.units : 1; }
      update();
    }
    function clear(msg) {
      chosen = null; qtyRow.hidden = true; badge.hidden = true; note.textContent = msg || '';
      if (!manual && kcalInput.value === lastAuto) kcalInput.value = '';
    }
    function render(items) {
      list.replaceChildren(...items.map(it => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option'); li.dataset.name = it.name; li.tabIndex = 0;
        li.innerHTML = '<b></b><span></span>';
        li.firstChild.textContent = it.name;
        li.lastChild.textContent = '1 ' + it.unit + ' (' + it.grams + ' g) · ' + kcalOf(it, it.grams) + ' kcal';
        const pick = () => { choose(it, parseQty(nameInput.value)); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} };
        li.addEventListener('click', pick);
        li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        return li;
      }));
      list.hidden = !items.length;
    }

    let timer = null;
    nameInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const text = nameInput.value;
        if (norm(text).length < 2) { render([]); clear(); return; }
        const items = search(text);
        render(items);
        if (items.length) choose(items[0], parseQty(text));
        else clear('Non lo trovo nell’elenco: inserisci le calorie a mano.');
      }, 140);
    });
    kcalInput.addEventListener('input', () => { manual = kcalInput.value !== lastAuto; badge.hidden = manual || !chosen; });
    nInput.addEventListener('input', update);
    box.querySelector('.k-est-minus').addEventListener('click', () => {
      const step = byGrams ? 10 : 0.5; nInput.value = Math.max(step, (parseFloat(nInput.value) || 0) - step); manual = false; update();
    });
    box.querySelector('.k-est-plus').addEventListener('click', () => {
      const step = byGrams ? 10 : (parseFloat(nInput.value) < 1 ? 0.5 : 1); nInput.value = (parseFloat(nInput.value) || 0) + step; manual = false; update();
    });
    modeBtn.addEventListener('click', () => {
      if (!chosen) return;
      const n = parseFloat(nInput.value) || 1;
      if (byGrams) { byGrams = false; nInput.value = Math.max(0.5, Math.round(n / chosen.grams * 2) / 2); }
      else { byGrams = true; nInput.value = Math.round(n * chosen.grams); }
      manual = false; update();
    });
    // Dopo il salvataggio o l'annullamento il modulo si svuota: azzera anche la stima.
    const form = nameInput.form;
    if (form) {
      form.addEventListener('submit', () => setTimeout(() => { if (!nameInput.value) { render([]); clear(); } }, 0));
      form.addEventListener('reset', () => { render([]); clear(); });
      form.querySelectorAll('button[type="button"]').forEach(b => {
        if (/annulla/i.test(b.textContent)) b.addEventListener('click', () => { render([]); clear(); });
      });
    }
  }

  window.FKFood = { search, parseQty, attach };
  attach(document.getElementById('fk-rescue-name'), document.getElementById('fk-rescue-kcal'));
  attach(document.getElementById('mealname'), document.getElementById('kcal'));
})();
