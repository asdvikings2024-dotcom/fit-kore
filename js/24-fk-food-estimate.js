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

  // Macronutrienti per 100 g: [proteine, carboidrati, grassi] (valori medi indicativi).
  const MACROS = {
    'Biscotto frollino': [6.5, 70, 18], 'Biscotto secco': [7, 77, 9], 'Biscotto integrale': [7, 66, 16], 'Fetta biscottata': [11, 75, 6],
    'Cornetto vuoto': [7.5, 48, 21], 'Cornetto alla crema': [6.5, 47, 18], 'Crostata': [5, 63, 14], 'Torta': [6, 55, 15], 'Muffin': [5.5, 52, 19],
    'Merendina': [6, 58, 18], 'Krapfen': [6.5, 47, 21], 'Cannolo siciliano': [7, 42, 17], 'Tiramisù': [6, 30, 17], 'Panna cotta': [3, 20, 15],
    'Gelato': [4, 28, 10], 'Pandoro': [8, 52, 18], 'Panettone': [7, 53, 14], 'Pancake': [6.5, 32, 8.5], 'Cioccolato fondente': [7.5, 47, 34],
    'Cioccolato al latte': [7.5, 57, 31], 'Crema spalmabile': [6.3, 57, 31], 'Marmellata': [0.4, 61, 0.1], 'Miele': [0.6, 80, 0], 'Zucchero': [0, 100, 0],
    'Caramella': [3, 92, 0.5], 'Cereali': [7.5, 84, 0.9], 'Muesli': [9.5, 64, 7.5], 'Fiocchi d’avena': [13, 60, 7], 'Barretta ai cereali': [6, 68, 12],
    'Barretta proteica': [30, 33, 11], 'Caffè espresso': [0.1, 0.3, 0.2], 'Caffè zuccherato': [0.1, 17, 0.2], 'Cappuccino': [3.1, 4.6, 2.2],
    'Caffè latte': [3, 4.8, 2], 'Latte intero': [3.3, 4.9, 3.6], 'Latte parzialmente scremato': [3.4, 5, 1.6], 'Latte scremato': [3.5, 5, 0.2],
    'Latte di soia': [3.3, 1.5, 1.9], 'Tè': [0, 0.3, 0], 'Tè freddo': [0, 7.5, 0], 'Succo di frutta': [0.3, 12, 0.1], 'Spremuta d’arancia': [0.7, 10, 0.2],
    'Coca-Cola': [0, 10.6, 0], 'Coca-Cola Zero': [0, 0, 0], 'Birra': [0.5, 3.5, 0], 'Vino rosso': [0.1, 2.6, 0], 'Vino bianco': [0.1, 2.6, 0],
    'Prosecco': [0.1, 1.5, 0], 'Spritz': [0.1, 9, 0], 'Gin tonic': [0, 8, 0], 'Acqua': [0, 0, 0], 'Proteine in polvere': [78, 7, 5],
    'Pasta (cruda)': [12.5, 72, 1.5], 'Pasta al pomodoro': [4.5, 23, 3.3], 'Pasta al pesto': [5, 21, 6.5], 'Pasta alla carbonara': [8.5, 21, 10],
    'Pasta al ragù': [7.5, 21, 6.5], 'Pasta all’amatriciana': [7, 21, 8.5], 'Pasta cacio e pepe': [8, 24, 8], 'Pasta integrale (cruda)': [13.5, 66, 2.5],
    'Lasagna': [8, 14, 8], 'Risotto': [3.5, 22, 4], 'Riso bianco (cotto)': [2.7, 28, 0.3], 'Riso (crudo)': [7, 80, 0.6], 'Gnocchi': [3.5, 32, 0.6],
    'Tortellini': [12, 40, 9], 'Cous cous (crudo)': [12.5, 73, 1], 'Minestrone': [1.8, 6, 1.5], 'Pasta e fagioli': [5, 16, 2.5],
    'Pizza margherita': [10, 33, 8], 'Pizza al taglio': [9, 36, 10], 'Focaccia': [7, 42, 11], 'Piadina farcita': [11, 30, 12], 'Panino imbottito': [11, 32, 9],
    'Toast': [13, 30, 11], 'Tramezzino': [9, 26, 12], 'Hamburger (panino)': [12.5, 24, 11.5], 'Kebab': [11, 20, 10], 'Crocchette di pollo': [15, 16, 16],
    'Arancino': [7, 28, 9.5], 'Supplì': [8, 27, 10], 'Sushi': [6, 25, 3], 'Poke bowl': [8, 18, 4], 'Pane': [8.5, 53, 1.5], 'Pane integrale': [9.5, 46, 2.5],
    'Panino (rosetta)': [8.5, 56, 1.5], 'Pan carré': [8, 48, 5], 'Grissini': [12, 68, 9], 'Crackers': [10, 70, 12], 'Gallette di riso': [8, 81, 3],
    'Taralli': [9, 62, 18], 'Petto di pollo': [31, 0, 3.6], 'Pollo arrosto': [27, 0, 9], 'Cotoletta': [17, 14, 13], 'Hamburger di manzo': [20, 1, 18],
    'Bistecca di manzo': [28, 0, 10], 'Vitello': [21, 0, 2.7], 'Maiale': [26, 0, 13], 'Salsiccia': [15, 1, 26], 'Würstel': [11, 3, 25], 'Polpette': [15, 8, 14],
    'Uovo': [12.4, 0.7, 8.7], 'Frittata': [11, 2, 14], 'Salmone': [20, 0, 13], 'Tonno sott’olio': [25, 0, 10], 'Tonno al naturale': [23, 0, 1],
    'Merluzzo': [17, 0, 0.7], 'Orata': [20, 0, 4.5], 'Pesce spada': [19, 0, 4], 'Gamberi': [14, 0.5, 0.8], 'Frittura di pesce': [14, 15, 15],
    'Bastoncini di pesce': [13, 18, 8.5], 'Prosciutto crudo': [26, 0.3, 18], 'Prosciutto cotto': [20, 1, 14.5], 'Bresaola': [32, 0.5, 2.6],
    'Mortadella': [15, 1.5, 28], 'Salame': [26, 1.5, 33], 'Speck': [28, 0.5, 20], 'Mozzarella': [18.5, 0.7, 19.5], 'Burrata': [14, 1, 25],
    'Parmigiano': [33, 0, 28], 'Ricotta': [9.5, 3.5, 10], 'Stracchino': [18.5, 0, 25], 'Formaggio': [25, 1, 28], 'Formaggio spalmabile': [6, 4, 23],
    'Feta': [15, 1.5, 21], 'Yogurt bianco': [3.8, 4.3, 3.9], 'Yogurt greco 0%': [10, 4, 0.2], 'Yogurt alla frutta': [3.2, 15, 2.5],
    'Lenticchie (cotte)': [9, 17, 0.4], 'Fagioli (cotti)': [7, 16, 0.5], 'Ceci (cotti)': [8, 18, 2.5], 'Piselli': [5.5, 11, 0.4], 'Hummus': [7, 14, 10],
    'Tofu': [13, 2, 7.5], 'Insalata': [1.5, 2.2, 0.3], 'Pomodoro': [1, 3.5, 0.2], 'Verdure grigliate': [1.5, 5, 3.5], 'Verdure lesse': [2.5, 3.5, 0.4],
    'Carota': [1, 7.5, 0.2], 'Patate lesse': [2, 18, 0.1], 'Patate al forno': [2.5, 22, 5.5], 'Patatine fritte': [3.4, 41, 15], 'Patatine in busta': [6.5, 53, 33],
    'Popcorn': [12, 70, 9], 'Mela': [0.3, 13.7, 0.2], 'Banana': [1.1, 22.8, 0.3], 'Arancia': [0.9, 9, 0.2], 'Mandarino': [0.8, 13, 0.3], 'Pera': [0.4, 13, 0.1],
    'Kiwi': [1.1, 14.7, 0.5], 'Fragole': [0.7, 7.7, 0.3], 'Uva': [0.6, 17, 0.2], 'Pesca': [0.9, 9.5, 0.3], 'Albicocca': [1.4, 11, 0.4], 'Ciliegie': [1, 16, 0.2],
    'Ananas': [0.5, 13, 0.1], 'Anguria': [0.6, 7.5, 0.2], 'Melone': [0.8, 8, 0.2], 'Frutti di bosco': [0.9, 10, 0.4], 'Avocado': [2, 8.5, 15],
    'Datteri': [2.5, 75, 0.4], 'Frutta secca': [20, 15, 52], 'Burro d’arachidi': [25, 20, 50], 'Olio d’oliva': [0, 0, 100], 'Burro': [0.8, 0.6, 83],
    'Maionese': [1.1, 1.5, 75], 'Ketchup': [1.2, 25, 0.2], 'Sugo di pomodoro': [1.5, 7, 1.5], 'Panna': [2.5, 3.5, 30]
  };

  const WORDNUM = { un: 1, uno: 1, una: 1, 'un’': 1, mezzo: 0.5, mezza: 0.5, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10 };
  const STOP = new Set(['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'al', 'alla', 'allo', 'ai', 'agli', 'alle', 'con', 'e', 'in', 'il', 'lo', 'la', 'i', 'gli', 'le', 'a', 'da', 'per', 'g', 'gr', 'grammi', 'ml', 'pz', 'pezzi', 'pezzo', 'fetta', 'fette', 'porzione', 'porzioni', 'piatto', 'bicchiere', 'tazza', 'tazzina', 'cucchiaio', 'cucchiaini', 'cucchiaino', 'vasetto']);

  const norm = s => s.toLocaleLowerCase('it').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const stem = w => w.length > 4 ? w.replace(/(i|e|a|o|he|hi)$/, '') : w;

  const index = DB.map(([name, kcal, unit, grams, ...aliases]) => ({
    name, kcal, unit, grams, macro: MACROS[name] || null,
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

  // Preferiti e alimenti personali (sincronizzati con l'account).
  const FAVS = 'fk-food-favs-v1';
  function readFavs() { try { const v = JSON.parse(localStorage.getItem(FAVS) || 'null'); return v && v.items && typeof v.items === 'object' ? v : { items: {} }; } catch (e) { return { items: {} }; } }
  function customItems() {
    const out = [];
    for (const [name, f] of Object.entries(readFavs().items)) {
      if (!f || !f.custom || !(Number(f.kcal) > 0)) continue;
      out.push({ name, kcal: Number(f.kcal), unit: 'porzione', grams: 100, macro: null, custom: true,
        terms: [norm(name).split(' ').filter(w => w && !STOP.has(w) && !/^\d/.test(w)).map(stem)] });
    }
    return out;
  }
  function remember(choice, typedName, kcal) {
    const favs = readFavs(), now = Date.now();
    let key, rec;
    if (choice) { key = choice.name; rec = favs.items[key] || {}; rec.custom = false; }
    else {
      key = typedName.replace(/^\s*\d+([.,]\d+)?\s*(g|gr|grammi|ml|x)?\s+/i, '').trim();
      key = key.charAt(0).toLocaleUpperCase('it') + key.slice(1);
      if (key.length < 2 || !(kcal > 0)) return;
      rec = favs.items[key] || {}; rec.custom = true; rec.kcal = kcal;
    }
    rec.count = (rec.count || 0) + 1; rec.last = now; favs.items[key] = rec;
    // Tiene i 60 più usati.
    const keys = Object.keys(favs.items).sort((a, b) => (favs.items[b].count - favs.items[a].count) || (favs.items[b].last - favs.items[a].last));
    favs.items = Object.fromEntries(keys.slice(0, 60).map(k => [k, favs.items[k]]));
    try { localStorage.setItem(FAVS, JSON.stringify(favs)); } catch (e) {}
  }
  function topFavorites(n) {
    const favs = readFavs().items, customs = customItems();
    return Object.entries(favs)
      .sort((a, b) => (b[1].count - a[1].count) || (b[1].last - a[1].last))
      .map(([name, f]) => f.custom ? customs.find(c => c.name === name) : index.find(i => i.name === name))
      .filter(Boolean).slice(0, n);
  }

  function search(text) {
    const words = norm(text).split(' ').filter(w => w && !STOP.has(w) && !/^\d/.test(w) && !(w in WORDNUM)).map(stem);
    if (!words.length) return [];
    const results = [], favs = readFavs().items;
    for (const item of customItems().concat(index)) {
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
      if (best >= 1.9) {
        const f = favs[item.name];
        if (f && f.custom === !!item.custom) best += Math.min(5, f.count || 0) * 0.35 + (item.custom ? 0.5 : 0);
        results.push({ item, score: best });
      }
    }
    const seen = new Set();
    return results.sort((a, b) => b.score - a.score).filter(r => !seen.has(r.item.name) && seen.add(r.item.name)).slice(0, 5).map(r => r.item);
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
      unitEl.textContent = chosen.custom ? '× porzione' : byGrams ? 'grammi' : ('× ' + chosen.unit + ' da ' + chosen.grams + ' g = ' + fmt(grams) + ' g');
      modeBtn.hidden = !!chosen.custom;
      modeBtn.textContent = byGrams ? 'a ' + chosen.unit : 'in grammi';
      const kcal = kcalOf(chosen, grams);
      nameInput.fkChoice = { name: chosen.name, macro: chosen.macro, grams, kcal };
      if (!manual) { kcalInput.value = kcal ? String(kcal) : ''; lastAuto = kcalInput.value; badge.hidden = false; }
      note.textContent = chosen.custom ? 'Il tuo alimento: ' + chosen.kcal + ' kcal a porzione (come l’ultima volta).' : chosen.name + ' · ' + chosen.kcal + ' kcal/100 g → circa ' + kcal + ' kcal. Stima indicativa: per prodotti confezionati vale l’etichetta.';
      list.querySelectorAll('li').forEach(li => li.setAttribute('aria-selected', li.dataset.name === chosen.name));
    }
    function choose(item, qty) {
      chosen = item; manual = false; qtyRow.hidden = false;
      if (qty && qty.grams) { byGrams = true; nInput.value = qty.grams; }
      else { byGrams = false; nInput.value = qty && qty.units ? qty.units : 1; }
      update();
    }
    function clear(msg) {
      chosen = null; nameInput.fkChoice = null; qtyRow.hidden = true; badge.hidden = true; note.textContent = msg || '';
      if (!manual && kcalInput.value === lastAuto) kcalInput.value = '';
    }
    function render(items, title) {
      list.dataset.title = title || '';
      list.replaceChildren(...items.map(it => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option'); li.dataset.name = it.name; li.tabIndex = 0;
        li.innerHTML = '<b></b><span></span>';
        li.firstChild.textContent = it.name;
        li.lastChild.textContent = it.custom ? '★ tuo · ' + it.kcal + ' kcal a porzione' : '1 ' + it.unit + ' (' + it.grams + ' g) · ' + kcalOf(it, it.grams) + ' kcal';
        const pick = () => { if (!norm(nameInput.value)) nameInput.value = it.name; choose(it, parseQty(nameInput.value)); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} };
        li.addEventListener('click', pick);
        li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        return li;
      }));
      list.hidden = !items.length;
    }

    function showFavorites() {
      if (norm(nameInput.value).length) return;
      const favs = topFavorites(6);
      render(favs, favs.length ? 'I tuoi preferiti' : '');
    }
    nameInput.addEventListener('focus', showFavorites);
    nameInput.addEventListener('click', showFavorites);
    const formEl = nameInput.form;
    if (formEl) document.addEventListener('submit', e => {
      if (e.target !== formEl) return;
      const k = Number(kcalInput.value);
      if (!nameInput.value.trim() || !(k > 0)) return;
      if (chosen && chosen.custom) remember(null, chosen.name, Math.round(k / (parseFloat(nInput.value) || 1)));
      else if (chosen && !manual) remember(chosen, nameInput.value, k);
      // Calorie corrette a mano: lo ricordo come alimento tuo, con le tue calorie.
      else remember(null, nameInput.value, k);
    }, true);
    let timer = null;
    nameInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const text = nameInput.value;
        if (!norm(text).length) { clear(); showFavorites(); return; }
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

  window.FKFood = { search, parseQty, attach, topFavorites, find: name => index.find(i => i.name === name) || search(name)[0] || null };
  attach(document.getElementById('fk-rescue-name'), document.getElementById('fk-rescue-kcal'));
  attach(document.getElementById('mealname'), document.getElementById('kcal'));
})();
