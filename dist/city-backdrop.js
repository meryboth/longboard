import * as THREE from './vendor/three.module.js';

export function createCityBackdrop(scene,url='./assets/scenery/valley-city-v1.png'){
 const group=new THREE.Group();scene.add(group);
 const texture=new THREE.TextureLoader().load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 // A distant curved panorama fills the horizon. It never writes depth over the road.
 const vertices=[],uvs=[],indices=[];const segments=80,radius=440;
 // Vertical extent in metres relative to the road; the painting sits low so the frame gets more sky.
 const bottom=-300,top=420;
 for(let i=0;i<=segments;i++){const u=i/segments,angle=(u-.5)*Math.PI*1.30;const x=Math.sin(angle)*radius,z=-Math.cos(angle)*radius;
   vertices.push(x,bottom,z,x,top,z);uvs.push(u,0,u,1);if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false});
 const backdrop=new THREE.Mesh(geometry,material);backdrop.renderOrder=-1000;backdrop.frustumCulled=false;group.add(backdrop);
 // Distance fade: far fragments dissolve into the part of the panorama painted behind them,
 // instead of turning into a flat fog colour. Shared uniforms reach every built-in material.
 const fogUniforms={backdropMap:{value:texture},backdropTint:{value:material.color},backdropOrigin:{value:new THREE.Vector3()}};
 THREE.Material.prototype.onBeforeCompile=function(shader){Object.assign(shader.uniforms,fogUniforms);};
 backdrop.onBeforeRender=(renderer,scene,camera)=>fogUniforms.backdropOrigin.value.copy(camera.position).sub(group.position);
 THREE.ShaderChunk.fog_pars_vertex='#ifdef USE_FOG\nvarying float vFogDepth;\nvarying vec3 vFogDir;\n#endif';
 THREE.ShaderChunk.fog_vertex='#ifdef USE_FOG\nvFogDepth=-mvPosition.z;\nvFogDir=(vec4(mvPosition.xyz,0.)*viewMatrix).xyz;\n#endif';
 THREE.ShaderChunk.fog_pars_fragment=`#ifdef USE_FOG
uniform vec3 fogColor;varying float vFogDepth;varying vec3 vFogDir;
uniform float fogNear;uniform float fogFar;
uniform sampler2D backdropMap;uniform vec3 backdropTint;uniform vec3 backdropOrigin;
vec3 backdropBehind(vec3 d){
 vec2 o=backdropOrigin.xz,v=d.xz;float a=dot(v,v),b=2.*dot(o,v),c=dot(o,o)-${radius*radius}.;
 float t=(-b+sqrt(max(b*b-4.*a*c,0.)))/(2.*max(a,1e-6));vec3 hit=backdropOrigin+t*d;
 vec2 uv=vec2(atan(hit.x,-hit.z)/(${(Math.PI*1.3).toFixed(5)})+.5,(hit.y-(${bottom}.))/${top-bottom}.);
 return texture2D(backdropMap,clamp(uv,.001,.999)).rgb*backdropTint;}
#endif`;
 THREE.ShaderChunk.fog_fragment='#ifdef USE_FOG\nfloat fogFactor=smoothstep(fogNear,fogFar,vFogDepth);\ngl_FragColor.rgb=mix(gl_FragColor.rgb,backdropBehind(normalize(vFogDir)),fogFactor);\n#endif';
 return {update(distance,height,x,look){group.position.set(x*.25,height,-distance);material.color.set(look===2?'#424c7e':look===1?'#c6afd0':'#ffffff');}};
}
