import * as THREE from './vendor/three.module.js';

// Street lamps on the utility poles: an arm over the road, a lamp head, a halo and a pool of light
// on the asphalt. All instanced; a few real point lights follow the lamps nearest to the rider.
export function createStreetlights(scene,{poles,roadX,roadY}){
 const count=poles.length,dummy=new THREE.Object3D();
 const radial=(inner,outer)=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
   const grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,inner);grad.addColorStop(.35,outer);grad.addColorStop(1,'rgba(0,0,0,0)');
   g.fillStyle=grad;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
 const arms=new THREE.InstancedMesh(new THREE.BoxGeometry(2.1,.09,.09),new THREE.MeshStandardMaterial({color:'#5f6458',roughness:.9}),count);
 const headMaterial=new THREE.MeshStandardMaterial({color:'#3d4240',emissive:'#ffcf8a',emissiveIntensity:0,roughness:.6});
 const heads=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.16,.3),headMaterial,count);
 const poolMaterial=new THREE.MeshBasicMaterial({map:radial('rgba(255,214,150,1)','rgba(255,170,90,.45)'),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-4});
 const pools=new THREE.InstancedMesh(new THREE.PlaneGeometry(12,12),poolMaterial,count);
 const lamps=[],halo=[];
 const X=new THREE.Vector3(),Y=new THREE.Vector3(),Z=new THREE.Vector3(),m=new THREE.Matrix4();
 poles.forEach(({s,x,y},i)=>{
   dummy.position.set(x+1,y+7.25,-s);dummy.rotation.set(0,0,0);dummy.updateMatrix();arms.setMatrixAt(i,dummy.matrix);
   const lamp=new THREE.Vector3(x+2,y+7.1,-s);lamps.push({s,position:lamp});halo.push(lamp.x,lamp.y-.12,lamp.z);
   dummy.position.copy(lamp);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);
   // The pool lies on the road plane, tilted with the slope so it never sinks into the asphalt.
   const ps=s,px=x+3.2;const t=new THREE.Vector3(roadX(ps+1)-roadX(ps-1),roadY(ps+1)-roadY(ps-1),-2).normalize();
   X.set(1,0,0);Z.crossVectors(X,t).normalize();if(Z.y<0)Z.negate();Y.crossVectors(Z,X).normalize();X.crossVectors(Y,Z);
   m.makeBasis(X,Y,Z).setPosition(px,roadY(ps)+.07,-ps);pools.setMatrixAt(i,m);
 });
 const haloGeometry=new THREE.BufferGeometry();haloGeometry.setAttribute('position',new THREE.Float32BufferAttribute(halo,3));
 const haloMaterial=new THREE.PointsMaterial({map:radial('rgba(255,236,200,1)','rgba(255,190,110,.35)'),size:3.2,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
 const halos=new THREE.Points(haloGeometry,haloMaterial);
 for(const o of [arms,heads,pools]){o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
 arms.castShadow=heads.castShadow=true;pools.renderOrder=2;halos.renderOrder=3;halos.frustumCulled=false;
 scene.add(arms,heads,pools,halos);
 // Four real lights hop between the lamps nearest to the rider: real light on the board and walls at night.
 const lights=Array.from({length:4},()=>{const l=new THREE.PointLight('#ffcf8a',0,26,1.6);scene.add(l);return l;});
 let night=0;
 return {
   setNight(n){night=n;headMaterial.emissiveIntensity=3*n;poolMaterial.opacity=.85*n;haloMaterial.opacity=.9*n;pools.visible=halos.visible=n>.01;},
   update(s){if(night<=.01){for(const l of lights)l.intensity=0;return;}
     let first=lamps.findIndex(l=>l.s>s-45);if(first<0)first=Math.max(0,lamps.length-4);
     lights.forEach((l,k)=>{const lamp=lamps[Math.min(lamps.length-1,first+k)];l.position.copy(lamp.position);l.intensity=90*night;});}
 };
}
