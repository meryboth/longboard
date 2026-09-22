import * as THREE from './vendor/three.module.js';

// Painted environment (assets/environment/manifest.json): ground texture on the terrain and
// sprite cut-outs for trees and shrubs. Without the manifest the low-poly scenery stays.
// Tree sheet cells: 0 cardón, 1 álamo, 2 algarrobo, 3 molle.
const TREE_SCALE=[1,1.8,1.1,.95];
export function createScenery(scene,{terrain,trees,rocks,hide=()=>false}){
 const sprites=[],spriteTint=new THREE.Color('#ffffff');let treeSheet=null;
 // Scattered trees and rocks never land inside the town grid.
 for(const t of trees)if(hide(t.s,t.x))t.group.visible=false;
 for(const r of rocks)if(hide(r.s,r.x))r.mesh.visible=false;
 const extra=[];const trunk=new THREE.MeshStandardMaterial({color:'#6f7d55',roughness:1,flatShading:true});
 const tint=()=>{for(const m of sprites)m.color.copy(spriteTint);};
 async function load(url){const image=new Image();image.src='./assets/environment/'+url;await image.decode();return image;}
 // Crops each cell of a 2x2 sheet to the bounds of its opaque pixels.
 function cells(image){
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);const cw=canvas.width/2,ch=canvas.height/2;
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   return [[0,0],[1,0],[0,1],[1,1]].map(([cx,cy])=>{let x0=cw,y0=ch,x1=0,y1=0;
     for(let y=0;y<ch;y+=2)for(let x=0;x<cw;x+=2){if(data[((cy*ch+y)*canvas.width+cx*cw+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
     const map=texture.clone();map.needsUpdate=true;
     map.offset.set((cx*cw+x0)/canvas.width,1-(cy*ch+y1)/canvas.height);map.repeat.set((x1-x0)/canvas.width,(y1-y0)/canvas.height);
     const material=new THREE.SpriteMaterial({map,alphaTest:.5});sprites.push(material);
     return {material,aspect:(x1-x0)/Math.max(1,y1-y0)};});
 }
 function place(group,cell,height){group.clear();const sprite=new THREE.Sprite(cell.material);sprite.center.set(.5,0);sprite.scale.set(height*cell.aspect,height,1);group.add(sprite);}
 async function upgrade(){
   let manifest;try{const r=await fetch('./assets/environment/manifest.json');if(!r.ok)return;manifest=await r.json();}catch{return;}
   if(manifest.ground){const map=new THREE.TextureLoader().load('./assets/environment/'+manifest.ground);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
     // Keep the old per-vertex variation as brightness only, so the tiling reads less.
     const color=terrain.geometry.attributes.color;for(let i=0;i<color.count;i++){const v=(color.getX(i)+color.getY(i)+color.getZ(i))/3/.66;color.setXYZ(i,v,v,v);}color.needsUpdate=true;
     terrain.material=new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:1});}
   if(manifest.trees){treeSheet=cells(await load(manifest.trees));
     trees.forEach(({group,h},i)=>{const type=i%4;place(group,treeSheet[type],h*TREE_SCALE[type]);});
     for(const t of extra)place(t.group,treeSheet[t.type],t.h);}
   if(manifest.shrubs){const sheet=cells(await load(manifest.shrubs));
     rocks.forEach(({mesh,size},i)=>{if(!mesh.visible)return;const group=new THREE.Group();group.position.copy(mesh.position);scene.add(group);mesh.removeFromParent();place(group,sheet[i%4],1.2+size*.7);});}
   tint();
 }
 upgrade();
 return {setTint(color){spriteTint.copy(color);tint();},
   // Trees planted by the town (patios, plaza). Low-poly placeholder until the sheet loads.
   addTree(position,type,h){const group=new THREE.Group();group.position.copy(position);scene.add(group);
     if(treeSheet)place(group,treeSheet[type],h);else{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),trunk);m.scale.set(h*.3,h*.45,h*.3);m.position.y=h*.6;m.castShadow=true;group.add(m);}
     extra.push({group,type,h});}};
}
