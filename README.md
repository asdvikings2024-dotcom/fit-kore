# FIT KORE

Performance hub per allenamenti, alimentazione e diario. Pubblicato con GitHub Pages.

## Struttura

- `index.html`: solo la struttura delle schermate
- `css/app.css`: tutti gli stili, nell'ordine originale dei livelli
- `js/`: script dell'app, caricati nell'ordine numerato
- `js/cloud-sync.js`: sincronizzazione dei dati con Firestore
- `firebase-auth.js`, `firebase-config.js`: accesso e approvazione utenti
- `firestore.rules`: regole di sicurezza da pubblicare in Firebase

Per attivare login e cloud vedi `FIREBASE_SETUP.md`.
