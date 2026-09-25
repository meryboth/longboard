import * as THREE from './vendor/three.module.js';

// Light follows the real sun at the player's chosen location: day, golden hour, blue hour and night
// blend continuously with the sun's elevation. The header widget sets the location.
const DEFAULT={name:'Purmamarca',lat:-23.745,lon:-65.498,tz:'America/Argentina/Jujuy'};
const KEY='deriva.location';
const rad=Math.PI/180;

// Solar elevation in degrees (NOAA simplified; good to a fraction of a degree).
export function sunElevation(date,lat,lon){
 const d=date.getTime()/86400000+2440587.5-2451545;
 const g=(357.529+.98560028*d)*rad,q=280.459+.98564736*d;
 const L=(q+1.915*Math.sin(g)+.02*Math.sin(2*g))*rad,e=(23.439-.00000036*d)*rad;
 const ra=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L)),dec=Math.asin(Math.sin(e)*Math.sin(L));
 const gmst=((18.697374558+24.06570982441908*d)%24+24)%24;
 const h=(gmst*15+lon)*rad-ra;
 return Math.asin(Math.sin(lat*rad)*Math.sin(dec)+Math.cos(lat*rad)*Math.cos(dec)*Math.cos(h))/rad;
}

// Keyframes by sun elevation: colours of sun/moon, ambient, panorama tint and painted sprites.
const KEYS=[
 {el:-12,sun:'#8f9fd8',power:.32,hemi:.3,sky:'#2a3558',tint:'#3b4577',sprite:'#56608a',night:1},
 {el:-6,sun:'#a79ad8',power:.55,hemi:.6,sky:'#5a5a8c',tint:'#7d78a8',sprite:'#8c86b2',night:.8},
 {el:-1,sun:'#e0a6c8',power:1.1,hemi:1.3,sky:'#b9a6c8',tint:'#c6afd0',sprite:'#d6c3dc',night:.25},
 {el:4,sun:'#ffc98a',power:1.9,hemi:1.8,sky:'#f0d2b0',tint:'#f6d6b8',sprite:'#f3dcc6',night:0},
 {el:14,sun:'#fff2d0',power:2.5,hemi:2.4,sky:'#dbe6de',tint:'#ffffff',sprite:'#ffffff',night:0}];
const colours=['sun','sky','tint','sprite'];
export function lightingAt(el){
 const e=Math.min(KEYS.at(-1).el,Math.max(KEYS[0].el,el));
 const next=KEYS.findIndex(x=>x.el>e),i=Math.min(KEYS.length-2,Math.max(0,(next<0?KEYS.length:next)-1)),a=KEYS[i],b=KEYS[i+1];
 const t=(e-a.el)/(b.el-a.el),out={elevation:el};
 for(const c of colours)out[c]=new THREE.Color(a[c]).lerp(new THREE.Color(b[c]),t);
 for(const n of ['power','hemi','night'])out[n]=a[n]+(b[n]-a[n])*t;
 return out;
}

function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&isFinite(v.lat)&&isFinite(v.lon))return v;}catch{}return DEFAULT;}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
const clock=(date,tz)=>{try{return new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:tz}).format(date);}catch{return new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);}};
// ?hora=21:30 previews that local time at the chosen place (for reviewing the night scene).
function tzOffsetMinutes(tz,date){try{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(date).map(x=>[x.type,x.value]));
 return (Date.UTC(+p.year,p.month-1,+p.day,+p.hour,+p.minute)-date.getTime())/60000;}catch{return -date.getTimezoneOffset();}}
const preview=new URLSearchParams(location.search).get('hora');
function now(place){const date=new Date();if(!preview||!/^\d{1,2}:\d{2}$/.test(preview))return date;
 const [h,m]=preview.split(':').map(Number),off=tzOffsetMinutes(place.tz,date),local=new Date(date.getTime()+off*60000);
 local.setUTCHours(h,m,0,0);return new Date(local.getTime()-off*60000);}

export function createDaylight({mount,onChange}){
 let place=load();
 mount.insertAdjacentHTML('afterbegin',`<div class="place"><button class="glass" id="place-toggle" aria-expanded="false" aria-controls="place-panel"><span aria-hidden="true">◷</span> <b id="place-clock">--:--</b> <span id="place-name"></span></button>
  <div class="place-panel glass" id="place-panel" hidden><p class="place-title">Tu ubicación</p><p class="place-copy">La luz del juego sigue la hora real del lugar que elijas.</p>
  <form id="place-form"><input id="place-query" type="search" placeholder="Buscar ciudad" autocomplete="off" aria-label="Buscar ciudad"><button class="glass" type="submit">Buscar</button></form>
  <ul id="place-results"></ul><button class="glass place-geo" id="place-geo" type="button">Usar mi ubicación</button><p id="place-status" class="place-status" role="status"></p></div></div>`);
 const $=id=>document.getElementById(id),panel=$('place-panel'),toggle=$('place-toggle');
 // El botín se esconde mientras el panel está abierto: en el teléfono ocupan el mismo lugar.
 const open=v=>{panel.hidden=!v;toggle.setAttribute('aria-expanded',String(v));document.body.classList.toggle('place-open',v);if(v)$('place-query').focus();};
 toggle.onclick=()=>open(panel.hidden);
 // Typing a city must not steer, brake or pause the board.
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){open(false);toggle.focus();}});
 panel.addEventListener('keyup',e=>e.stopPropagation());
 const choose=p=>{place=p;save(p);$('place-status').textContent='';open(false);tick(true);};
 $('place-form').onsubmit=async e=>{e.preventDefault();const q=$('place-query').value.trim();if(!q)return;const list=$('place-results');list.innerHTML='';$('place-status').textContent='Buscando…';
  try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=es&name=${encodeURIComponent(q)}`);const data=await r.json();
   const results=data.results||[];$('place-status').textContent=results.length?'':'No encontramos ese lugar. Probá con otro nombre.';
   for(const x of results){const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=[x.name,x.admin1,x.country].filter(Boolean).join(', ');
    b.onclick=()=>choose({name:x.name,lat:x.latitude,lon:x.longitude,tz:x.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone});li.append(b);list.append(li);}}
  catch{$('place-status').textContent='No pudimos buscar ahora. Revisá la conexión e intentá de nuevo.';}};
 $('place-geo').onclick=()=>{if(!navigator.geolocation){$('place-status').textContent='Este navegador no comparte la ubicación.';return;}
  $('place-status').textContent='Pidiendo permiso…';
  navigator.geolocation.getCurrentPosition(p=>choose({name:'Tu ubicación',lat:p.coords.latitude,lon:p.coords.longitude,tz:Intl.DateTimeFormat().resolvedOptions().timeZone}),
   ()=>{$('place-status').textContent='Sin permiso de ubicación. Podés buscar una ciudad.';},{timeout:10000,maximumAge:600000});};
 let last=0;
 function tick(force){const t=performance.now();if(!force&&t-last<15000)return;last=t;
  const date=now(place);$('place-clock').textContent=clock(date,place.tz);$('place-name').textContent=place.name;
  onChange(lightingAt(sunElevation(date,place.lat,place.lon)));}
 tick(true);
 return {update:()=>tick(false)};
}
