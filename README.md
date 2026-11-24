# FIT KORE

Performance hub per allenamenti, alimentazione e diario. Pubblicato con GitHub Pages.

## Struttura

- `index.html`: solo la struttura delle schermate
- `css/app.css`: stili storici, nell'ordine originale dei livelli
- `css/redesign.css`: redesign "Kore Pulse" (palette, componenti, effetti); rispetta "riduci movimento"
- `js/`: script dell'app, caricati nell'ordine numerato
- `js/23-fk-redesign.js`: icone, schede Allenamenti, grafico reale, effetti
- `js/cloud-sync.js`: sincronizzazione dei dati con Firestore
- `firebase-auth.js`, `firebase-config.js`: accesso e approvazione utenti
- `firestore.rules`: regole di sicurezza da pubblicare in Firebase

Per attivare login e cloud vedi `FIREBASE_SETUP.md`.
