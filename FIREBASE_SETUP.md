# FIT KORE — attivazione Firebase Spark

1. In Firebase Console apri il progetto corretto, aggiungi un'app **Web** e copia **solo** apiKey, authDomain, projectId e appId in `firebase-config.js`.
2. Authentication → Metodi di accesso: abilita Email/Password e Google. Authentication → Impostazioni → Domini autorizzati: aggiungi `asdvikings2024-dotcom.github.io`.
3. Firestore → Regole: pubblica il contenuto di `firestore.rules`. Non usare regole aperte in produzione.
4. Crea manualmente da Firebase Console il documento `admins/UID_DEL_TUO_ACCOUNT` con un campo `role` uguale a `owner`. Recupera il tuo UID dalla sezione Authentication. **Non creare un pulsante pubblico per diventare admin.**
5. Registra un account di prova: il documento `members/UID` deve nascere con `status: pending`. Accedi come amministratore per approvarlo. Verifica con un secondo account che non possa modificare il proprio status.
6. Verifica in GitHub Actions che Pages abbia pubblicato l'ultima versione. Non condividere password o chiavi private.

Nota: l'autenticazione è predisposta ma rimane inattiva finché non si inserisce la configurazione e non si pubblicano le regole. I dati di alimentazione e allenamento sono ancora locali al browser, non sincronizzati nel cloud. L'approvazione non equivale ancora a protezione completa dei dati locali o delle schermate demo.
