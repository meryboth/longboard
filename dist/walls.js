import * as THREE from './vendor/three.module.js';

// Roadside walls. Pircas (dry-stone walls) along the cuesta; `skip` opens them where the town begins.
export function createWalls(scene,{length,roadX,roadY,skip=()=>false,texture='./assets/walls/mural-v1.png',height=1.8,tile=8.5}){
 const map=new THREE.TextureLoader().load(texture);
 map.colorSpace=THREE.SRGBColorSpace;map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.ClampToEdgeWrapping;map.anisotropy=8;
 const paint=new THREE.MeshStandardMaterial({map,roughness:.95,side:THREE.DoubleSide});
 const stone=new THREE.MeshStandardMaterial({color:'#a7937a',roughness:1,side:THREE.DoubleSide});
 const cap=new THREE.MeshStandardMaterial({color:'#bda888',roughness:1,side:THREE.DoubleSide});
 // Shared samples make every segment meet its neighbor exactly, including on hills.
 const samples=[];let arc=0;for(let s=-64;s<=length+320;s+=2){const x=roadX(s),y=roadY(s);const last=samples.at(-1);if(last)arc+=Math.hypot(x-last.x,y-last.y,s-last.s);samples.push({s,x,y,arc});}
 function strip(rows,material){const p=[],uv=[],ix=[];rows.forEach((row,i)=>{for(const point of row)p.push(...point.xyz);uv.push(row[0].u,0,row[1].u,1);if(i<rows.length-1){const n=i*2;ix.push(n,n+2,n+1,n+1,n+2,n+3);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;m.castShadow=true;scene.add(m);}
 // Runs of consecutive samples outside the skipped stretch, cut into chunks for culling.
 const runs=[];let run=[];for(const sample of samples){if(skip(sample.s)){if(run.length>1)runs.push(run);run=[];}else run.push(sample);}if(run.length>1)runs.push(run);
 const top=height;
 for(const side of [-1,1])for(const r of runs)for(let start=0;start<r.length-1;start+=80){
   const chunk=r.slice(start,Math.min(start+81,r.length));
   for(const edge of [6.35,6.66])strip(chunk.map(({s,x,y,arc})=>[{xyz:[x+side*edge,y-.28,-s],u:arc/tile},{xyz:[x+side*edge,y+top,-s],u:arc/tile}]),edge===6.35?paint:stone);
   strip(chunk.map(({s,x,y,arc})=>[{xyz:[x+side*6.30,y+top+.02,-s],u:arc},{xyz:[x+side*6.71,y+top+.02,-s],u:arc}]),cap);
   strip(chunk.map(({s,x,y,arc})=>[{xyz:[x+side*5.52,y+.10,-s],u:arc},{xyz:[x+side*6.35,y+.10,-s],u:arc}]),cap);
   strip(chunk.map(({s,x,y,arc})=>[{xyz:[x+side*5.52,y+.025,-s],u:arc},{xyz:[x+side*5.52,y+.10,-s],u:arc}]),stone);
 }
}
