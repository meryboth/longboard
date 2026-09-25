import * as THREE from './vendor/three.module.js';

// Llamas crossing the road (they replaced the traffic cones). Each one waits in the field, beyond a gap left in
// the pircas (in town, on the pavement), and sets off when the rider comes near, at a llama's walk, so it is
// somewhere in the lanes when the rider arrives: the obstacle moves and has to be timed, not just steered around.
// A hit spooks it and it trots off.
// The art is a painted side view in two walk frames (art/comfyui-animals.mjs); the sprite is mirrored to walk left.
const HEIGHT=2.67;          // full image height (ear tips to hooves plus margins), in world units; the rider is 2.12
const WALK=3.2,TROT=6.5;    // lateral speed in units per second: a brisk crossing leaves little time to react
const STRIDE=.95;           // ground covered per full walk cycle, so faster means quicker legs, not sliding
// Every third llama trots across: it sets off later and sweeps the road faster, so dodging it sideways is much
// harder. Its darker, browner coat gives it away, so the player can learn to read it.
const FAST=5.6,FAST_STRIDE=1.3,FAST_EVERY=3,FAST_COAT='#b8875f';
// How far past the rider's line the llama's centre is when the rider arrives, as a share of its half width:
// its body is still across the line. A fixed time lead would let a fast llama clear the line just in time.
const LEAD=.45;
export const GAP=3.6;       // half width of the opening left in the walls at each crossing

// Leg motion on top of the two painted frames. In texture space the llama always faces right (the mirror is a
// UV flip), so the front legs are right of the middle and the hind legs left. Below the belly line, the image is
// sheared around the hips: 0 at the belly, most at the hooves, front and hind legs in opposite phase.
function legs(material,state){
 material.onBeforeCompile=shader=>{
   shader.uniforms.legPhase=state.phase;shader.uniforms.legAmp=state.amp;
   shader.fragmentShader='uniform float legPhase;\nuniform float legAmp;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
     #ifdef USE_MAP
     vec2 legUv=vMapUv;
     float belly=.31,depth=clamp((belly-vMapUv.y)/belly,0.,1.);
     float pair=vMapUv.x>.5?0.:3.14159;           // front and hind legs step in turn
     legUv.x-=legAmp*depth*sin(legPhase+pair);
     vec4 sampledDiffuseColor=texture2D(map,legUv);
     diffuseColor*=sampledDiffuseColor;
     #endif`);
 };
 material.customProgramCacheKey=()=>'deriva-llama-legs';
}

export function createLlamas(scene,{positions,roadX,roadY}){
 const loader=new THREE.TextureLoader();
 // maps[direction][frame]: direction 0 walks right (as painted), 1 walks left (mirrored).
 const maps=[[null,null],[null,null]];let aspect=1;
 ['a','b'].forEach((frame,i)=>loader.load(`./assets/animals/llama-walk-${frame}.webp`,texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;aspect=texture.image.width/texture.image.height;
   const mirror=texture.clone();mirror.repeat.x=-1;mirror.offset.x=1;mirror.needsUpdate=true;
   maps[0][i]=texture;maps[1][i]=mirror;
   for(const l of llamas){l.sprite.scale.set(HEIGHT*aspect,HEIGHT,1);if(!l.material.map){l.material.map=maps[0][0]||maps[0][1];l.material.needsUpdate=true;}}
 }));
 const shadowGeometry=new THREE.CircleGeometry(.5,24),shadowMaterial=new THREE.MeshBasicMaterial({color:0x17271d,transparent:true,opacity:.2,depthWrite:false});

 const llamas=positions.map(({s,lane,edge},i)=>{
   // The old cone lane only decides the side it comes from. Deterministic: the collectibles laid out around
   // these positions stay where they were.
   const side=lane>=0?1:-1,fast=i%FAST_EVERY===FAST_EVERY-1;
   const state={phase:{value:0},amp:{value:0}};
   const coat=new THREE.Color(fast?FAST_COAT:'#ffffff');
   const material=new THREE.SpriteMaterial({color:coat,transparent:true,alphaTest:.5,depthWrite:true});legs(material,state);
   const group=new THREE.Group(),sprite=new THREE.Sprite(material);
   sprite.center.set(.5,.01);sprite.scale.set(HEIGHT,HEIGHT,1);   // the export keeps a 10 px margin under the hooves
   const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;shadow.scale.set(2.1,.8,1);
   group.add(shadow,sprite);scene.add(group);
   return {s,edge,lane:side*edge,start:side*edge,side,fast,coat,pace:fast?FAST:WALK,stride:fast?FAST_STRIDE:STRIDE,offset:i*.37,walked:0,state:'waiting',hit:false,halfWidth:1.05,mesh:group,sprite,material,legs:state};
 });
 function place(l){l.mesh.position.set(roadX(l.s)+l.lane,roadY(l.s),-l.s);}
 llamas.forEach(place);

 return {
   obstacles:llamas,
   setTint(color){for(const l of llamas)l.material.color.copy(color).multiply(l.coat);},
   reset(){for(const l of llamas){l.lane=l.start;l.walked=0;l.state='waiting';l.hit=false;l.mesh.visible=true;place(l);}},
   // The rider hit it: it trots away in the direction it was going and stops counting as an obstacle.
   spook(l){l.hit=true;l.state='spooked';},
   // Each llama aims at the rider: it sets off so that it crosses the rider's current line just before the rider
   // gets there, at the rider's current speed. Holding the line means a hit; the rider has to steer, brake or push.
   update(distance,dt,speed=12,riderLane=0){
     for(const l of llamas){
       const near=l.s>distance-20&&l.s<distance+190;l.mesh.visible=near;if(!near)continue;
       if(l.state==='waiting'&&l.s>distance){const arrive=(l.s-distance)/Math.max(speed,4),walk=Math.abs(l.start-riderLane)/l.pace;if(arrive<=walk+LEAD*l.halfWidth/l.pace)l.state='crossing';}
       const dir=-l.side,pace=l.state==='crossing'?l.pace:l.state==='spooked'?Math.max(TROT,l.pace*1.2):0;
       if(pace){l.lane+=dir*pace*dt;l.walked+=pace*dt;
         if(l.state==='crossing'&&dir*l.lane>=l.edge){l.lane=dir*l.edge;l.state='done';}
         if(l.state==='spooked'&&Math.abs(l.lane)>l.edge+3)l.mesh.visible=false;}
       // The gait follows the ground covered, so trotting is simply a faster cycle. Frame A (legs apart) and
       // frame B (legs gathered) alternate each half cycle, and the shear swings the legs between them.
       const cycle=l.walked/l.stride+l.offset,moving=pace>0;
       l.legs.phase.value=cycle*Math.PI*2;
       l.legs.amp.value=THREE.MathUtils.damp(l.legs.amp.value,moving?.05:0,8,dt||.016);
       const map=maps[dir>0?0:1][moving?Math.floor(cycle*2)%2:0];
       if(map&&l.material.map!==map)l.material.map=map;
       l.sprite.position.y=moving?Math.abs(Math.sin(cycle*Math.PI*2))*(l.fast?.09:.05):0;   // a trot bounces more
       place(l);
     }
   }
 };
}
