(function(){
const dashboard=document.getElementById('dashboard');if(!dashboard)return;
const welcome=dashboard.querySelector('.hx-welcome');if(welcome&&!dashboard.querySelector('.fk-titanium-label')){const label=document.createElement('div');label.className='fk-titanium-label';label.textContent='TITANIUM EDGE · V2';welcome.parentNode.insertBefore(label,welcome)}
document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#39434b');
})();
