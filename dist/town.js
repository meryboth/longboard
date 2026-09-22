import * as THREE from './vendor/three.module.js';

// A Quebrada de Humahuaca town (Purmamarca, Tilcara): colonial grid of 40 m blocks, dirt streets,
// one-storey adobe houses built on the street line with patios inside, and a plaza with a church.
// The main road is the town's main street. Painted textures come from assets/town/manifest.json.
export const TOWN={start:620,end:1880,block:40,street:8,rows:[[7.5,45.5],[53.5,91.5]]};
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
// 0 outside town, 1 inside: used to flatten the valley floor under the grid.
export const townMask=s=>smooth(TOWN.start-90,TOWN.start-10,s)*(1-smooth(TOWN.end+10,TOWN.end+90,s));
export const inTown=(s,x=0)=>townMask(s)>.5&&Math.abs(x)<100;

export function createTown(scene,{roadX,groundY,scenery}){
 const slope=s=>roadX(s+.5)-roadX(s-.5);
 // Offsets run along the road normal, so cross streets stay perpendicular to the main street.
 const at=(s,l)=>{const r=slope(s),n=Math.hypot(1,r);return {x:roadX(s)+l/n,z:-s+l*r/n,y:groundY(s,l),r,n};};
 const yaw=(fx,fz)=>Math.atan2(fx,fz);
 let seed=5023;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const houses=[],trees=[];let church=null;
 const {start,end,block,street,rows}=TOWN,pitch=block+street;
 const plazaBlock=Math.round((1180-start)/pitch);
 const facing=(s,side,dir)=>{const r=slope(s),n=Math.hypot(1,r);
   if(dir==='in')return yaw(-side/n,-side*r/n);if(dir==='out')return yaw(side/n,side*r/n);
   if(dir==='up')return yaw(-r/n,1/n);return yaw(r/n,-1/n);};
 const addHouse=(s,side,l,dir,corner=false)=>{if(!corner&&rng()<.07)return;const p=at(s,side*l);houses.push({x:p.x,y:p.y,z:p.z,a:facing(s,side,dir),h:.92+rng()*.28,v:Math.floor(rng()*1000)});};
 for(const side of [-1,1])rows.forEach(([l0,l1],row)=>{
   for(let k=0,s0=start;s0+block<=end;k++,s0+=pitch){
     if(side<0&&row===0&&k===plazaBlock){
       // Plaza: trees on the corners, church at the back facing the main street.
       for(const [ds,dl] of [[5,4],[35,4],[5,16],[35,16],[20,3],[20,17]]){const p=at(s0+ds,side*(l0+dl));trees.push({p,type:ds===20?1:3,h:ds===20?11:7});}
       const p=at(s0+20,side*(l0+27));church={p,a:facing(s0+20,side,'in')};continue;}
     for(let j=0;j<5;j++){const s=s0+4+8*j;addHouse(s,side,l0+4,'in',j===0||j===4);addHouse(s,side,l1-4,'out',j===0||j===4);}
     for(const l of [l0+12,l0+20,l0+28].filter(l=>l<=l1-12)){addHouse(s0+4,side,l,'up');addHouse(s0+36,side,l,'down');}
     // Patio trees inside some blocks.
     if(rng()<.6){const p=at(s0+14+rng()*12,side*(l0+14+rng()*(l1-l0-28)));trees.push({p,type:2+Math.floor(rng()*2),h:5+rng()*3});}
   }});
 // Rural puestos along the cuesta and the way out: a house or two with a pirca corral, never floating alone in town.
 for(let s=40;s<2350;s+=110+rng()*120){if(townMask(s)>0)continue;const side=rng()<.5?-1:1,l=12+rng()*10;
   addHouse(s,side,l,'in',true);if(rng()<.5)addHouse(s+8,side,l,'in',true);}
 const bodyGeometry=new THREE.BoxGeometry(8,4.5,8).translate(0,2.25,0);
 const dummy=new THREE.Object3D();const meshes=[];
 function build(variants){
   for(const m of meshes){scene.remove(m);m.dispose();}meshes.length=0;
   variants.forEach((material,k)=>{const items=houses.filter(h=>h.v%variants.length===k);if(!items.length)return;
     const mesh=new THREE.InstancedMesh(bodyGeometry,material,items.length);
     items.forEach((h,i)=>{dummy.position.set(h.x,h.y-.1,h.z);dummy.rotation.set(0,h.a,0);dummy.scale.set(1,h.h,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
     mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);});
 }
 const roof=new THREE.MeshStandardMaterial({color:'#9c8062',roughness:1});
 build(['#d9c3a3','#c9a582','#e6dccb','#c28e6f'].map(color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1});return [m,m,roof,roof,m,m];}));
 // Streets: compacted dirt, draped on the flattened valley floor.
 const streetMaterial=new THREE.MeshStandardMaterial({color:'#b89c7a',roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 function strip(points,widthL,alongS){const p=[],uv=[],ix=[];points.forEach(([s,l],i)=>{for(const d of [-widthL/2,widthL/2]){const q=alongS?at(s,l+d):at(s+d,l);p.push(q.x,groundY(alongS?s:s+d,l)+.06,q.z);uv.push((alongS?l+d:l)/7,(alongS?s:s+d)/7);}
   if(i<points.length-1){const n=i*2;ix.push(n,n+2,n+1,n+1,n+2,n+3);}});
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   const m=new THREE.Mesh(g,streetMaterial);m.receiveShadow=true;scene.add(m);}
 for(const side of [-1,1]){
   for(let s0=start-street;s0<=end;s0+=pitch){const pts=[];for(let l=6;l<=rows[1][1]+2;l+=4)pts.push([s0+street/2,side*l]);strip(pts,street,false);}
   const pts=[];for(let s=start-street;s<=end;s+=4)pts.push([s,side*(rows[0][1]+street/2)]);strip(pts,street,true);
   // Sidewalk between the curb and the facades.
   const walk=[];for(let s=start-street;s<=end;s+=4)walk.push([s,side*6.8]);strip(walk,1.6,true);
 }
 // Church: white adobe nave with a bell tower, the landmark of the plaza.
 const churchGroup=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:'#eee6d6',roughness:1});
 let nave,tower;
 if(church){churchGroup.position.set(church.p.x,church.p.y,church.p.z);churchGroup.rotation.y=church.a;scene.add(churchGroup);
   nave=new THREE.Mesh(new THREE.BoxGeometry(10,7,16).translate(0,3.5,-2),white);tower=new THREE.Mesh(new THREE.BoxGeometry(4.5,8,4.5).translate(0,4,0),white);
   tower.position.set(6.6,0,5.6);const cap=new THREE.Mesh(new THREE.ConeGeometry(2.4,2.2,4).rotateY(Math.PI/4).translate(0,9.1,0),white);tower.add(cap);
   for(const m of [nave,tower,cap]){m.castShadow=m.receiveShadow=true;}churchGroup.add(nave,tower);}
 for(const t of trees)scenery.addTree(new THREE.Vector3(t.p.x,t.p.y,t.p.z),t.type,t.h);
 async function upgrade(){
   let manifest;try{const r=await fetch('./assets/town/manifest.json');if(!r.ok)return;manifest=await r.json();}catch{return;}
   const loader=new THREE.TextureLoader();
   const tex=(url,repeat)=>{const t=loader.load('./assets/town/'+url);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
   const mat=url=>new THREE.MeshStandardMaterial({map:tex(url),roughness:.95});
   if(manifest.houses?.length)build(manifest.houses.map(v=>{const front=mat(v.front),side=mat(v.side);
     // BoxGeometry face order: +x, -x, +y, -y, +z (front, facing the street), -z.
     return [side,side,roof,roof,front,side];}));
   if(manifest.street){streetMaterial.map=tex(manifest.street,true);streetMaterial.color.set('#ffffff');streetMaterial.needsUpdate=true;}
   if(church&&manifest.church){const c=manifest.church,front=mat(c.front),side=mat(c.side),towerFace=mat(c.tower);
     nave.material=[side,side,white,white,front,white];tower.material=[towerFace,towerFace,white,white,towerFace,towerFace];}
 }
 upgrade();
 return {count:houses.length};
}
