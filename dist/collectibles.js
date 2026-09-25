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
     // A loose vinyl seen face on: grooves with a soft sheen, and the Deriva label in the middle.
     ctx.fillStyle='#17191b';ctx.beginPath();ctx.arc(256,256,256,0,Math.PI*2);ctx.fill();
     for(let r=250;r>100;r-=3){ctx.strokeStyle=`rgba(255,255,255,${r%9===0?.07:.025})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(256,256,r,0,Math.PI*2);ctx.stroke();}
     const sheen=ctx.createConicGradient(0,256,256);
     for(const [t,a] of [[0,0],[.12,.16],[.25,0],[.5,0],[.62,.16],[.75,0],[1,0]])sheen.addColorStop(t,`rgba(255,255,255,${a})`);
     ctx.fillStyle=sheen;ctx.beginPath();ctx.arc(256,256,250,0,Math.PI*2);ctx.arc(256,256,98,0,Math.PI*2,true);ctx.fill();
     ctx.fillStyle='#ee653e';ctx.beginPath();ctx.arc(256,256,96,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#f6e9c8';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText('DERIVA',256,226);
     ctx.font='bold 14px sans-serif';ctx.fillText('LADO A · 33⅓',256,304);
     ctx.fillStyle='#17191b';ctx.beginPath();ctx.arc(256,256,9,0,Math.PI*2);ctx.fill();
   }else{
     ctx.fillStyle='#d8ef85';ctx.fillRect(0,0,512,512);ctx.fillStyle='#263e32';ctx.textAlign='center';ctx.font='bold 60px sans-serif';ctx.fillText('DERIVA',256,130);
     ctx.beginPath();ctx.moveTo(100,350);ctx.lineTo(220,190);ctx.lineTo(285,278);ctx.lineTo(335,222);ctx.lineTo(420,350);ctx.closePath();ctx.fill();ctx.font='bold 25px sans-serif';ctx.fillText('TAKE THE LONG WAY',256,407);
   }
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
 }
 const vinylMat=new THREE.MeshBasicMaterial({map:labelTexture('disco')});
 const stickerMat=new THREE.MeshBasicMaterial({map:labelTexture('sticker'),side:THREE.DoubleSide});
 // A loose record, no sleeve: a thin disc facing the rider that spins on its own axis (see update).
 function record(){const g=new THREE.Group();const disc=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.02,48),[material('#111315'),vinylMat,vinylMat]);
   disc.rotation.x=Math.PI/2;g.add(disc);g.rotation.z=-.1;g.userData.spin=disc;return g;}
 function sticker(){const g=new THREE.Group();const rim=mesh(new THREE.CylinderGeometry(.47,.47,.018,8),'#fffae8',g);rim.rotation.x=Math.PI/2;const face=new THREE.Mesh(new THREE.CircleGeometry(.41,8),stickerMat);face.position.z=.015;g.add(face);g.rotation.z=.12;return g;}
 const makers={pancho:hotdog,disco:record,sticker};
 for(const item of items){const group=new THREE.Group(),object=makers[item.type]();group.add(object);group.position.set(roadX(item.s)+item.lane,roadY(item.s)+1.0,-item.s);scene.add(group);const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.59,32),new THREE.MeshBasicMaterial({color:colors[item.type],transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=-.91;group.add(ring);groups.set(item.id,{group,object,ring});}
 function burst(item){const m=new THREE.Mesh(new THREE.RingGeometry(.2,.29,24),new THREE.MeshBasicMaterial({color:colors[item.type],transparent:true,opacity:1,side:THREE.DoubleSide,depthWrite:false}));m.position.set(roadX(item.s)+item.lane,roadY(item.s)+1,-item.s);scene.add(m);effects.push({m,age:0});}
 return {
   reset(){state=newCollection();for(const {group} of groups.values())group.visible=true;for(const {m} of effects){scene.remove(m);m.geometry.dispose();m.material.dispose();}effects.length=0;},
   getState(){return {counts:{...state.counts},sets:state.sets,points:state.points};},
   collect(previous,next,previousLane,lane){const hits=collectBetween(state,items,previous,next,previousLane,lane);for(const item of hits){groups.get(item.id).group.visible=false;burst(item);onCollect(item,PICKUPS[item.type],this.getState());}return hits.reduce((sum,item)=>sum+item.points,0);},
   update(time,distance,dt,camera){
     for(const item of items){const {group,object,ring}=groups.get(item.id);group.visible=!state.collected.has(item.id)&&item.s>distance-12&&item.s<distance+180;if(!group.visible)continue;object.position.y=Math.sin(time*2.4+item.id)*.10;object.rotation.y=Math.sin(time*1.6+item.id)*.22;if(object.userData.spin)object.userData.spin.rotation.y=time*3.5;ring.material.opacity=.3+Math.sin(time*3+item.id)*.12;}
     for(let i=effects.length-1;i>=0;i--){const effect=effects[i];effect.age+=dt;effect.m.quaternion.copy(camera.quaternion);effect.m.scale.setScalar(1+effect.age*4);effect.m.material.opacity=Math.max(0,1-effect.age*2);if(effect.age>.5){scene.remove(effect.m);effect.m.geometry.dispose();effect.m.material.dispose();effects.splice(i,1);}}
   }
 };
}
