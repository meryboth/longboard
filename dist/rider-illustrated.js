import * as THREE from './vendor/three.module.js';

// Board and rider are a single painted key pose with coherent foot contacts.
export function createRider(){
 const root=new THREE.Group();
 const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false});
 const sprite=new THREE.Sprite(material);sprite.position.set(0,.025,0);sprite.visible=false;root.add(sprite);
 new THREE.TextureLoader().load('./assets/rider-2d/grounded-pose-v3.png',texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;material.map=texture;
   // Anchor the opaque wheel pixels, not the transparent image margin.
   const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   const rgba=ctx.getImageData(0,0,image.width,image.height).data;
   let top=image.height,bottom=0,left=image.width,right=0;
   for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(rgba[(y*image.width+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   for(let y=Math.max(top,bottom-24);y<=bottom;y++)for(let x=0;x<image.width;x++)if(rgba[(y*image.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
   sprite.center.set((left+right)/2/image.width,1-bottom/image.height);
   const fullHeight=2.35*image.height/Math.max(1,bottom-top);
   sprite.scale.set(fullHeight*image.width/image.height,fullHeight,1);
   material.needsUpdate=true;sprite.visible=true;
 },undefined,()=>{const message=document.getElementById('message');message.textContent='No se pudo cargar el personaje. Recargá la página.';message.style.opacity=1;});
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,32),new THREE.MeshBasicMaterial({color:0x17271d,transparent:true,opacity:.17,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.025,-.12);shadow.scale.set(.65,.8,1);root.add(shadow);
 return {root,animate(){/* Undeformed key pose until a full animation is validated. */}};
}
