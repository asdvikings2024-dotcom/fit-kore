import {firebaseConfig} from './firebase-config.js';
const configured=['apiKey','authDomain','projectId','appId'].every(k=>typeof firebaseConfig[k]==='string'&&firebaseConfig[k].trim());
if(configured){
 const {initializeApp}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
 const authSDK=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
 const dbSDK=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
 const app=initializeApp(firebaseConfig),auth=authSDK.getAuth(app),db=dbSDK.getFirestore(app);
 document.documentElement.classList.add('fk-auth-enabled');
 const accessStyle=document.createElement('style');accessStyle.textContent='.fk-auth-enabled:not(.fk-auth-approved) .layout{visibility:hidden;pointer-events:none}.fk-auth-enabled:not(.fk-auth-approved) #kore-access-modal{z-index:9999999}.fk-auth-enabled:not(.fk-auth-approved) #kore-access-close{display:none}.fk-auth-enabled:not(.fk-auth-approved) #kore-access-modal .kore-access-panel{max-height:92dvh}';document.head.append(accessStyle);
 const $=id=>document.getElementById(id);
 const status=$('kore-access-status'),form=$('kore-access-form');
 const warning=document.querySelector('.kore-access-warning');
 const signout=document.createElement('button');signout.type='button';signout.textContent='Esci';signout.className='kore-access-secondary';signout.addEventListener('click',()=>authSDK.signOut(auth));document.querySelector('.kore-access-panel')?.append(signout);
 if(warning)warning.textContent='L’iscrizione crea una richiesta in attesa. Le funzioni riservate restano bloccate fino all’approvazione.';
 const msg=e=>{const code=e?.code||'';status.textContent=({'auth/email-already-in-use':'Email già registrata.','auth/invalid-credential':'Credenziali non valide.','auth/popup-blocked':'Popup bloccato dal browser.','permission-denied':'Permesso negato: verifica le regole Firestore.'})[code]||'Operazione non riuscita. Riprova o contatta l’amministratore.'};
 async function ensureMember(user){const ref=dbSDK.doc(db,'members',user.uid),snap=await dbSDK.getDoc(ref);if(!snap.exists())await dbSDK.setDoc(ref,{email:user.email,status:'pending',createdAt:dbSDK.serverTimestamp()});return await dbSDK.getDoc(ref)}
 async function showSession(user){
  if(!user){document.documentElement.classList.remove('fk-auth-approved');$('kore-access-modal').hidden=false;status.textContent='Accedi o richiedi iscrizione.';return}
  const member=await ensureMember(user);
  const adminSnap=await dbSDK.getDoc(dbSDK.doc(db,'admins',user.uid)).catch(()=>null);
  const isAdmin=!!adminSnap?.exists();
  const approved=member.data()?.status==='approved'||isAdmin;
  status.textContent=isAdmin?'Accesso amministratore attivo.':approved?'Account approvato.':'Richiesta '+(member.data()?.status==='rejected'?'rifiutata.':'in attesa di approvazione.');
  document.body.dataset.koreAccess=approved?'approved':'pending';
  document.documentElement.classList.toggle('fk-auth-approved',approved);
  $('kore-access-modal').hidden=approved;
  if(!approved)document.body.style.overflow='';
  $('fk-admin-panel')?.remove();
  if(isAdmin)await adminPanel();
 }
 async function adminPanel(){
  const panel=document.createElement('section');panel.id='fk-admin-panel';panel.className='fk-feature-card';
  panel.innerHTML='<h3>🛡️ APPROVAZIONE ISCRIZIONI</h3><p>Solo gli amministratori autorizzati possono approvare o rifiutare.</p><div id="fk-admin-list">Caricamento…</div>';
  document.querySelector('#dashboard')?.append(panel);
  const q=dbSDK.query(dbSDK.collection(db,'members'),dbSDK.where('status','==','pending'));
  const snap=await dbSDK.getDocs(q);const list=$('fk-admin-list');list.replaceChildren();
  if(snap.empty){list.textContent='Nessuna richiesta in attesa.';return}
  snap.forEach(docSnap=>{
   const row=document.createElement('div');row.className='fk-feature-row';const name=document.createElement('span');name.textContent=docSnap.data().email||docSnap.id;row.append(name);
   for(const [label,value] of [['Approva','approved'],['Rifiuta','rejected']]){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.onclick=async()=>{b.disabled=true;try{await dbSDK.updateDoc(docSnap.ref,{status:value,reviewedAt:dbSDK.serverTimestamp()});row.remove()}catch(e){b.disabled=false;msg(e)}};row.append(b)
   }list.append(row)
  });
 }
 // Sostituisce i gestori dimostrativi precedenti senza cambiare il layout.
 const oldForm=form.cloneNode(true);form.replaceWith(oldForm);
 oldForm.addEventListener('submit',async e=>{
  e.preventDefault();const email=$('kore-access-email').value.trim(),password=$('kore-access-password').value;
  const register=$('kore-tab-register').getAttribute('aria-selected')==='true';
  try{const result=register?await authSDK.createUserWithEmailAndPassword(auth,email,password):await authSDK.signInWithEmailAndPassword(auth,email,password);await showSession(result.user)}
  catch(err){msg(err)}finally{$('kore-access-password').value=''}
 });
 const google=$('kore-google-login').cloneNode(true);$('kore-google-login').replaceWith(google);
 google.onclick=async()=>{try{const result=await authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider());await showSession(result.user)}catch(e){msg(e)}};
 authSDK.onAuthStateChanged(auth,user=>{showSession(user).catch(msg)});
}
