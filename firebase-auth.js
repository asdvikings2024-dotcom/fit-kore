import {firebaseConfig} from './firebase-config.js?v=20261125h';
import {startSync,stopSync,clearLocalData} from './js/cloud-sync.js?v=20261125h';

const required=['apiKey','authDomain','projectId','appId'];
if(required.every(key=>typeof firebaseConfig[key]==='string'&&firebaseConfig[key].trim())){
 try{
  const [{initializeApp},A,F]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
  ]);
  const auth=A.getAuth(initializeApp(firebaseConfig)),db=F.getFirestore(auth.app);
  const $=id=>document.getElementById(id);
  const modal=$('kore-access-modal'),status=$('kore-access-status'),form=$('kore-access-form');
  const warning=document.querySelector('.kore-access-warning');
  document.documentElement.classList.add('fk-auth-enabled');
  const css=document.createElement('style');
  css.textContent=`
  .fk-auth-enabled:not(.fk-auth-approved) .layout{visibility:hidden;pointer-events:none}
  .fk-auth-enabled:not(.fk-auth-approved) #kore-access-modal{z-index:9999999}
  .fk-auth-enabled:not(.fk-auth-approved) #kore-access-close{display:none}
  .fk-auth-enabled .kore-access-panel{max-height:92dvh;overflow:auto}
  #fk-admin-panel{margin:18px 0}
  #fk-admin-list .fk-admin-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #37402e}
  #fk-admin-list .fk-admin-row span{overflow-wrap:anywhere;flex:1 1 180px}
  `;
  css.textContent+=`.kore-access-google{display:flex!important;align-items:center;justify-content:center;gap:12px;width:100%;height:54px;margin:14px 0 6px;border-radius:15px;border:0;background:#fff!important;color:#1f1f1f!important;font:700 16px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 30px -12px rgba(255,255,255,.35)}.kore-access-google:disabled{opacity:.6}.kore-google-hint{margin:0 0 6px;font-size:12.5px;color:#b9c2b5;text-align:center}.kore-or{display:flex;align-items:center;gap:10px;margin:14px 0 10px;color:#8d978a;font-size:12px;text-transform:uppercase;letter-spacing:.1em}.kore-or::before,.kore-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.1)}.kore-terms a{color:#dfff00}.fk-auth-approved .kore-access-google,.fk-auth-approved .kore-google-hint,.fk-auth-approved .kore-or{display:none!important}`;
  css.textContent+=`.fk-auth-approved #kore-access-form,.fk-auth-approved .kore-access-tabs,.fk-auth-approved #kore-google-login,.fk-auth-approved .kore-terms,.fk-auth-approved .kore-forgot,.fk-auth-approved .kore-access-warning{display:none!important}.kore-account{margin:6px 0 12px;display:grid;gap:10px}.kore-account[hidden],.kore-account [hidden]{display:none!important}.kore-account-who{font-weight:700;color:#dfff00;margin:0}.kore-account-pass{display:grid;gap:8px;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.03)}.kore-account-pass p{margin:0;font-size:12.5px;line-height:1.45;color:#b9c2b5}.kore-account-ok{margin:0;color:#dfff00;font-size:13px}.kore-forgot{background:none!important;border:0!important;color:#b9c2b5!important;font-size:12.5px!important;text-decoration:underline;padding:6px 0!important;cursor:pointer;box-shadow:none!important;width:auto!important;justify-self:start}.kore-terms{display:flex;gap:10px;align-items:flex-start;margin:12px 0 4px;font-size:12.5px;line-height:1.45;color:#b9c2b5;cursor:pointer}.kore-terms input{margin-top:2px;width:18px;height:18px;flex:none;accent-color:#dfff00}`;
  document.head.append(css);
  if(warning)warning.textContent='Le nuove iscrizioni richiedono approvazione. Le credenziali sono gestite da Firebase.';
  // Condizioni della beta: necessarie solo per creare la richiesta d'iscrizione.
  const TERMS_VERSION='beta-2026-11-19';
  const termsLabel=document.createElement('label');termsLabel.className='kore-terms';
  termsLabel.innerHTML='<input type="checkbox" id="kore-terms"> <span>Accetto le <a href="./privacy.html" target="_blank" rel="noopener">condizioni e l’informativa privacy</a> e acconsento al salvataggio dei miei dati FIT KORE (pasti, allenamenti, peso, diario) nel mio account. Posso chiederne la cancellazione in qualsiasi momento.</span>';
  form.after(termsLabel);
  const messages={
   'auth/provider-already-linked':'Hai già una password collegata a questo account.',
   'auth/credential-already-in-use':'Questa email è già usata da un altro account con password.',
   'auth/weak-password':'Password troppo debole: usa almeno 8 caratteri.',
   'auth/popup-closed-by-user':'Finestra di Google chiusa prima di completare.',
   'auth/popup-blocked':'Il browser ha bloccato la finestra di Google: consenti i popup e riprova.',
   'auth/too-many-requests':'Troppi tentativi: attendi qualche minuto e riprova.',
   'fk/terms':'Per completare l’iscrizione spunta l’accettazione delle condizioni qui sotto.',
   'auth/email-already-in-use':'Email già registrata. Prova ad accedere.',
   'auth/invalid-email':'Indirizzo email non valido.',
   'auth/invalid-credential':'Email o password non valide. Se ti sei iscritto con Google, usa «Continua con Google» oppure imposta una password dal tuo account.',
   'auth/weak-password':'Scegli una password più sicura.',
   'auth/too-many-requests':'Troppi tentativi. Riprova più tardi.',
   'auth/operation-not-allowed':'Metodo di accesso non abilitato nella console Firebase.',
   'auth/unauthorized-domain':'Autorizza il dominio GitHub Pages nella console Firebase.',
   'auth/popup-blocked':'Popup bloccato: consenti i popup e riprova.',
   'auth/network-request-failed':'Connessione assente. Riprova.',
   'permission-denied':'Accesso negato da Firestore: controlla le regole.'
  };
  function report(error){console.error('FIT KORE Firebase:',error);status.textContent=messages[error?.code]||'Impossibile completare l’operazione. Verifica la configurazione Firebase.'}
  function showGate(text){document.documentElement.classList.remove('fk-auth-approved');document.body.dataset.koreAccess='pending';modal.hidden=false;document.body.style.overflow='';status.textContent=text}
  function showApp(){document.documentElement.classList.add('fk-auth-approved');document.body.dataset.koreAccess='approved';modal.hidden=true;document.body.style.overflow=''}
  const signout=document.createElement('button');signout.type='button';signout.className='kore-access-secondary';signout.textContent='Esci dall’account';
  let flushSync=null;
  signout.addEventListener('click',async()=>{
   try{
    status.textContent='Salvataggio dei dati e uscita…';
    if(flushSync)await flushSync();
    stopSync();flushSync=null;
    await A.signOut(auth);
    clearLocalData(); // i dati restano nel tuo account, non su questo dispositivo
    try{localStorage.removeItem('fk-approved-uid')}catch(e){}
    location.reload();
   }catch(e){report(e)}
  });
  document.querySelector('.kore-access-panel')?.append(signout);
  // Pannello account (visibile solo dopo l'accesso): email collegata e password FIT KORE.
  const account=document.createElement('div');account.className='kore-account';account.hidden=true;
  account.innerHTML='<p class="kore-account-who"></p>'+
   '<form class="kore-account-pass" novalidate><strong>Accesso anche con email e password</strong>'+
   '<p>Il tuo account usa Google. Se imposti una password potrai entrare anche con la tua email e questa password, da qualsiasi dispositivo.</p>'+
   '<label for="kore-new-pass">Nuova password</label><input id="kore-new-pass" type="password" autocomplete="new-password" minlength="8" placeholder="Almeno 8 caratteri">'+
   '<label for="kore-new-pass2">Ripeti la password</label><input id="kore-new-pass2" type="password" autocomplete="new-password" minlength="8">'+
   '<button type="submit" class="kore-access-primary">Imposta password</button></form>'+
   '<p class="kore-account-ok" hidden>✓ Puoi entrare sia con Google sia con email e password.</p>';
  signout.before(account);
  const passForm=account.querySelector('form');
  function refreshAccount(){
   const u=auth.currentUser;account.hidden=!u;if(!u)return;
   account.querySelector('.kore-account-who').textContent='Collegato come '+(u.email||'utente');
   const hasPass=u.providerData.some(p=>p.providerId==='password');
   passForm.hidden=hasPass;account.querySelector('.kore-account-ok').hidden=!hasPass||!u.providerData.some(p=>p.providerId==='google.com');
  }
  passForm.addEventListener('submit',async e=>{
   e.preventDefault();
   const u=auth.currentUser,p1=$('kore-new-pass').value,p2=$('kore-new-pass2').value;
   if(!u||!u.email)return;
   if(p1.length<8){status.textContent='La password deve avere almeno 8 caratteri.';return}
   if(p1!==p2){status.textContent='Le due password non coincidono.';return}
   const btn=passForm.querySelector('button');btn.disabled=true;status.textContent='Impostazione della password…';
   const cred=A.EmailAuthProvider.credential(u.email,p1);
   try{
    try{await A.linkWithCredential(u,cred)}
    catch(err){
     if(err?.code!=='auth/requires-recent-login')throw err;
     status.textContent='Per sicurezza conferma di nuovo con Google…';
     await A.reauthenticateWithPopup(u,new A.GoogleAuthProvider());
     await A.linkWithCredential(u,cred);
    }
    await u.reload();passForm.reset();refreshAccount();
    status.textContent='Password impostata. Ora puoi entrare anche con email e password.';
   }catch(err){report(err)}
   finally{btn.disabled=false;$('kore-new-pass').value='';$('kore-new-pass2').value=''}
  });
  // Password dimenticata (account email/password).
  const forgot=document.createElement('button');forgot.type='button';forgot.className='kore-forgot';forgot.textContent='Password dimenticata?';
  form.after(forgot);
  forgot.addEventListener('click',async()=>{
   const email=$('kore-access-email').value.trim();
   if(!email){status.textContent='Scrivi la tua email qui sopra, poi premi di nuovo “Password dimenticata?”.';$('kore-access-email').focus();return}
   try{await A.sendPasswordResetEmail(auth,email);status.textContent='Se l’email è registrata con una password, riceverai il link per reimpostarla. Controlla anche lo spam.'}
   catch(err){report(err)}
  });
  A.onAuthStateChanged(auth,()=>refreshAccount());
  const memberRef=uid=>F.doc(db,'members',uid);
  async function getMember(user){
   const ref=memberRef(user.uid);let snap=await F.getDoc(ref);
   if(!snap.exists()){
    const terms=$('kore-terms');
    if(!terms||!terms.checked){const err=new Error('terms');err.code='fk/terms';throw err}
    try{await F.setDoc(ref,{email:user.email,status:'pending',createdAt:F.serverTimestamp(),termsVersion:TERMS_VERSION,termsAcceptedAt:F.serverTimestamp()})}
    catch(e){const retry=await F.getDoc(ref);if(!retry.exists())throw e}
    snap=await F.getDoc(ref);
   }
   return snap;
  }
  let sequence=0;
  async function refreshSession(user){
   const current=++sequence;
   $('fk-admin-panel')?.remove();
   if(!user){stopSync();flushSync=null;showGate('Accedi oppure richiedi l’iscrizione.');return}
   showGate('Verifica del tuo account in corso…');
   try{
    const [member,admin]=await Promise.all([
     getMember(user),
     F.getDoc(F.doc(db,'admins',user.uid))
    ]);
    if(current!==sequence||auth.currentUser?.uid!==user.uid)return;
    const isAdmin=admin.exists(),state=member.data()?.status;
    if(isAdmin||state==='approved'){
     try{localStorage.setItem('fk-approved-uid',user.uid)}catch(e){}
     window.fkUser={name:user.displayName||'',email:user.email||''};window.dispatchEvent(new Event('fk-user'));
     flushSync=await startSync({db,F,user});
     if(current!==sequence)return;
     showApp();
     status.textContent=isAdmin?'Accesso amministratore autorizzato.':'Accesso approvato.';
     if(isAdmin)await renderAdmin();
    }else{
     stopSync();flushSync=null;try{localStorage.removeItem('fk-approved-uid')}catch(e){}
     showGate(state==='rejected'?'La richiesta è stata rifiutata. Contatta l’amministratore.':'Richiesta inviata. In attesa dell’approvazione dell’amministratore.');
    }
   }catch(e){
    if(current!==sequence)return;
    // Senza connessione: se questo account era già approvato su questo dispositivo, l'app resta utilizzabile
    // e le modifiche vengono inviate al cloud appena torna la rete.
    let known=false;try{known=localStorage.getItem('fk-approved-uid')===user.uid}catch(x){}
    if(known&&(!navigator.onLine||e?.code==='unavailable'||/offline/i.test(e?.message||''))){
     flushSync=await startSync({db,F,user});showApp();status.textContent='Offline: dati salvati sul dispositivo.';
     window.addEventListener('online',()=>refreshSession(auth.currentUser),{once:true});
     return;
    }
    showGate('Impossibile verificare i permessi.');report(e);
   }
  }
  async function renderAdmin(){
   try{const mod=await import('./js/admin.js?v=20261125h');mod.mountAdmin({db,F,me:auth.currentUser?.uid,messages})}
   catch(e){console.error('FIT KORE admin:',e)}
  }
  // Il vecchio modulo dimostrativo aveva un listener che non invia dati: lo sostituiamo.
  const replacement=form.cloneNode(true);form.replaceWith(replacement);
  replacement.addEventListener('submit',async event=>{
   event.preventDefault();
   const email=$('kore-access-email').value.trim(),password=$('kore-access-password').value;
   const register=$('kore-tab-register').getAttribute('aria-selected')==='true';
   const submit=$('kore-access-submit');submit.disabled=true;
   status.textContent=register?'Creazione della richiesta…':'Accesso in corso…';
   try{
    const credential=register?await A.createUserWithEmailAndPassword(auth,email,password):await A.signInWithEmailAndPassword(auth,email,password);
    await refreshSession(credential.user);
   }catch(e){report(e)}finally{submit.disabled=false;$('kore-access-password').value=''}
  });
  const google=$('kore-google-login').cloneNode(true);$('kore-google-login').replaceWith(google);
  // Google come accesso principale: in alto, con le condizioni subito sotto; email come alternativa.
  {
   const panel=document.querySelector('.kore-access-panel'),tabs=panel?.querySelector('.kore-access-tabs');
   if(panel&&tabs){
    google.className='kore-access-google';
    google.innerHTML='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span>Continua con Google</span>';
    const hint=document.createElement('p');hint.className='kore-google-hint';hint.textContent='Consigliato: nessuna password da ricordare. Funziona sia per entrare sia per iscriverti.';
    const divider=document.createElement('div');divider.className='kore-or';divider.innerHTML='<span>oppure con email</span>';
    panel.insertBefore(google,tabs);google.after(hint);hint.after(termsLabel);termsLabel.after(divider);
   }
  }
  google.addEventListener('click',async()=>{
   google.disabled=true;status.textContent='Accesso Google in corso…';
   try{const credential=await A.signInWithPopup(auth,new A.GoogleAuthProvider());await refreshSession(credential.user)}
   catch(e){report(e)}finally{google.disabled=false}
  });
  // La schermata di attesa resta consultabile e consente di cambiare account.
  A.onAuthStateChanged(auth,user=>{refreshSession(user)});
  // Dopo aver spuntato le condizioni, completa la richiesta per l'account già collegato.
  $('kore-terms').addEventListener('change',e=>{if(e.target.checked&&auth.currentUser)refreshSession(auth.currentUser)});
 }catch(error){
  console.error('FIT KORE: impossibile inizializzare Firebase',error);
  const status=document.getElementById('kore-access-status');
  if(status)status.textContent='Firebase non disponibile: controlla connessione e configurazione.';
 }
}
