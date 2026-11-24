(function(){
const $=id=>document.getElementById(id),panel=$('fk-live-workout'),training=$('allenamenti');if(!panel||!training)return;
training.insertBefore(panel,training.querySelector('.grid'));
panel.hidden=false;
const met={'Forza':3.5,'Cardio':7,'HIIT':8,'Mobilità':2.5,'Camminata':3.5,'Full body':5};
let elapsed=0,startedAt=0,running=false,active=false,ticker=null;
try{const w=Number(localStorage.getItem('fk-live-weight-v1'));if(w>=25&&w<=300)$('fk-live-weight').value=String(w)}catch(e){}
function seconds(){return elapsed+(running?Math.max(0,(Date.now()-startedAt)/1000):0)}
function paint(){const secs=seconds(),min=Math.floor(secs/60),sec=Math.floor(secs%60);$('fk-live-clock').textContent=String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0');const weight=Number($('fk-live-weight').value);$('fk-live-calories').textContent=weight>=25&&weight<=300?String(Math.round(met[$('fk-live-type').value]*weight*secs/3600)):'—';$('fk-live-start').disabled=running||active;$('fk-live-pause').disabled=!active;$('fk-live-finish').disabled=!active;$('fk-live-pause').textContent=running?'PAUSA':'RIPRENDI';$('fk-live-type').disabled=active}
function update(){paint();if(!active&&ticker){clearInterval(ticker);ticker=null}}
$('fk-live-start').onclick=()=>{if(active)return;const weight=Number($('fk-live-weight').value);if(weight&&(!Number.isFinite(weight)||weight<25||weight>300)){$('fk-live-status').textContent='Inserisci un peso valido o lascia il campo vuoto.';return}if(weight)try{localStorage.setItem('fk-live-weight-v1',String(weight))}catch(e){}elapsed=0;startedAt=Date.now();running=true;active=true;$('fk-live-status').textContent='Allenamento in corso. Premi Pausa per fermare il tempo.';if(ticker)clearInterval(ticker);ticker=setInterval(update,500);update()};
$('fk-live-pause').onclick=()=>{if(!active)return;if(running){elapsed=seconds();running=false;$('fk-live-status').textContent='Allenamento in pausa.'}else{startedAt=Date.now();running=true;$('fk-live-status').textContent='Allenamento ripreso.'}update()};
$('fk-live-finish').onclick=()=>{if(!active)return;const secs=seconds();if(secs<30){$('fk-live-status').textContent='Per registrare una sessione servono almeno 30 secondi di attività.';return}if(!confirm('Terminare e salvare questo allenamento?'))return;const type=$('fk-live-type').value,weight=Number($('fk-live-weight').value),kcal=weight>=25&&weight<=300?Math.round(met[type]*weight*secs/3600):null;try{if(typeof state==='undefined'||typeof save!=='function')throw Error('Registro non disponibile');state.workouts.push({name:type,minutes:Math.max(1,Math.round(secs/60)),durationSeconds:Math.round(secs),estimatedKcal:kcal,completedAt:new Date().toISOString()});save();elapsed=0;running=false;active=false;$('fk-live-status').textContent='Sessione salvata: '+Math.round(secs/60)+' min'+(kcal!==null?' · circa '+kcal+' kcal stimate':'')+'.';update()}catch(e){$('fk-live-status').textContent='Impossibile salvare: riprova senza chiudere la pagina.'}};
$('fk-live-weight').addEventListener('input',paint);
const dashboard=$('hx-start');if(dashboard)dashboard.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(typeof page==='function')page('allenamenti');panel.scrollIntoView({behavior:'smooth',block:'start'});$('fk-live-status').textContent=active?'Sessione già in corso.':'Scegli attività e premi AVVIA per far partire il tempo.'},true);
window.addEventListener('pagehide',()=>{if(active)try{sessionStorage.setItem('fk-live-unsaved-warning','1')}catch(e){}});
update();
})();
