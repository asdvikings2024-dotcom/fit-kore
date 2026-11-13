import {firebaseConfig} from './firebase-config.js';

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
  document.head.append(css);
  if(warning)warning.textContent='Le nuove iscrizioni richiedono approvazione. Le credenziali sono gestite da Firebase.';
  const messages={
   'auth/email-already-in-use':'Email già registrata. Prova ad accedere.',
   'auth/invalid-email':'Indirizzo email non valido.',
   'auth/invalid-credential':'Email o password non valide.',
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
  signout.addEventListener('click',async()=>{try{await A.signOut(auth)}catch(e){report(e)}});
  document.querySelector('.kore-access-panel')?.append(signout);
  const memberRef=uid=>F.doc(db,'members',uid);
  async function getMember(user){
   const ref=memberRef(user.uid);let snap=await F.getDoc(ref);
   if(!snap.exists()){
    try{await F.setDoc(ref,{email:user.email,status:'pending',createdAt:F.serverTimestamp()})}
    catch(e){const retry=await F.getDoc(ref);if(!retry.exists())throw e}
    snap=await F.getDoc(ref);
   }
   return snap;
  }
  let sequence=0;
  async function refreshSession(user){
   const current=++sequence;
   $('fk-admin-panel')?.remove();
   if(!user){showGate('Accedi oppure richiedi l’iscrizione.');return}
   showGate('Verifica del tuo account in corso…');
   try{
    const [member,admin]=await Promise.all([
     getMember(user),
     F.getDoc(F.doc(db,'admins',user.uid))
    ]);
    if(current!==sequence||auth.currentUser?.uid!==user.uid)return;
    const isAdmin=admin.exists(),state=member.data()?.status;
    if(isAdmin||state==='approved'){
     showApp();
     status.textContent=isAdmin?'Accesso amministratore autorizzato.':'Accesso approvato.';
     if(isAdmin)await renderAdmin();
    }else{
     showGate(state==='rejected'?'La richiesta è stata rifiutata. Contatta l’amministratore.':'Richiesta inviata. In attesa dell’approvazione dell’amministratore.');
    }
   }catch(e){if(current===sequence){showGate('Impossibile verificare i permessi.');report(e)}}
  }
  async function renderAdmin(){
   const root=document.querySelector('#dashboard');if(!root)return;
   const panel=document.createElement('article');panel.className='fk-feature-card';panel.id='fk-admin-panel';
   panel.innerHTML='<h3>🛡️ RICHIESTE DI ISCRIZIONE</h3><p>Approva o rifiuta le nuove richieste.</p><div class="fk-feature-row"><button type="button" id="fk-admin-refresh">Aggiorna richieste</button></div><p id="fk-admin-feedback" role="status"></p><div id="fk-admin-list"></div>';
   root.append(panel);
   const load=async()=>{
    const list=$('fk-admin-list'),feedback=$('fk-admin-feedback');if(!list)return;
    list.textContent='Caricamento…';feedback.textContent='';
    try{
     const q=F.query(F.collection(db,'members'),F.where('status','==','pending'));
     const result=await F.getDocs(q);
     list.replaceChildren();
     if(result.empty){list.textContent='Nessuna richiesta in attesa.';return}
     result.forEach(snap=>{
      const row=document.createElement('div');row.className='fk-admin-row';
      const label=document.createElement('span');label.textContent=snap.data().email||snap.id;row.append(label);
      for(const [title,next] of [['Approva','approved'],['Rifiuta','rejected']]){
       const button=document.createElement('button');button.type='button';button.textContent=title;
       button.addEventListener('click',async()=>{
        if(!confirm(next==='approved'?'Approvare questa iscrizione?':'Rifiutare questa iscrizione?'))return;
        button.disabled=true;
        try{await F.updateDoc(snap.ref,{status:next,reviewedAt:F.serverTimestamp()});row.remove();feedback.textContent='Richiesta aggiornata.'}
        catch(e){button.disabled=false;feedback.textContent=messages[e?.code]||'Aggiornamento non riuscito.'}
       });
       row.append(button);
      }
      list.append(row);
     });
    }catch(e){list.textContent='Impossibile caricare le richieste.';report(e)}
   };
   $('fk-admin-refresh').onclick=load;await load();
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
  google.addEventListener('click',async()=>{
   google.disabled=true;status.textContent='Accesso Google in corso…';
   try{const credential=await A.signInWithPopup(auth,new A.GoogleAuthProvider());await refreshSession(credential.user)}
   catch(e){report(e)}finally{google.disabled=false}
  });
  // La schermata di attesa resta consultabile e consente di cambiare account.
  A.onAuthStateChanged(auth,user=>{refreshSession(user)});
 }catch(error){
  console.error('FIT KORE: impossibile inizializzare Firebase',error);
  const status=document.getElementById('kore-access-status');
  if(status)status.textContent='Firebase non disponibile: controlla connessione e configurazione.';
 }
}
