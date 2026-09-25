import * as THREE from './vendor/three.module.js';
import {createRider} from './rider-poses.js';
import {createWalls} from './walls.js';
import {createCollectibles} from './collectibles.js';
import {createCityBackdrop} from './city-backdrop.js';
import {createTown,townMask,inTown} from './town.js';
import {createScenery} from './scenery.js';
import {createDaylight} from './daylight.js';
import {createStreetlights} from './streetlights.js';
import {createGarage,currentGear,BOARDS} from './garage.js';
import {createBoard} from './board.js';
import {createLlamas,GAP} from './llamas.js';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color('#dbe6de');scene.fog=new THREE.Fog('#dbe6de',90,420);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#dbe6de');$('world').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,650);
scene.add(new THREE.HemisphereLight('#fff5d8','#6e8472',2.4));const sun=new THREE.DirectionalLight('#fff2d0',2.5);sun.position.set(-55,80,-30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.far=180;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
const materials={};function mat(color){return materials[color]??=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});}
function mesh(geo,color,parent=scene){const m=new THREE.Mesh(geo,mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,color,parent){return mesh(new THREE.BoxGeometry(w,h,d),color,parent);}
const roadX=s=>Math.sin(s*.007)*22+Math.sin(s*.019)*7;
const roadY=s=>-s*.07+Math.sin(s*.012)*1.5;
// Terrain height beside the road: a gentle hillside that falls away toward the valley so the painted panorama stays visible.
// Inside the town the valley floor flattens so the grid of blocks sits level with the main street.
const groundY=(s,x)=>{const t=townMask(s);return roadY(s)-.15+(1-t)*(Math.sin(s*.025+x*.08)*Math.max(0,Math.abs(x)-7)*.03+Math.max(0,-x-18)*.07)-Math.max(0,Math.abs(x)-60-45*t)*.16;};
const slope=s=>(roadX(s+.5)-roadX(s-.5));
const length=2400,width=11;
function ribbon(left,right,color,yOffset=0){const vertices=[],indices=[];for(let i=-60;i<=length+380;i+=4){for(const x of [left,right])vertices.push(roadX(i)+x,roadY(i)+yOffset,-i);}for(let i=0;i<vertices.length/3-2;i+=2)indices.push(i,i+1,i+2,i+1,i+3,i+2);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=mesh(g,color);m.castShadow=false;return m;}
ribbon(-width/2,width/2,'#6d7773',.02);ribbon(-6.1,-5.5,'#c6c3a9',.025);ribbon(5.5,6.1,'#c6c3a9',.025);ribbon(-5.13,-5.02,'#e2d9b5',.04);ribbon(5.02,5.13,'#e2d9b5',.04);
for(let s=-40;s<length+300;s+=13){const m=box(.10,.025,4,'#e5d5a2');m.position.set(roadX(s),roadY(s)+.045,-s);m.rotation.y=-Math.atan(slope(s));}
// Deterministic scenery keeps each attempt comparable.
let seed=197;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const terrainVertices=[],terrainIndices=[],terrainColors=[],terrainUvs=[];const grass=new THREE.Color();const columns=[-200,-100,-55,-28,-14,-6.15,6.15,14,28,55,100,200];
for(let s=-80;s<=length+400;s+=12){for(const x of columns){const h=groundY(s,x);terrainVertices.push(roadX(s)+x,h,-s);terrainUvs.push(x/14,s/14);grass.set(x>20?'#a9b995':'#afba93');grass.multiplyScalar(.91+rand()*.18);terrainColors.push(grass.r,grass.g,grass.b);}}
for(let i=0;i<terrainVertices.length/3-columns.length;i++){if(i%columns.length===columns.length-1||i%columns.length===5)continue;terrainIndices.push(i,i+1,i+columns.length,i+1,i+columns.length+1,i+columns.length);}
const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(terrainVertices,3));tg.setAttribute('color',new THREE.Float32BufferAttribute(terrainColors,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(terrainUvs,2));tg.setIndex(terrainIndices);tg.computeVertexNormals();const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
const trees=[],rocks=[];const treeGeo=new THREE.ConeGeometry(1,1,5);const trunkGeo=new THREE.CylinderGeometry(.12,.2,1,5);
for(let i=0;i<170;i++){const s=rand()*(length+300)-50;const side=rand()>.5?1:-1;const x=side*(15+rand()*65);const h=3+rand()*6;const y=groundY(s,x);const group=new THREE.Group();group.position.set(roadX(s)+x,y,-s);scene.add(group);const trunk=mesh(trunkGeo,'#80755b',group);trunk.scale.y=h*.5;trunk.position.y=h*.22;const tree=mesh(new THREE.IcosahedronGeometry(1,0),['#536f5b','#648065','#728a68'][i%3],group);tree.scale.set(h*.45,h*.55,h*.4);tree.position.y=h*.7;trees.push({group,h,s,x});}
for(let i=0;i<85;i++){const s=rand()*(length+300);const x=(rand()>.5?1:-1)*(9+rand()*32);const rock=mesh(new THREE.DodecahedronGeometry(1,0),'#999e8b');rock.position.set(roadX(s)+x,groundY(s,x),-s);rock.scale.set(1+rand()*3,1+rand()*2,1+rand()*2);rock.rotation.set(rand(),rand(),rand());rocks.push({mesh:rock,size:rock.scale.x,s,x});}
for(let s=0;s<length+220;s+=22){for(const side of [-1,1]){const post=box(.13,.9,.14,'#e5e0c7');post.position.set(roadX(s)+side*5.85,roadY(s)+.45,-s);const top=box(.15,.18,.16,'#df8054');top.position.copy(post.position);top.position.y+=.25;}}
const cityBackdrop=createCityBackdrop(scene,'./assets/scenery/quebrada-v2.jpg');
const scenery=createScenery(scene,{terrain,trees,rocks,hide:inTown});
// The old roadside houses consumed rand() here; keep the calls so cones and collectibles stay put.
for(let s=-25;s<length+260;s+=28)for(let i=0;i<6;i++)rand();
createTown(scene,{roadX,groundY,scenery});
const poles=[];for(let s=-30;s<length+200;s+=40){const px=roadX(s)-6.9,py=roadY(s);poles.push({s,x:px,y:py});const pole=box(.16,8,.16,'#5f6458');pole.position.set(px,py+4,-s);const cross=box(2.3,.13,.15,'#5f6458');cross.position.set(px,py+7.5,-s);for(const offset of [-.8,.8]){const points=[];for(let j=0;j<=12;j++){const t=j/12;points.push(new THREE.Vector3(THREE.MathUtils.lerp(px,roadX(s+40)-6.9,t)+offset,THREE.MathUtils.lerp(py,roadY(s+40),t)+7.5-Math.sin(t*Math.PI)*1.1,-s-t*40));}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#586359'})));}}
const streetlights=createStreetlights(scene,{poles,roadX,roadY});
let lensIndex=0;
// Light follows the real time of day at the chosen location (daylight.js); there is no manual day/night switch.
const hemi=scene.children.find(c=>c.isHemisphereLight),backdropTint=new THREE.Color('#ffffff');
let llamas=null,spriteTint=null;
const daylight=createDaylight({mount:document.querySelector('.topright'),onChange(l){
 sun.color.copy(l.sun);sun.intensity=l.power;hemi.intensity=l.hemi;scene.background.copy(l.sky);scene.fog.color.copy(l.sky);
 backdropTint.copy(l.tint);scenery.setTint(l.sprite);spriteTint=l.sprite;llamas?.setTint(l.sprite);streetlights.setNight(l.night);document.body.classList.toggle('night',l.night>.5);}});
$('lens').onclick=()=>{lensIndex=(lensIndex+1)%2;notify(lensIndex?'CÁMARA ABIERTA':'CÁMARA CERCANA');};
const rider=new THREE.Group();scene.add(rider);const riderModel=createRider();const board=createBoard();rider.add(board.root,riderModel.root);
// The garage choice (saved in localStorage) dresses the rider and the board; changes apply live.
function wear({rider:id,board:deck}){riderModel.setRider(id);board.setBoard(BOARDS.find(b=>b.id===deck));}
wear(currentGear());
// Llamas cross the road where the cones used to stand. Same rand() sequence, so the collectibles stay put.
// In town they wait on the pavement; on the cuesta, out in the field behind the pircas, which open where they cross.
const llamaSpots=[];for(let s=140;s<length-80;s+=100+rand()*80){const lane=(rand()-.5)*7.2;llamaSpots.push({s,lane,edge:townMask(s)>.05?5.8:9});}
createWalls(scene,{length,roadX,roadY,skip:s=>townMask(s)>.05||llamaSpots.some(p=>Math.abs(p.s-s)<GAP),texture:'./assets/walls/pirca-v1.jpg',height:1.05,tile:3.1});
llamas=createLlamas(scene,{positions:llamaSpots,roadX,roadY});if(spriteTint)llamas.setTint(spriteTint);const obstacles=llamas.obstacles;
const finish=new THREE.Group();scene.add(finish);finish.position.set(roadX(length),roadY(length),-length);for(const x of [-5.5,5.5]){const pole=box(.12,5,.12,'#e6ddba',finish);pole.position.set(x,2.5,0);}for(let i=0;i<16;i++)for(let j=0;j<2;j++){const tile=box(11/16,.36,.08,(i+j)%2?'#2b4034':'#eee9d2',finish);tile.position.set(-5.5+(i+.5)*11/16,4.5+j*.36,0);}
const keys=new Set();let state='intro',distance=0,speed=0,lateral=0,lateralV=0,flow=0,elapsed=0,steer=0,invincible=0,toastTime=0,sound=false,audioCtx,osc,gain;
const collectibles=createCollectibles(scene,{length,roadX,roadY,obstacles,onCollect(item,kind,collection){notify(item.bonus?'COMBO COMPLETO · +250 EXTRA':kind.label+' · +'+kind.points);syncCollection(collection);}});
function syncCollection(collection=collectibles.getState()){for(const type of ['pancho','disco','sticker'])$('count-'+type).textContent=collection.counts[type];$('collection-hint').textContent=collection.sets?collection.sets+' combos completos · seguí coleccionando':'Uno de cada uno = +250 de combo';}
const clamp=THREE.MathUtils.clamp;const smooth=THREE.MathUtils.damp;
function notify(text){$('message').textContent=text;$('message').style.opacity=1;toastTime=2;}
// ?desde=700 starts the run further down (for reviewing the scenery).
const startAt=Math.max(0,Number(new URLSearchParams(location.search).get('desde'))||0);
// Review hook for captures, only when ?desde= is present.
if(new URLSearchParams(location.search).has('desde'))window.__deriva={renderer,scene,camera,rider,riderModel,board,get llamas(){return llamas;},step:()=>frame()};
function reset(){collectibles.reset();syncCollection();steer=0;distance=startAt;speed=7;lateral=0;lateralV=0;flow=0;elapsed=0;invincible=0;llamas.reset();keys.clear();state='playing';document.body.classList.add('playing');$('modal').hidden=true;camera.position.set(roadX(startAt),roadY(startAt)+3.5,-startAt+6.5);}
function pause(){if(state==='intro'||state==='finished'||state==='garage')return;if(state==='paused'){state='playing';$('modal').hidden=true;}else{state='paused';keys.clear();$('modal-kicker').textContent='TOMATE UN RESPIRO';$('modal-title').textContent='En pausa.';$('modal-copy').textContent='El pueblo te espera.';$('resume').textContent='SEGUIR RODANDO ↗';$('modal').hidden=false;}}
$('restart').onclick=reset;$('resume').onclick=()=>state==='finished'?reset():pause();$('pause').onclick=pause;let beforeGarage='playing';createGarage({button:$('garage-open'),onOpen(){beforeGarage=state;if(state==='playing'||state==='paused'){state='garage';keys.clear();$('modal').hidden=true;}},onClose(){if(state==='garage')state=beforeGarage==='paused'?'playing':beforeGarage;},onChange:wear});
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyP'||e.code==='Escape')pause();if(e.code==='Enter'&&state==='intro')reset();if(e.code==='KeyR'&&state!=='intro')reset();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));});
$('sound').onclick=()=>{try{if(!audioCtx){audioCtx=new AudioContext();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='triangle';osc.connect(gain);gain.connect(audioCtx.destination);gain.gain.value=0;osc.start();}audioCtx.resume();sound=!sound;$('sound').classList.toggle('off',!sound);$('sound').setAttribute('aria-pressed',String(sound));}catch{notify('SONIDO NO DISPONIBLE');}};
function end(){state='finished';keys.clear();$('modal-kicker').textContent='BARRIO EN BAJADA / COMPLETADO';$('modal-title').textContent='Linda bajada.';$('modal-copy').textContent=`2,4 km · ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')} · ${Math.floor(flow)} puntos de flow · ${collectibles.getState().counts.pancho} panchos · ${collectibles.getState().counts.disco} discos · ${collectibles.getState().counts.sticker} stickers`;$('resume').textContent='OTRA BAJADA ↗';$('modal').hidden=false;}
const clock=new THREE.Clock();const cameraTarget=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);frame();}
// One frame of the game. The review hook can call it by hand: hidden tabs stop requestAnimationFrame.
function frame(){const dt=Math.min(clock.getDelta(),.04);const active=state==='playing';const braking=keys.has('Space')||keys.has('ArrowDown')||keys.has('KeyS');
if(active){const previousDistance=distance,previousLane=lateral;elapsed+=dt;const input=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));steer=smooth(steer,input,7,dt);const pushing=keys.has('ArrowUp')||keys.has('KeyW');speed=clamp(speed+(2.2+(pushing?3.5:0)-speed*.095-(braking?8:0))*dt,2,26);lateralV=smooth(lateralV,steer*(2.4+speed*.19)*(braking?1.25:1),5,dt);lateral+=lateralV*dt;distance+=speed*dt;invincible=Math.max(0,invincible-dt);
if(Math.abs(lateral)>5){speed=Math.max(3,speed-11*dt);lateral=clamp(lateral,-6,6);if(invincible<=0){notify('BANQUINA · VOLVÉ AL ASFALTO');invincible=1.5;}}
if(Math.abs(steer)>.25&&Math.abs(lateral)<4.8)flow+=dt*speed*(braking?2.5:1);for(const o of obstacles){if(!o.hit&&Math.abs(o.s-distance)<1.1&&Math.abs(o.lane-lateral)<o.halfWidth){llamas.spook(o);speed*=.45;flow=Math.max(0,flow-100);invincible=1;notify('LLAMA · −100 FLOW');}}
flow+=collectibles.collect(previousDistance,distance,previousLane,lateral);if(distance>=length){distance=length;end();}}
else if(state==='intro'){steer=Math.sin(clock.elapsedTime*.7)*.13;}
const s=distance;const x=roadX(s)+lateral,y=roadY(s);rider.position.set(x,y+.05,-s);rider.rotation.y=-Math.atan(slope(s))-steer*(braking?.5:.17);rider.rotation.x=-.07;riderModel.animate(elapsed,steer,braking,active,speed);rider.updateMatrixWorld();board.animate(active?dt:0,speed,steer,riderModel.contacts(camera),camera);
if(state==='intro'){cameraTarget.set(x-2.8,y+4.8,-s+9);camera.position.lerp(cameraTarget,1-Math.exp(-dt*3));camera.lookAt(x+2,y+1,-s-16);}else{cameraTarget.set(x*.85+roadX(s)*.15,y+(lensIndex?5.5:3.5),-s+(lensIndex?10:6.5));camera.position.lerp(cameraTarget,1-Math.exp(-dt*5));camera.lookAt(roadX(s+18)+lateral*.65,roadY(s+18)+1.1,-s-18);camera.fov=smooth(camera.fov,56+speed*.27,3,dt);camera.updateProjectionMatrix();}
cityBackdrop.update(s,roadY(s),roadX(s),backdropTint);daylight.update();streetlights.update(s);llamas.update(distance,active?dt:0,speed,lateral);sun.position.set(x-35,y+65,-s-25);sun.target.position.copy(rider.position);
$('speed').textContent=String(Math.round(speed*3.6)).padStart(2,'0');$('distance').textContent=distance<1000?`${Math.floor(distance)} m`:`${(distance/1000).toFixed(2)} km`;$('score').textContent=String(Math.floor(flow)).padStart(4,'0');if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('message').style.opacity=0;}if(gain){gain.gain.setTargetAtTime(sound&&active?.015:0,audioCtx.currentTime,.2);osc.frequency.setTargetAtTime(45+speed*5,audioCtx.currentTime,.1);}collectibles.update(elapsed,distance,active?dt:0,camera);renderer.render(scene,camera);}
animate();reset();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_descent_status',description:'Read the current Deriva run distance, speed and score.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw new Error('No arguments accepted');return {state,distance:Math.round(distance),speedKmh:Math.round(speed*3.6),flow:Math.floor(flow),collection:collectibles.getState()};}})).catch(()=>{});}catch{}}
