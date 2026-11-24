(function(){
/* Make the illustrative chart honest about its data source. */
const graph=document.querySelector('#dashboard .kore-graph-top span:first-child');
if(graph)graph.textContent='GRAFICO DIMOSTRATIVO';
const nav=document.querySelector('.nav');
if(nav){nav.querySelectorAll('button[data-page]').forEach(button=>{
button.setAttribute('aria-label','Apri '+button.textContent.trim());
button.setAttribute('aria-current',button.classList.contains('active')?'page':'false');
button.addEventListener('click',()=>{nav.querySelectorAll('button[data-page]').forEach(item=>item.setAttribute('aria-current',item===button?'page':'false'))});
})}
})();
