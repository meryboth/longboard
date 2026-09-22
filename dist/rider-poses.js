import * as THREE from './vendor/three.module.js';

export function choosePose(current,steer){
 if(steer<-.30)return 'left';
 if(steer>.30)return 'right';
 if(Math.abs(steer)<.13)return 'neutral';
 return current;
}

export function createRider(){
 const root=new THREE.Group(),loader=new THREE.TextureLoader(),poses=new Map();
 let selected='neutral',lastTime=0;
 const wind={value:0},clock={value:0};
 const names={neutral:'grounded-pose-v3.png',left:'carve-left-v2.png',right:'carve-right-v1.png'};
 function loadPose(name,file){
   const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false,opacity:0});
   // Texture-space cloth motion is restricted to the hoodie. Shoes, board and head stay still.
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
   material.customProgramCacheKey=()=> 'deriva-hoodie-v1';
   const sprite=new THREE.Sprite(material);sprite.position.set(0,.025,0);sprite.visible=false;root.add(sprite);
   loader.load(`./assets/rider-2d/${file}`,texture=>{
     texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;material.map=texture;
     const img=texture.image,canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;
     let top=img.height,bottom=0,left=img.width,right=0;
     for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
     for(let y=Math.max(top,bottom-24);y<=bottom;y++)for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
     sprite.center.set((left+right)/2/img.width,1-bottom/img.height);
     const fullHeight=2.35*img.height/Math.max(1,bottom-top);sprite.scale.set(fullHeight*img.width/img.height,fullHeight,1);
     material.needsUpdate=true;poses.set(name,{sprite,material,weight:name==='neutral'?1:0});
     if(name==='neutral'){sprite.visible=true;material.opacity=1;}
   });
 }
 Object.entries(names).forEach(([name,file])=>loadPose(name,file));
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,32),new THREE.MeshBasicMaterial({color:0x17271d,transparent:true,opacity:.19,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.025,-.12);shadow.scale.set(.65,.8,1);root.add(shadow);
 return {root,animate(time,steer,braking,moving,speed=12){
   const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
   selected=choosePose(selected,steer);
   const target=poses.has(selected)?selected:'neutral';
   if(moving)clock.value=time;
   wind.value=THREE.MathUtils.damp(wind.value,moving?Math.min(1.4,.25+speed/24):0,4,dt||.016);
   for(const [name,pose] of poses){pose.weight=THREE.MathUtils.damp(pose.weight,name===target?1:0,24,dt||.016);pose.material.opacity=pose.weight;pose.sprite.visible=pose.weight>.005;}
 }};
}
