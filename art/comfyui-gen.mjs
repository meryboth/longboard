// Genera los workflows ComfyUI (formato API) del arte de Deriva.
// node art/comfyui-gen.mjs  ->  art/houses/comfyui/*.api.json, art/environment/comfyui/*.api.json
import {writeFileSync,mkdirSync} from 'node:fs';

// Referencias subidas a Comfy Cloud (dist/assets/scenery/valley-city-v1.png y dist/assets/walls/mural-v1.png).
const REF_CITY='fcf7faee0ce3266e4dbf08df86a02d06652326f7fdc721fff1d7a6aa8b0c7454.png';
const REF_MURAL='dafbaafa56bfbec06371db651a9fe1ba0b070331d1f95e4c06dc05d3277493d6.png';

const STYLE=`STYLE: warm golden-hour painterly gouache illustration, soft visible brush texture, gentle weathering, palette of teal, terracotta, cream, ochre and muted pastels. Inspired by the hillside houses of Valparaiso, but fictional.
FORMAT: a GAME TEXTURE for a 3D box. A perfectly flat orthographic elevation of ONE wall, seen dead-on, zero perspective, no depth. The wall fills the ENTIRE frame edge to edge: left and right image edges are the building corners, the bottom edge is the ground line with a thin weathered stone plinth, the top edge is the eave with a simple cornice. Two storeys.
FORBIDDEN: sky, roof, ground, street, people, animals, vehicles, text, letters, signs, numbers, plants in front of the wall, borders, cast shadows from outside objects. Even, soft, shadowless lighting; only subtle ambient occlusion inside window recesses.`;
const REFS_NOTE='The reference images are the painted city panorama and a street mural from our game: match their painting style and palette only, do not copy their content.';
const FRONT='Paint the FRONT FACADE of this house, a wall 7 m wide by 7 m tall (square). Ground floor: a wooden front door slightly off-centre and one window. Upper floor: two windows with shutters and a small balcony with iron railing. Windows are dark glass with a hint of warm interior, clearly framed.';
const SIDE='The reference image is the approved FRONT facade of this exact house. Paint the SIDE FACADE of the SAME house, a wall 9 m wide by 7 m tall, facing the street: identical wall material, colours, window frames, shutters, plinth, cornice and painting style, so both walls meet seamlessly at the corner. Three windows per floor evenly spaced, one drainpipe at the right corner, no door.';

export const VARIANTS={
 b:'HOUSE: stucco walls painted warm ochre yellow, white window trim, green wooden shutters, weathered patches of bare plaster.',
 c:'HOUSE: rough plaster walls painted terracotta red with patches, cream cornice and window frames, teal wooden door.',
 d:'HOUSE: pastel pink stucco walls, lilac window frames, cream balcony with black iron railing.',
 e:'HOUSE: cream-white plastered ground floor, upper floor clad in horizontal wooden clapboard painted faded sky blue, white trim.',
 f:'HOUSE: corrugated metal sheets painted sage green with rust streaks, ochre window frames and door.',
 g:'HOUSE: corrugated metal sheets painted soft lavender, mustard yellow window frames and door, small rusty bolts.',
 h:'HOUSE: deep indigo blue plaster walls, cream window frames, ground floor with a closed rolling metal shutter of a small corner shop instead of the window, no signage.'
};
const prompt=(task,variant,refs=true)=>[task,variant,refs?REFS_NOTE:'',STYLE].filter(Boolean).join('\n\n');

// ---------- Nano Banana Pro ----------
function nanoBananaHouse(id,seed){
 return {
  '1':{class_type:'LoadImage',inputs:{image:REF_CITY},_meta:{title:'Ref: panorama ciudad'}},
  '2':{class_type:'LoadImage',inputs:{image:REF_MURAL},_meta:{title:'Ref: mural'}},
  '3':{class_type:'BatchImagesNode',inputs:{'images.image0':['1',0],'images.image1':['2',0]}},
  '30':{class_type:'GeminiImage2Node',inputs:{prompt:prompt(FRONT,VARIANTS[id]),model:'gemini-3-pro-image-preview',seed,aspect_ratio:'1:1',resolution:'1K',response_modalities:'IMAGE',images:['3',0]},_meta:{title:'Nano Banana Pro · FRENTE'}},
  '31':{class_type:'SaveImage',inputs:{images:['30',0],filename_prefix:`deriva/nb_house_${id}_front`}},
  '41':{class_type:'GeminiImage2Node',inputs:{prompt:prompt(SIDE,VARIANTS[id],false),model:'gemini-3-pro-image-preview',seed:seed+1,aspect_ratio:'4:3',resolution:'1K',response_modalities:'IMAGE',images:['30',0]},_meta:{title:'Nano Banana Pro · LATERAL'}},
  '42':{class_type:'SaveImage',inputs:{images:['41',0],filename_prefix:`deriva/nb_house_${id}_side`}}
 };
}

// ---------- Flux.2 Dev (pesos abiertos, multi-referencia) ----------
function flux2House(id,seed){
 const g={
  '1':{class_type:'UNETLoader',inputs:{unet_name:'flux2_dev_fp8mixed.safetensors',weight_dtype:'default'}},
  '2':{class_type:'CLIPLoader',inputs:{clip_name:'mistral_3_small_flux2_fp8.safetensors',type:'flux2'}},
  '3':{class_type:'VAELoader',inputs:{vae_name:'flux2-vae.safetensors'}},
  '4':{class_type:'LoadImage',inputs:{image:REF_CITY}},
  '5':{class_type:'LoadImage',inputs:{image:REF_MURAL}},
  '6':{class_type:'ImageScaleToTotalPixels',inputs:{image:['4',0],upscale_method:'lanczos',megapixels:1,resolution_steps:1}},
  '7':{class_type:'ImageScaleToTotalPixels',inputs:{image:['5',0],upscale_method:'lanczos',megapixels:1,resolution_steps:1}},
  '8':{class_type:'VAEEncode',inputs:{pixels:['6',0],vae:['3',0]}},
  '9':{class_type:'VAEEncode',inputs:{pixels:['7',0],vae:['3',0]}},
  '16':{class_type:'KSamplerSelect',inputs:{sampler_name:'euler'}}
 };
 const pass=(base,text,refs,w,h,seed,prefix)=>{
  g[base]={class_type:'CLIPTextEncode',inputs:{text,clip:['2',0]}};
  g[base+1]={class_type:'FluxGuidance',inputs:{conditioning:[String(base),0],guidance:4}};
  let cond=String(base+1);refs.forEach((r,i)=>{g[base+2+i]={class_type:'ReferenceLatent',inputs:{conditioning:[cond,0],latent:[r,0]}};cond=String(base+2+i);});
  g[base+5]={class_type:'BasicGuider',inputs:{model:['1',0],conditioning:[cond,0]}};
  g[base+6]={class_type:'RandomNoise',inputs:{noise_seed:seed}};
  g[base+7]={class_type:'Flux2Scheduler',inputs:{steps:20,width:w,height:h}};
  g[base+8]={class_type:'EmptyFlux2LatentImage',inputs:{width:w,height:h,batch_size:1}};
  g[base+9]={class_type:'SamplerCustomAdvanced',inputs:{noise:[String(base+6),0],guider:[String(base+5),0],sampler:['16',0],sigmas:[String(base+7),0],latent_image:[String(base+8),0]}};
  g[base+10]={class_type:'VAEDecode',inputs:{samples:[String(base+9),0],vae:['3',0]}};
  g[base+11]={class_type:'SaveImage',inputs:{images:[String(base+10),0],filename_prefix:prefix}};
  return String(base+10);
 };
 const front=pass(20,prompt(FRONT,VARIANTS[id]),['8','9'],1024,1024,seed,`deriva/flux2_house_${id}_front`);
 g['40']={class_type:'ImageScaleToTotalPixels',inputs:{image:[front,0],upscale_method:'lanczos',megapixels:1,resolution_steps:1}};
 g['41']={class_type:'VAEEncode',inputs:{pixels:['40',0],vae:['3',0]}};
 pass(50,prompt(SIDE,VARIANTS[id],false),['41'],1184,880,seed+1,`deriva/flux2_house_${id}_side`);
 return g;
}

// ---------- Qwen-Image-Edit 2511 (pesos abiertos, multi-imagen) ----------
function qwenHouse(id,seed){
 const NEG='perspective, vanishing point, sky, roof, street, ground, people, text, letters, watermark, blurry, photo';
 const g={
  '1':{class_type:'UNETLoader',inputs:{unet_name:'qwen_image_edit_2511_fp8mixed.safetensors',weight_dtype:'default'}},
  '2':{class_type:'CLIPLoader',inputs:{clip_name:'qwen_2.5_vl_7b_fp8_scaled.safetensors',type:'qwen_image'}},
  '3':{class_type:'VAELoader',inputs:{vae_name:'qwen_image_vae.safetensors'}},
  '4':{class_type:'ModelSamplingAuraFlow',inputs:{model:['1',0],shift:3.1}},
  '6':{class_type:'LoadImage',inputs:{image:REF_CITY}},
  '7':{class_type:'LoadImage',inputs:{image:REF_MURAL}}
 };
 const pass=(base,text,imgs,w,h,seed,prefix)=>{
  const im={};imgs.forEach((r,i)=>im['image'+(i+1)]=[r,0]);
  g[base]={class_type:'TextEncodeQwenImageEditPlus',inputs:{clip:['2',0],prompt:text,vae:['3',0],...im}};
  g[base+1]={class_type:'TextEncodeQwenImageEditPlus',inputs:{clip:['2',0],prompt:NEG,vae:['3',0],...im}};
  g[base+2]={class_type:'EmptySD3LatentImage',inputs:{width:w,height:h,batch_size:1}};
  g[base+3]={class_type:'KSampler',inputs:{model:['4',0],seed,steps:20,cfg:2.5,sampler_name:'euler',scheduler:'simple',positive:[String(base),0],negative:[String(base+1),0],latent_image:[String(base+2),0],denoise:1}};
  g[base+4]={class_type:'VAEDecode',inputs:{samples:[String(base+3),0],vae:['3',0]}};
  g[base+5]={class_type:'SaveImage',inputs:{images:[String(base+4),0],filename_prefix:prefix}};
  return String(base+4);
 };
 const front=pass(10,prompt(FRONT,VARIANTS[id]),['6','7'],1024,1024,seed,`deriva/qwen_house_${id}_front`);
 pass(30,prompt(SIDE,VARIANTS[id],false),[front],1184,880,seed+1,`deriva/qwen_house_${id}_side`);
 return g;
}

// ---------- Z-Image Turbo (pesos abiertos, solo texto) ----------
function zimageHouse(id,seed){
 const ZSTYLE='Hand-painted gouache game concept art, warm golden-hour light. ';
 const sideText=SIDE.replace('The reference image is the approved FRONT facade of this exact house. ','');
 const g={
  '1':{class_type:'UNETLoader',inputs:{unet_name:'z_image_turbo_bf16.safetensors',weight_dtype:'default'}},
  '2':{class_type:'CLIPLoader',inputs:{clip_name:'qwen_3_4b.safetensors',type:'lumina2'}},
  '3':{class_type:'VAELoader',inputs:{vae_name:'ae.safetensors'}},
  '4':{class_type:'ModelSamplingAuraFlow',inputs:{model:['1',0],shift:3}}
 };
 const pass=(base,text,w,h,seed,prefix)=>{
  g[base]={class_type:'CLIPTextEncode',inputs:{text,clip:['2',0]}};
  g[base+1]={class_type:'ConditioningZeroOut',inputs:{conditioning:[String(base),0]}};
  g[base+2]={class_type:'EmptySD3LatentImage',inputs:{width:w,height:h,batch_size:1}};
  g[base+3]={class_type:'KSampler',inputs:{model:['4',0],seed,steps:8,cfg:1,sampler_name:'res_multistep',scheduler:'simple',positive:[String(base),0],negative:[String(base+1),0],latent_image:[String(base+2),0],denoise:1}};
  g[base+4]={class_type:'VAEDecode',inputs:{samples:[String(base+3),0],vae:['3',0]}};
  g[base+5]={class_type:'SaveImage',inputs:{images:[String(base+4),0],filename_prefix:prefix}};
 };
 pass(10,ZSTYLE+prompt(FRONT,VARIANTS[id],false),1024,1024,seed,`deriva/zimage_house_${id}_front`);
 pass(30,ZSTYLE+prompt(sideText,VARIANTS[id],false),1184,880,seed+1,`deriva/zimage_house_${id}_side`);
 return g;
}

// ---------- Entorno (Nano Banana Pro) ----------
const ENV_STYLE='Match the painting style and palette of the reference images (painted city panorama and street mural from our game): warm golden-hour painterly gouache, soft brush texture, teal, olive, ochre, terracotta and cream.';
const SPRITE_RULES='Each element is completely isolated on a flat, uniform, pure magenta (#FF00FF) background, centred in its own quadrant with generous empty margin, fully visible from base to top, seen from the side at eye level. No ground plane, no cast shadow on the background, no text, no borders, no overlapping between quadrants.';
export const ENV={
 ground:{aspect:'1:1',res:'1K',cutout:false,prompt:`A SEAMLESS TILEABLE texture seen straight from above (top-down, orthographic): dry Mediterranean hillside ground with short sun-bleached grass, small clumps of green grass, tiny yellow and white wildflowers, and a few patches of warm ochre dirt and pebbles. Uniform density everywhere, no focal point, no large objects, no shadows of objects, even flat lighting. The left edge must continue seamlessly into the right edge and the top into the bottom. ${ENV_STYLE}`},
 trees:{aspect:'1:1',res:'2K',cutout:true,prompt:`A 2x2 sprite sheet of four different trees for a 2.5D game: top-left a tall slender Italian cypress, top-right a Chilean palm tree, bottom-left a eucalyptus tree with pale trunk, bottom-right a rounded jacaranda tree in lilac bloom. ${SPRITE_RULES} ${ENV_STYLE}`},
 shrubs:{aspect:'1:1',res:'2K',cutout:true,prompt:`A 2x2 sprite sheet for a 2.5D game: top-left a flowering magenta bougainvillea bush, top-right a rounded dense green shrub, bottom-left a cluster of weathered ochre-grey boulders with a few grass tufts, bottom-right a blue-green agave plant. ${SPRITE_RULES} ${ENV_STYLE}`}
};
function nanoBananaEnv(key,seed){
 const e=ENV[key];
 const g={
  '1':{class_type:'LoadImage',inputs:{image:REF_CITY}},
  '2':{class_type:'LoadImage',inputs:{image:REF_MURAL}},
  '3':{class_type:'BatchImagesNode',inputs:{'images.image0':['1',0],'images.image1':['2',0]}},
  '10':{class_type:'GeminiImage2Node',inputs:{prompt:e.prompt,model:'gemini-3-pro-image-preview',seed,aspect_ratio:e.aspect,resolution:e.res,response_modalities:'IMAGE',images:['3',0]},_meta:{title:'Nano Banana Pro · '+key}},
  '11':{class_type:'SaveImage',inputs:{images:['10',0],filename_prefix:`deriva/env_${key}`}}
 };
 if(e.cutout)Object.assign(g,{
  '20':{class_type:'LoadBackgroundRemovalModel',inputs:{bg_removal_name:'birefnet.safetensors'}},
  '21':{class_type:'RemoveBackground',inputs:{bg_removal_model:['20',0],image:['10',0]}},
  '22':{class_type:'InvertMask',inputs:{mask:['21',0]}},
  '23':{class_type:'JoinImageWithAlpha',inputs:{image:['10',0],alpha:['22',0]}},
  '24':{class_type:'SaveImage',inputs:{images:['23',0],filename_prefix:`deriva/env_${key}_cutout`}}
 });
 return g;
}

// ---------- Salida ----------
const out={};
const nbSeeds={b:1201,c:1301,d:1401,e:1501,f:1601,g:1701,h:1801};
for(const [id,s] of Object.entries(nbSeeds))out[`houses/comfyui/nb-house-${id}.api.json`]=nanoBananaHouse(id,s);
for(const id of ['b','c']){
 out[`houses/comfyui/compare/flux2-house-${id}.api.json`]=flux2House(id,nbSeeds[id]);
 out[`houses/comfyui/compare/qwen-edit-house-${id}.api.json`]=qwenHouse(id,nbSeeds[id]);
 out[`houses/comfyui/compare/zimage-house-${id}.api.json`]=zimageHouse(id,nbSeeds[id]);
}
out['environment/comfyui/nb-env-ground.api.json']=nanoBananaEnv('ground',2101);
out['environment/comfyui/nb-env-trees.api.json']=nanoBananaEnv('trees',2201);
out['environment/comfyui/nb-env-shrubs.api.json']=nanoBananaEnv('shrubs',2301);
const root=new URL('.',import.meta.url);
for(const [path,wf] of Object.entries(out)){const file=new URL(path,root);mkdirSync(new URL('.',file),{recursive:true});writeFileSync(file,JSON.stringify(wf,null,1));}
console.log(Object.keys(out).join('\n'));
