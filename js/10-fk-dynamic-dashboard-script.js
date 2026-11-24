(function(){
const dash=document.getElementById('dashboard'),start=document.getElementById('hx-start');if(!dash||!start)return;
const hero=dash.querySelector('.hx-hero h2');if(hero)hero.innerHTML='OGGI<br>SI SPINGE<br><em>FORTE.</em>';
const kicker=dash.querySelector('.hx-hero-copy>span');if(kicker)kicker.textContent='IL TUO MOMENTO';
const mission=document.createElement('article');mission.className='fk-mission';
mission.innerHTML='<div class="fk-mission-head"><span>⚡ MISSIONE DEL GIORNO</span><span id="fk-mission-count">0 / 1</span></div><h3 id="fk-mission-title">Completa 1 allenamento</h3><p id="fk-mission-sub">Anche 10 minuti contano. Inizia adesso.</p><div class="fk-mission-track"><div class="fk-mission-fill" id="fk-mission-fill"></div></div><button type="button" id="fk-mission-go">INIZIA LA MISSIONE ↗</button>';
start.insertAdjacentElement('afterend',mission);
const update=()=>{let count=0;try{count=Array.isArray(state?.workouts)?state.workouts.length:0}catch(e){}
const done=count>0;document.getElementById('fk-mission-count').textContent=done?'1 / 1 ✓':'0 / 1';document.getElementById('fk-mission-title').textContent=done?'MISSIONE COMPLETATA!':'Completa 1 allenamento';document.getElementById('fk-mission-sub').textContent=done?'Ottimo lavoro. Torna domani per una nuova sfida.':'Anche 10 minuti contano. Inizia adesso.';document.getElementById('fk-mission-fill').style.width=done?'100%':'0%';document.getElementById('fk-mission-go').textContent=done?'VEDI ALLENAMENTI ↗':'INIZIA LA MISSIONE ↗'};
document.getElementById('fk-mission-go').addEventListener('click',()=>document.querySelector('[data-page="allenamenti"]')?.click());
update();document.getElementById('trainform')?.addEventListener('submit',()=>setTimeout(update,0));document.getElementById('fk-undo-workout')?.addEventListener('click',()=>setTimeout(update,0));document.getElementById('fk-preset-save')?.addEventListener('click',()=>setTimeout(update,0));document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
})();
