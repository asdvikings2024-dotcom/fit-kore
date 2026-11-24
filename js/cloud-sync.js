// FIT KORE — sincronizzazione cloud dei dati locali (Firestore).
// L'app salva tutto in localStorage; questo modulo copia le chiavi dell'app
// nel documento users/{uid} e le ripristina su un altro dispositivo.
// Strategia semplice e prevedibile: "vince l'ultima modifica".

const DATA_KEY = /^(fit-kore-v2|fk-[a-z0-9-]+-v\d+)$/;
const META_KEY = 'fk-sync-meta';
const DEBOUNCE_MS = 1500;

const store = window.localStorage;
const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;

function readMeta() {
  try { return JSON.parse(store.getItem(META_KEY) || 'null') || {}; } catch { return {}; }
}
function writeMeta(meta) { rawSet.call(store, META_KEY, JSON.stringify(meta)); }

function dataKeys() {
  const keys = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && DATA_KEY.test(k)) keys.push(k);
  }
  return keys;
}
function collectLocal() {
  const data = {};
  for (const k of dataKeys()) data[k] = store.getItem(k);
  return data;
}
function replaceLocal(data) {
  for (const k of dataKeys()) rawRemove.call(store, k);
  for (const [k, v] of Object.entries(data || {})) {
    if (DATA_KEY.test(k) && typeof v === 'string') rawSet.call(store, k, v);
  }
}

/** Cancella i dati dell'app da questo dispositivo (usato all'uscita dall'account). */
export function clearLocalData() {
  for (const k of dataKeys()) rawRemove.call(store, k);
  rawRemove.call(store, META_KEY);
}

let badge = null;
function setStatus(text, mode) {
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'fk-sync-status';
    badge.setAttribute('role', 'status');
    document.querySelector('.top')?.append(badge);
  }
  badge.textContent = text;
  badge.dataset.mode = mode;
}

let session = null;

/**
 * Avvia la sincronizzazione per l'utente approvato.
 * Restituisce una funzione flush() da chiamare prima di uscire dall'account.
 */
export async function startSync({ db, F, user }) {
  if (session?.uid === user.uid) return session.flush;
  session = null;
  const ref = F.doc(db, 'users', user.uid);
  let timer = null;
  let uploading = Promise.resolve();

  const notice = document.querySelector('.notice');
  if (notice) notice.textContent = '☁ I tuoi dati sono salvati nel tuo account FIT KORE e sincronizzati tra i dispositivi.';

  async function upload() {
    clearTimeout(timer); timer = null;
    const rev = Date.now();
    setStatus('☁ Salvataggio…', 'busy');
    uploading = uploading.then(async () => {
      try {
        await F.setDoc(ref, { data: collectLocal(), rev, updatedAt: F.serverTimestamp() });
        writeMeta({ uid: user.uid, rev, dirty: false });
        setStatus('☁ Sincronizzato', 'ok');
      } catch (e) {
        console.error('FIT KORE sync:', e);
        writeMeta({ ...readMeta(), uid: user.uid, dirty: true });
        setStatus(navigator.onLine ? '⚠ Sync non riuscita' : '☁ Offline: salvo appena torni online', 'error');
      }
    });
    return uploading;
  }
  function schedule() {
    writeMeta({ ...readMeta(), uid: user.uid, dirty: true });
    setStatus('☁ Modifiche in attesa…', 'busy');
    clearTimeout(timer);
    timer = setTimeout(upload, DEBOUNCE_MS);
  }

  // Confronta locale e cloud: restituisce true se la pagina verrà ricaricata.
  async function reconcile() {
    const meta = readMeta();
    const snap = await F.getDoc(ref);
    const cloud = snap.exists() ? snap.data() : null;
    const sameUser = meta.uid === user.uid;
    if (!cloud) { await upload(); return false; }               // primo accesso: porto i dati di questo dispositivo nel cloud
    if (sameUser && meta.dirty) { await upload(); return false; } // modifiche locali non ancora salvate
    if (sameUser && meta.rev === cloud.rev) { setStatus('☁ Sincronizzato', 'ok'); return false; }
    replaceLocal(cloud.data);                                     // il cloud è più recente o è un altro account
    writeMeta({ uid: user.uid, rev: cloud.rev, dirty: false });
    location.reload();
    return true;
  }

  // Intercetta i salvataggi dell'app su localStorage.
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === store && DATA_KEY.test(k) && session?.uid === user.uid) schedule();
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === store && DATA_KEY.test(k) && session?.uid === user.uid) schedule();
  };

  const flush = async () => { if (timer || readMeta().dirty) await upload(); else await uploading; };
  session = { uid: user.uid, flush };

  document.addEventListener('visibilitychange', () => {
    if (session?.uid !== user.uid) return;
    if (document.visibilityState === 'hidden' && timer) upload();
    if (document.visibilityState === 'visible' && !timer) reconcile().catch(e => console.error('FIT KORE sync:', e));
  });
  window.addEventListener('online', () => { if (session?.uid === user.uid && readMeta().dirty) upload(); });

  try { await reconcile(); }
  catch (e) {
    console.error('FIT KORE sync:', e);
    setStatus('⚠ Cloud non raggiungibile: dati solo su questo dispositivo', 'error');
  }
  return flush;
}

/** Ferma la sincronizzazione (uscita dall'account). */
export function stopSync() {
  session = null;
  Storage.prototype.setItem = rawSet;
  Storage.prototype.removeItem = rawRemove;
  badge?.remove(); badge = null;
}
