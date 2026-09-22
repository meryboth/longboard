import * as THREE from './vendor/three.module.js';

// The rider's longboard in 3D: the deck is the ComfyUI graphic cut out by its own alpha (so every shape,
// pintail or drop-through, comes from the image), a wood rim underneath for thickness, trucks and wheels
// in the board's colour. The deck top shows the graphic through a darker "clear grip", so the chosen board
// is visible from the chase camera.
const METRE=1/.745; // world units per metre: the rider sprite is 2.35 units for ≈1.75 m
const WHEEL_R=.05,WHEEL_W=.05,DECK_Y=.125,RIM=.03;
export const DECK_TOP=DECK_Y+.004;

export function createBoard(){
 const root=new THREE.Group(),loader=new THREE.TextureLoader();
 const deckMaterial=new THREE.MeshStandardMaterial({color:'#b9b4ab',roughness:.95,alphaTest:.5,side:THREE.DoubleSide});
 const rimMaterial=new THREE.MeshStandardMaterial({color:'#c9a47a',roughness:.8,alphaTest:.5});
 const deckGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2); // nose (texture top) points to -z, forward
 const deck=new THREE.Mesh(deckGeometry,deckMaterial),rim=new THREE.Mesh(deckGeometry,rimMaterial);
 deck.position.y=DECK_Y;rim.position.y=DECK_Y-RIM;deck.castShadow=true;root.add(rim,deck);
 const metal=new THREE.MeshStandardMaterial({color:'#8d918c',metalness:.6,roughness:.45});
 const wheelMaterial=new THREE.MeshStandardMaterial({color:'#e0773f',roughness:.55});
 const wheelGeometry=new THREE.CylinderGeometry(WHEEL_R,WHEEL_R,WHEEL_W,18).rotateZ(Math.PI/2);
 const trucks=[],wheels=[];
 for(const end of [-1,1]){
   const truck=new THREE.Group();root.add(truck);trucks.push(truck);
   const hanger=new THREE.Mesh(new THREE.BoxGeometry(.3,.035,.05),metal);hanger.position.y=WHEEL_R;
   const base=new THREE.Mesh(new THREE.BoxGeometry(.1,.05,.12),metal);base.position.y=DECK_Y-RIM-.025;truck.add(hanger,base);
   for(const side of [-1,1]){const w=new THREE.Mesh(wheelGeometry,wheelMaterial);w.position.set(side*(.15+WHEEL_W/2),WHEEL_R,0);w.castShadow=true;truck.add(w);wheels.push(w);}
   truck.userData.end=end;
 }
 let token=0,length=1.4;const offset=new THREE.Vector2();
 function setBoard(board){
   const mine=++token;wheelMaterial.color.set(board.wheels);
   loader.load(`./assets/boards/${board.id}.webp`,texture=>{
     if(mine!==token){texture.dispose();return;}
     texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
     const old=deckMaterial.map;deckMaterial.map=rimMaterial.map=texture;deckMaterial.needsUpdate=rimMaterial.needsUpdate=true;old?.dispose();
     // Real length from the garage spec (inches); width follows the image's aspect.
     length=parseFloat(board.length)*.0254*METRE;const {width,height}=texture.image,span=length*height/(height-24);
     deck.scale.set(span*width/height,1,span);rim.scale.copy(deck.scale).multiplyScalar(.985);
     for(const t of trucks)t.position.z=t.userData.end*length*.36;
   });
 }
 // Fit the deck under the rider's feet. Each sole is a point on the billboard; the camera ray through it
 // meets the deck plane where that foot visually stands. The deck always points down the road (a longboard
 // never rides sideways): it only slides sideways and forward so both feet land on it.
 const plane=new THREE.Plane(),ray=new THREE.Ray(),hit=new THREE.Vector3(),normal=new THREE.Vector3(),origin=new THREE.Vector3();
 function fit(soles,camera){
   const parent=root.parent;if(!parent||!soles.length)return;
   normal.set(0,1,0).transformDirection(parent.matrixWorld);origin.set(0,DECK_TOP,0).applyMatrix4(parent.matrixWorld);plane.setFromNormalAndCoplanarPoint(normal,origin);
   const feet=[];for(const p of soles){ray.set(camera.position,p.clone().sub(camera.position).normalize());if(ray.intersectPlane(plane,hit))feet.push(parent.worldToLocal(hit.clone()));}
   if(!feet.length)return;
   const mid=feet.reduce((a,f)=>a.add(f),new THREE.Vector3()).divideScalar(feet.length);
   // Overlapping shoes read as one contact: the rear foot. The front foot is ahead of it, so the deck moves forward.
   if(feet.length===1)mid.z-=length*.06;
   return {x:THREE.MathUtils.clamp(mid.x,-.3,.3),z:THREE.MathUtils.clamp(mid.z,-length*.35,length*.35)};
 }
 return {root,setBoard,
   // Wheels spin with the ground speed; the deck follows the feet and rolls a little into the carve.
   animate(dt,speed,steer,soles,camera){const k=dt||.016,spin=speed*dt/WHEEL_R;for(const w of wheels)w.rotation.x-=spin;
     const f=camera&&fit(soles,camera);if(f){offset.x=THREE.MathUtils.damp(offset.x,f.x,14,k);offset.y=THREE.MathUtils.damp(offset.y,f.z,14,k);}
     root.position.set(offset.x,0,offset.y);root.rotation.z=THREE.MathUtils.damp(root.rotation.z,-steer*.14,8,k);}};
}
