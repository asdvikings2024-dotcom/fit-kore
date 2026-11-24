# FIT KORE — attivazione Firebase Spark

1. In Firebase Console apri il progetto corretto, aggiungi un'app **Web** e copia **solo** apiKey, authDomain, projectId e appId in `firebase-config.js`.
2. Authentication → Metodi di accesso: abilita Email/Password e Google. Authentication → Impostazioni → Domini autorizzati: aggiungi `asdvikings2024-dotcom.github.io`.
3. Firestore → Regole: pubblica il contenuto di `firestore.rules`. Non usare regole aperte in produzione.
4. Crea manualmente da Firebase Console il documento `admins/UID_DEL_TUO_ACCOUNT` con un campo `role` uguale a `owner`. Recupera il tuo UID dalla sezione Authentication. **Non creare un pulsante pubblico per diventare admin.**
5. Registra un account di prova: il documento `members/UID` deve nascere con `status: pending`. Accedi come amministratore per approvarlo. Verifica con un secondo account che non possa modificare il proprio status.
6. Verifica in GitHub Actions che Pages abbia pubblicato l'ultima versione. Non condividere password o chiavi private.

## Sincronizzazione cloud

Dopo l'approvazione, i dati dell'app (pasti, allenamenti, diario, acqua, obiettivi, peso, impostazioni orologio) vengono salvati nel documento `users/UID` e ripristinati su ogni dispositivo dove l'utente accede.

- **Primo accesso:** i dati già presenti su quel dispositivo vengono caricati nell'account.
- **Altro dispositivo:** al login i dati del cloud sostituiscono quelli locali e la pagina si ricarica una volta.
- **Conflitti:** vince l'ultima modifica salvata.
- **Uscita dall'account:** i dati vengono salvati e poi cancellati dal dispositivo (restano nell'account).
- **Offline:** le modifiche restano sul dispositivo e vengono inviate al ritorno della connessione.

Nota: finché `firebase-config.js` è vuoto l'app resta in modalità dimostrativa con i dati solo nel browser.
