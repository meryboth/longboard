import * as THREE from './vendor/three.module.js';
import {makePickupLayout,newCollection,collectBetween,PICKUPS} from './collection-logic.js';

export function createCollectibles(scene,{length,roadX,roadY,obstacles,onCollect}){
 const items=makePickupLayout(length,obstacles);let state=newCollection();
 const groups=new Map(),effects=[];
 const colors={pancho:'#ffd26f',disco:'#ff805c',sticker:'#cce87e'};
 const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.7}));return materials.get(color);}
 function mesh(geometry,color,parent){const m=new THREE.Mesh(geometry,material(color));parent.add(m);return m;}
 function hotdog(){const group=new THREE.Group();for(const z of [-.14,.14]){const bun=mesh(new THREE.CapsuleGeometry(.16,.72,6,12),'#e6ae60',group);bun.rotation.z=Math.PI/2;bun.position.z=z;}const sausage=mesh(new THREE.CapsuleGeometry(.11,.94,6,12),'#b8502f',group);sausage.rotation.z=Math.PI/2;sausage.position.y=.08;const pts=Array.from({length:33},(_,i)=>new THREE.Vector3(-.47+i*.029,.185,Math.sin(i*.7)*.07));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.018,6,false),'#ffda3c',group);group.rotation.x=.38;group.rotation.z=.13;return group;}
 function labelTexture(kind){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
   if(kind==='disco'){
     ctx.fillStyle='#f04c2c';ctx.fillRect(0,0,512,512);ctx.fillStyle='#66cbdf';ctx.fillRect(0,275,512,237);
     ctx.fillStyle='#ddd2a8';ctx.beginPath();ctx.moveTo(35,390);ctx.lineTo(190,190);ctx.lineTo(470,190);ctx.lineTo(380,440);ctx.closePath();ctx.fill();
     ctx.fillStyle='#e75228';ctx.beginPath();ctx.moveTo(80,373);ctx.lineTo(205,218);ctx.lineTo(430,218);ctx.lineTo(355,408);ctx.closePath();ctx.fill();
     ctx.fillStyle='#fff6de';ctx.font='bold 31px sans-serif';ctx.textAlign='center';ctx.fillText('RED HOT CHILI PEPPERS',256,57);ctx.font='bold 43px sans-serif';ctx.fillText('CALIFORNICATION',256,111);
   }else{
     ctx.fillStyle='#d8ef85';ctx.fillRect(0,0,512,512);ctx.fillStyle='#263e32';ctx.textAlign='center';ctx.font='bold 60px sans-serif';ctx.fillText('DERIVA',256,130);
     ctx.beginPath();ctx.moveTo(100,350);ctx.lineTo(220,190);ctx.lineTo(285,278);ctx.lineTo(335,222);ctx.lineTo(420,350);ctx.closePath();ctx.fill();ctx.font='bold 25px sans-serif';ctx.fillText('TAKE THE LONG WAY',256,407);
   }
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
 }
 const sleeveMat=new THREE.MeshBasicMaterial({map:labelTexture('disco'),side:THREE.DoubleSide});
 const stickerMat=new THREE.MeshBasicMaterial({map:labelTexture('sticker'),side:THREE.DoubleSide});
 function record(){const g=new THREE.Group();const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.77,.77,.05),[material('#ee653e'),material('#ee653e'),material('#ee653e'),material('#ee653e'),sleeveMat,sleeveMat]);g.add(sleeve);const disc=mesh(new THREE.CylinderGeometry(.36,.36,.018,40),'#202528',g);disc.rotation.x=Math.PI/2;disc.position.set(.30,.03,-.055);const center=mesh(new THREE.CircleGeometry(.10,24),'#ed714e',g);center.position.set(.30,.03,-.04);g.rotation.z=-.12;return g;}
 function sticker(){const g=new THREE.Group();const rim=mesh(new THREE.CylinderGeometry(.47,.47,.018,8),'#fffae8',g);rim.rotation.x=Math.PI/2;const face=new THREE.Mesh(new THREE.CircleGeometry(.41,8),stickerMat);face.position.z=.015;g.add(face);g.rotation.z=.12;return g;}
 const makers={pancho:hotdog,disco:record,sticker};
 for(const item of items){const group=new THREE.Group(),object=makers[item.type]();group.add(object);group.position.set(roadX(item.s)+item.lane,roadY(item.s)+1.0,-item.s);scene.add(group);const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.59,32),new THREE.MeshBasicMaterial({color:colors[item.type],transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=-.91;group.add(ring);groups.set(item.id,{group,object,ring});}
 function burst(item){const m=new THREE.Mesh(new THREE.RingGeometry(.2,.29,24),new THREE.MeshBasicMaterial({color:colors[item.type],transparent:true,opacity:1,side:THREE.DoubleSide,depthWrite:false}));m.position.set(roadX(item.s)+item.lane,roadY(item.s)+1,-item.s);scene.add(m);effects.push({m,age:0});}
 return {
   reset(){state=newCollection();for(const {group} of groups.values())group.visible=true;for(const {m} of effects){scene.remove(m);m.geometry.dispose();m.material.dispose();}effects.length=0;},
   getState(){return {counts:{...state.counts},sets:state.sets,points:state.points};},
   collect(previous,next,previousLane,lane){const hits=collectBetween(state,items,previous,next,previousLane,lane);for(const item of hits){groups.get(item.id).group.visible=false;burst(item);onCollect(item,PICKUPS[item.type],this.getState());}return hits.reduce((sum,item)=>sum+item.points,0);},
   update(time,distance,dt,camera){
     for(const item of items){const {group,object,ring}=groups.get(item.id);group.visible=!state.collected.has(item.id)&&item.s>distance-12&&item.s<distance+180;if(!group.visible)continue;object.position.y=Math.sin(time*2.4+item.id)*.10;object.rotation.y=Math.sin(time*1.6+item.id)*.22;ring.material.opacity=.3+Math.sin(time*3+item.id)*.12;}
     for(let i=effects.length-1;i>=0;i--){const effect=effects[i];effect.age+=dt;effect.m.quaternion.copy(camera.quaternion);effect.m.scale.setScalar(1+effect.age*4);effect.m.material.opacity=Math.max(0,1-effect.age*2);if(effect.age>.5){scene.remove(effect.m);effect.m.geometry.dispose();effect.m.material.dispose();effects.splice(i,1);}}
   }
 };
}
