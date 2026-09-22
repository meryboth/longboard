// Garage: choose a rider and a board. Two glass screens over the paused run.
// Art comes from art/comfyui-riders.mjs; until an image exists the card shows its initials.
export const RIDERS=[
 {id:'tomi',name:'Tomi',tag:'El de siempre'},
 {id:'killa',name:'Killa',tag:'De la Quebrada'},
 {id:'ale',name:'Ale',tag:'Estilo propio'},
 {id:'ramon',name:'Ramón',tag:'Veterano del downhill'},
 {id:'nia',name:'Nia',tag:'Velocidad pura'}
];
export const BOARDS=[
 {id:'cardonal',name:'Cardonal',shape:'Pintail',length:'42"',style:'Carving',wheels:'#e0773f'},
 {id:'siete',name:'Siete Colores',shape:'Drop-through',length:'40"',style:'Freeride',wheels:'#9b5fa8'},
 {id:'garza',name:'Garza',shape:'Dancer',length:'46"',style:'Dancing',wheels:'#e8d7b8'},
 {id:'faroles',name:'Faroles',shape:'Cruiser',length:'38"',style:'Ciudad',wheels:'#f2c46b'},
 {id:'tejido',name:'Tejido',shape:'Drop-through',length:'40"',style:'Freeride',wheels:'#c7443b'},
 {id:'condor',name:'Cóndor',shape:'Pintail',length:'42"',style:'Carving',wheels:'#3d3a36'}
];
const KEY='deriva.garage';
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&RIDERS.some(r=>r.id===v.rider)&&BOARDS.some(b=>b.id===v.board))return v;}catch{}return {rider:'tomi',board:'cardonal'};}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
export const currentGear=load;

export function createGarage({button,onOpen,onClose,onChange}){
 let choice=load(),step=0;
 document.body.insertAdjacentHTML('beforeend',`<div class="garage" id="garage" hidden role="dialog" aria-modal="true" aria-labelledby="garage-title">
  <div class="garage-panel glass">
   <div class="garage-top"><ol class="garage-steps"><li id="step-0">Rider</li><li id="step-1">Tabla</li></ol><button class="glass icon" id="garage-close" aria-label="Cerrar"><span aria-hidden="true">✕</span></button></div>
   <h2 id="garage-title"></h2><p class="garage-sub" id="garage-sub"></p>
   <div class="garage-grid" id="garage-grid" role="radiogroup"></div>
   <div class="garage-bottom"><button class="text-button" id="garage-back">Volver</button><button class="primary" id="garage-next"></button></div>
  </div></div>`);
 const $=id=>document.getElementById(id),root=$('garage'),grid=$('garage-grid');
 const art=(src,label,cls)=>`<span class="garage-art ${cls}"><img src="${src}" alt="" onerror="this.remove()"><em aria-hidden="true">${label}</em></span>`;
 function render(){
   const riders=step===0,list=riders?RIDERS:BOARDS,selected=riders?choice.rider:choice.board;
   $('garage-title').textContent=riders?'Elegí tu rider':'Elegí tu tabla';
   $('garage-sub').textContent=riders?'Cada rider baja con su estilo. Podés cambiarlo cuando quieras.':'Todas las tablas están diseñadas para Deriva. La elegida se ve bajo tus pies.';
   $('step-0').className=riders?'on':'done';$('step-1').className=riders?'':'on';
   $('garage-back').hidden=riders;$('garage-next').textContent=riders?'Siguiente: la tabla →':'Listo, a rodar ↗';
   grid.className='garage-grid '+(riders?'riders':'boards');
   grid.innerHTML=list.map(x=>`<button class="garage-card" role="radio" aria-checked="${x.id===selected}" data-id="${x.id}">
     ${riders?art(`./assets/riders/${x.id}-portrait.webp`,x.name[0],'portrait'):art(`./assets/boards/${x.id}.webp`,x.name[0],'deck')}
     <b>${x.name}</b><small>${riders?x.tag:`${x.shape} · ${x.length} · ${x.style}`}</small>
     ${riders?'':`<i class="wheels" style="--w:${x.wheels}" aria-hidden="true"></i>`}</button>`).join('');
   grid.querySelector('[aria-checked="true"]')?.focus({preventScroll:true});
 }
 grid.addEventListener('click',e=>{const card=e.target.closest('.garage-card');if(!card)return;
   if(step===0)choice.rider=card.dataset.id;else choice.board=card.dataset.id;save(choice);onChange?.(choice);render();});
 // Arrow keys move between cards; the run's controls never see them while the garage is open.
 root.addEventListener('keydown',e=>{e.stopPropagation();
   if(e.key==='Escape'){close();return;}
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const cards=[...grid.children],i=cards.indexOf(document.activeElement);
     const next=cards[(Math.max(0,i)+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+cards.length)%cards.length];next.focus();next.click();}});
 root.addEventListener('keyup',e=>e.stopPropagation());
 $('garage-next').onclick=()=>{if(step===0){step=1;render();}else close();};
 $('garage-back').onclick=()=>{step=0;render();};
 $('garage-close').onclick=()=>close();
 function open(){step=0;root.hidden=false;document.body.classList.add('in-garage');onOpen?.();render();}
 function close(){root.hidden=true;document.body.classList.remove('in-garage');onClose?.(choice);button.focus();}
 button.onclick=open;
 return {open,close,get choice(){return choice;}};
}
