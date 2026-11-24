(function(){
const panel=document.querySelector('#alimentazione .fk-nutrition');if(!panel||document.getElementById('fk-nutrition-export'))return;
const button=document.createElement('button');button.type='button';button.id='fk-nutrition-export';button.textContent='ESPORTA DIARIO CSV';button.style.cssText='width:100%;margin:10px 0;background:#26353b;color:#4bff40;border:1px solid #46ff2a;border-radius:11px;padding:12px;font-weight:800';
const info=document.createElement('p');info.id='fk-export-feedback';info.setAttribute('role','status');
panel.append(button,info);
button.addEventListener('click',()=>{
try{
 const current=JSON.parse(localStorage.getItem('fk-nutrition-v1')||'{}');
 const archive=JSON.parse(localStorage.getItem('fk-nutrition-history-v1')||'{}');
 const days={...archive};if(current.date&&Array.isArray(current.entries))days[current.date]=current.entries;
 const rows=[['Data','Pasto','kcal','Proteine (g)','Carboidrati (g)','Grassi (g)']];
 for(const day of Object.keys(days).sort())for(const entry of (Array.isArray(days[day])?days[day]:[]))rows.push([day,entry.name||'',entry.kcal||0,entry.p||0,entry.c||0,entry.f||0]);
 if(rows.length===1){info.textContent='Non ci sono pasti dettagliati da esportare.';return}
 const csv='\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='fit-kore-alimentazione.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 info.textContent='Esportazione avviata: '+(rows.length-1)+' pasti dettagliati.';
}catch(e){info.textContent='Impossibile esportare i dati: verifica il salvataggio locale.'}
});
})();
