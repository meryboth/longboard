import * as THREE from './vendor/three.module.js';
import {DECK_TOP} from './board.js';

export function choosePose(current,steer){
 if(steer<-.30)return 'left';
 if(steer>.30)return 'right';
 if(Math.abs(steer)<.13)return 'neutral';
 return current;
}

// Riders come from art/comfyui-riders.mjs without a board: three poses per rider, standing on the 3D deck (board.js).
const BODY_HEIGHT=2.12;

// Where each shoe touches the deck, in texture pixels. The lowest 12% of the figure is split into connected
// blobs (one per leg and shoe). Each contact is taken at mid-shoe height, not at the sole: from the high chase
// camera the eye places a foot by the body of the shoe, which sits higher on the billboard. Overlapping shoes give one.
export function findSoles(data,w,top,bottom){
 const y0=Math.round(bottom-(bottom-top)*.12),rows=bottom-y0+1,seen=new Uint8Array(w*rows),blobs=[];
 const solid=(x,y)=>data[(y*w+x)*4+3]>128;
 for(let y=y0;y<=bottom;y++)for(let x=0;x<w;x++){
   if(seen[(y-y0)*w+x]||!solid(x,y))continue;
   const stack=[[x,y]],px=[];seen[(y-y0)*w+x]=1;
   while(stack.length){const [cx,cy]=stack.pop();px.push(cx,cy);
     for(const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]])
       if(nx>=0&&nx<w&&ny>=y0&&ny<=bottom&&!seen[(ny-y0)*w+nx]&&solid(nx,ny)){seen[(ny-y0)*w+nx]=1;stack.push([nx,ny]);}}
   let low=0;for(let i=1;i<px.length;i+=2)low=Math.max(low,px[i]);
   let sx=0,n=0;for(let i=0;i<px.length;i+=2)if(px[i+1]>=low-6){sx+=px[i];n++;}
   blobs.push({x:sx/n,y:low-(bottom-top)*.035,size:px.length/2});
 }
 blobs.sort((a,b)=>b.size-a.size);
 return blobs.filter(b=>b.size>blobs[0].size*.15).slice(0,2);
}
export function createRider(){
 const root=new THREE.Group(),loader=new THREE.TextureLoader(),poses=new Map();
 let selected='neutral',lastTime=0,token=0;
 const wind={value:0},clock={value:0};
 function loadPose(name,file,mine){
   const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false,opacity:0});
   // Texture-space cloth motion is restricted to the torso. Shoes and head stay still.
   material.onBeforeCompile=shader=>{
     shader.uniforms.derivaTime=clock;shader.uniforms.derivaWind=wind;
     shader.fragmentShader='uniform float derivaTime;\nuniform float derivaWind;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
       #ifdef USE_MAP
       vec2 derivaUv = vMapUv;
       float hem = smoothstep(0.47,0.57,vMapUv.y)*(1.0-smoothstep(0.77,0.86,vMapUv.y));
       float flutter = sin(vMapUv.y*53.0+derivaTime*7.5)+0.35*sin(vMapUv.y*89.0-derivaTime*11.0);
       derivaUv.x += flutter*hem*0.0022*derivaWind;
       #endif
       ${THREE.ShaderChunk.map_fragment.replace('vMapUv','derivaUv')}`);
   };
   material.customProgramCacheKey=()=> 'deriva-rider-v3';
   const sprite=new THREE.Sprite(material);sprite.position.set(0,DECK_TOP,0);sprite.visible=false;
   loader.load(file,texture=>{
     if(mine!==token){texture.dispose();material.dispose();return;}
     root.add(sprite);
     texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;material.map=texture;
     const img=texture.image,canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;
     let top=img.height,bottom=0,left=img.width,right=0;
     for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
     for(let y=Math.max(top,bottom-24);y<=bottom;y++)for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
     sprite.center.set((left+right)/2/img.width,1-bottom/img.height);
     const fullHeight=BODY_HEIGHT*img.height/Math.max(1,bottom-top);sprite.scale.set(fullHeight*img.width/img.height,fullHeight,1);
     const base=sprite.scale.clone(),soles=findSoles(data,img.width,top,bottom).sort((a,b)=>b.y-a.y).map(p=>({u:p.x/img.width,v:1-p.y/img.height}));
     material.needsUpdate=true;
     const old=poses.get(name);if(old){root.remove(old.sprite);old.material.map?.dispose();old.material.dispose();}
     poses.set(name,{sprite,material,base,soles,weight:name===selected?1:0});
     if(name===selected){sprite.visible=true;material.opacity=1;}
   });
 }
 // Swapping riders loads the new poses first and replaces each old one as it arrives: no empty frame.
 function setRider(id){const mine=++token;for(const name of ['neutral','left','right'])loadPose(name,`./assets/riders/${id}-${name}.webp`,mine);}
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,32),new THREE.MeshBasicMaterial({color:0x17271d,transparent:true,opacity:.19,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.02,0);shadow.scale.set(.62,1.5,1);root.add(shadow);
 let lean=0,crouch=0;
 const right=new THREE.Vector3(),up=new THREE.Vector3(),at=new THREE.Vector3();
 // World positions of the visible pose's soles, as the camera sees them on the billboard (lean included).
 function contacts(camera){
   let pose=null;for(const p of poses.values())if(!pose||p.weight>pose.weight)pose=p;if(!pose)return [];
   right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
   const {sprite,material}=pose,c=Math.cos(material.rotation),si=Math.sin(material.rotation);sprite.getWorldPosition(at);
   return pose.soles.map(({u,v})=>{const dx=(u-sprite.center.x)*sprite.scale.x,dy=(v-sprite.center.y)*sprite.scale.y;
     return at.clone().addScaledVector(right,dx*c-dy*si).addScaledVector(up,dx*si+dy*c);});
 }
 return {root,setRider,contacts,animate(time,steer,braking,moving,speed=12){
   const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
   selected=choosePose(selected,steer);
   const target=poses.has(selected)?selected:'neutral';
   if(moving)clock.value=time;
   wind.value=THREE.MathUtils.damp(wind.value,moving?Math.min(1.4,.25+speed/24):0,4,dt||.016);
   // Body language on top of the painted poses: lean into the carve pivoting on the feet (the sprite's
   // centre is the soles), knees bend when braking, and a light bounce from the road at speed.
   const k=dt||.016;lean=THREE.MathUtils.damp(lean,-steer*(braking?.2:.15),6,k);crouch=THREE.MathUtils.damp(crouch,braking?1:0,5,k);
   const bounce=moving?Math.sin(time*11)*.006*Math.min(1,speed/18):0,sy=1-.045*crouch+bounce,sx=1+.02*crouch;
   for(const [name,pose] of poses){pose.weight=THREE.MathUtils.damp(pose.weight,name===target?1:0,24,k);pose.material.opacity=pose.weight;pose.sprite.visible=pose.weight>.005;
     pose.material.rotation=lean;pose.sprite.scale.set(pose.base.x*sx,pose.base.y*sy,1);}
 }};
}
