import * as THREE from './vendor/three.module.js';
import {createRider as createBoardRider} from './rider.js';

export function createRider(){
 const fallback=createBoardRider();
 // Preserve the existing 3D longboard; replace only the human after images load.
 const board=fallback.root.children[0],human=fallback.root.children[1];
 const root=fallback.root;
 const frames=[];const loader=new THREE.TextureLoader();
 const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,color:0xffffff});
 const sprite=new THREE.Sprite(material);sprite.center.set(.5,.06);sprite.position.set(0,.33,0);sprite.scale.set(1.74,2.32,1);sprite.visible=false;root.add(sprite);
 const loading=Array.from({length:24},(_,i)=>new Promise(resolve=>loader.load(`./assets/rider-2d/idle-${String(i+1).padStart(4,'0')}.png`,t=>{t.colorSpace=THREE.SRGBColorSpace;frames[i]=t;resolve(true);},undefined,()=>resolve(false))));
 let ready=false;
 Promise.all(loading).then(results=>{ready=results.every(Boolean);if(ready){human.visible=false;sprite.visible=true;material.map=frames[0];material.needsUpdate=true;}});
 return {root,animate(time,steer,braking,moving){
   if(!ready){fallback.animate(time,steer,braking,moving);return;}
   root.rotation.z=0;board.rotation.y=braking?steer*.22:0;
   material.map=frames[Math.floor(time*24)%24];material.rotation=-steer*(braking?.13:.07);
 }};
}
