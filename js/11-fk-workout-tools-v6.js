(function(){
const training=document.getElementById('allenamenti');if(!training)return;
const panel=document.createElement('article');panel.className='fk-workout-tools';
panel.innerHTML='<h3>PIANI RAPIDI</h3><p>Seleziona un programma: compila la sessione, poi registrala quando l’hai completata.</p><div class="fk-routine-grid" id="fk-routines"></div><p id="fk-routine-feedback" role="status"></p><hr style="border:0;border-top:1px solid #293632;margin:18px 0"><h3>TIMER RECUPERO</h3><p>Un timer semplice per le pause tra le serie. Funziona finché la pagina rimane aperta.</p><div class="fk-timer-presets"><button type="button" data-seconds="30">30 sec</button><button type="button" data-seconds="60">60 sec</button><button type="button" data-seconds="90">90 sec</button></div><div class="fk-timer-clock" id="fk-timer-clock" aria-live="off">01:00</div><div class="fk-timer-controls"><button type="button" id="fk-timer-toggle">AVVIA</button><button type="button" id="fk-timer-reset">RESET</button></div><p id="fk-timer-feedback" role="status"></p>';
training.insertBefore(panel,training.querySelector('.grid'));
const routines=[['FULL BODY',45],['HIIT EXPRESS',20],['MOBILITÀ',15],['CARDIO',30],['FORZA',50],['CORE',15]];
for(const [name,minutes] of routines){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>{document.getElementById('workout').value=name;document.getElementById('minutes').value=minutes;document.getElementById('fk-routine-feedback').textContent=name+' · '+minutes+' min selezionati. Registra solo dopo averli completati.'};document.getElementById('fk-routines').append(b)}
let duration=60,remaining=60,deadline=0,tick=null;
const clock=document.getElementById('fk-timer-clock'),toggle=document.getElementById('fk-timer-toggle'),feedback=document.getElementById('fk-timer-feedback');
function display(){clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0')}
function pause(){if(tick){clearInterval(tick);tick=null;remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000))}toggle.textContent='AVVIA';display()}
function update(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));display();if(remaining===0){pause();feedback.textContent='Recupero completato. Pronto per la prossima serie!';if(navigator.vibrate)navigator.vibrate([120,80,120])}}
toggle.onclick=()=>{if(tick){pause();feedback.textContent='Timer in pausa.';return}if(remaining===0)remaining=duration;deadline=Date.now()+remaining*1000;tick=setInterval(update,200);toggle.textContent='PAUSA';feedback.textContent='Recupero in corso.';update()};
document.getElementById('fk-timer-reset').onclick=()=>{pause();remaining=duration;display();feedback.textContent='Timer azzerato.'};
panel.querySelectorAll('[data-seconds]').forEach(b=>b.onclick=()=>{pause();duration=Number(b.dataset.seconds);remaining=duration;display();feedback.textContent='Recupero impostato a '+duration+' secondi.'});
display();
})();
