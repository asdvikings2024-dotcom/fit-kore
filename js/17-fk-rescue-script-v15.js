(function(){
const $=id=>document.getElementById(id),root=$('fk-rescue-diary');if(!root)return;
const key='fk-nutrition-v1',types=['Colazione','Pranzo','Cena','Spuntino'],today=()=>new Date().toLocaleDateString('sv-SE');
function read(){try{const x=JSON.parse(localStorage.getItem(key)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return {}}}
function draw(){const data=read(),entries=data.date===today()&&Array.isArray(data.entries)?data.entries:[],legacy=typeof state!=='undefined'&&Array.isArray(state.meals)?state.meals.reduce((n,x)=>n+(Number(x.kcal)||0),0):0,total=entries.reduce((n,x)=>n+(Number(x.kcal)||0),legacy),goal=Number(data.goal)||2000;
$('fk-rescue-eaten').textContent=Math.round(total).toLocaleString('it-IT');$('fk-rescue-left').textContent=Math.round(goal-total).toLocaleString('it-IT');
root.querySelectorAll('.fk-rescue-meal').forEach(box=>{const type=box.dataset.meal,items=entries.map((x,i)=>({...x,index:i})).filter(x=>x.mealType===type),sum=items.reduce((n,x)=>n+(Number(x.kcal)||0),0);box.querySelector('span').textContent=Math.round(sum)+' kcal';const ul=box.querySelector('ul');ul.replaceChildren();items.forEach(x=>{const li=document.createElement('li');li.append(document.createTextNode(x.name+' · '+Math.round(x.kcal)+' kcal '));const b=document.createElement('button');b.type='button';b.textContent='Elimina';b.onclick=()=>{const latest=read();if(latest.date!==today()||!Array.isArray(latest.entries))return;latest.entries.splice(x.index,1);try{localStorage.setItem(key,JSON.stringify(latest));draw()}catch(e){$('fk-rescue-status').textContent='Impossibile salvare la modifica.'}};li.append(b);ul.append(li)})});
}
root.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{$('fk-rescue-form').hidden=false;$('fk-rescue-type').value=b.dataset.add;$('fk-rescue-heading').textContent='Aggiungi a '+b.dataset.add;$('fk-rescue-name').focus()});
$('fk-rescue-cancel').onclick=()=>{$('fk-rescue-form').hidden=true};
$('fk-rescue-form').onsubmit=e=>{e.preventDefault();const name=$('fk-rescue-name').value.trim(),kcal=Number($('fk-rescue-kcal').value),type=$('fk-rescue-type').value;if(!name||!Number.isFinite(kcal)||kcal<1||kcal>5000)return;const data=read();if(data.date!==today()){data.date=today();data.entries=[]}if(!Array.isArray(data.entries))data.entries=[];data.entries.push({name,kcal,mealType:type,p:0,c:0,f:0});try{localStorage.setItem(key,JSON.stringify(data))}catch(e){$('fk-rescue-status').textContent='Salvataggio non riuscito.';return}$('fk-rescue-form').reset();$('fk-rescue-form').hidden=true;$('fk-rescue-status').textContent='Pasto salvato.';draw();if(typeof render==='function')render()};
window.fkRescueDraw=draw;
$('fk-rescue-advanced').onclick=()=>{const panel=document.querySelector('#alimentazione .fk-nutrition');if(panel){panel.style.setProperty('display','block','important');panel.scrollIntoView({behavior:'smooth'})}};
draw();
})();
