// Workflows ComfyUI (formato API) de personajes y tablas de Deriva: node art/comfyui-riders.mjs
// Escribe art/characters/comfyui/*.api.json, art/boards/comfyui/*.api.json y los lotes batch.json.
import {writeFileSync,mkdirSync} from 'node:fs';

// Poses del rider original aplanadas sobre gris (art/characters/refs/) y panorama de la Quebrada, subidos a Comfy Cloud.
const REF={
 neutral:'b671a87a2997975050f76fcc26fb455feab2990a13fc907d743994b293d4b928.png',
 left:'de8abe2b15d34e00e6c7b38a24f09747c90b8b8b9700017da6d1345e77de46bd.png',
 right:'588532820905179b4b047e477f51b859af132491260b25dd66a44072861f59c1.png',
 quebrada:'2b910e004211af4efc5d2d9e69196f141d9515943793ea99992046247a08761c.png'
};
const BG='plain flat light grey background (#d6d6d2), no floor, no shadow on the background, no text, no border';
const STYLE='Match exactly the illustration style of the reference rider: clean ink outlines, soft cel shading, muted natural colours, semi-realistic adult proportions.';
const NOBOARD='Remove the longboard completely: no deck, no trucks, no wheels. Keep both shoes exactly where they stood on the deck, soles level, as if standing on an invisible board.';

export const CHARACTERS={
 tomi:{name:'Tomi',tag:'El de siempre',original:true,
  look:'the SAME rider as the reference: short dark curly hair, ochre-yellow hoodie, dark green trousers, burgundy cross-body bag, brown suede skate shoes'},
 killa:{name:'Killa',tag:'De la Quebrada',
  look:'a young Kolla woman from the Quebrada de Humahuaca, warm brown skin, long black hair in two braids, a knitted Andean wool beanie with earflaps in muted red and ochre, cropped light-blue denim jacket over a mustard knit sweater, wide dark brown trousers, white canvas sneakers, small woven shoulder bag with a geometric pattern. Contemporary skater style, not a folkloric costume'},
 ale:{name:'Ale',tag:'Estilo propio',
  look:'a non-binary young adult with an androgynous look, short lilac-dyed hair with an undercut, small silver earrings, oversized teal t-shirt over a long-sleeve cream and rust striped shirt, wide black cargo trousers, tall white socks with stripes, chunky white sneakers'},
 ramon:{name:'Ramón',tag:'Veterano del downhill',
  look:'a fit man around sixty years old, short grey hair and a trimmed grey beard, faded olive cap, open light denim shirt over a white t-shirt, rolled beige chinos, worn brown leather skate shoes, black slide gloves with white pucks on the palms'},
 nia:{name:'Nia',tag:'Velocidad pura',
  look:'a young Afro-Latina woman with dark brown skin and a large natural afro, olive green bomber jacket, black leggings with grey knee pads, white high-top sneakers, small black backpack with a skate helmet clipped to it'}
};
export const BOARDS={
 cardonal:{name:'Cardonal',shape:'pintail 42 in',wheels:'#e0773f',
  graphic:'silhouettes of tall cardón cacti against a terracotta and apricot sunset gradient, small white clouds'},
 siete:{name:'Siete Colores',shape:'drop-through 40 in with cut-outs near both ends',wheels:'#9b5fa8',
  graphic:'diagonal bands of red, purple, ochre, rust, green and cream like the strata of the Cerro de los Siete Colores'},
 garza:{name:'Garza',shape:'dancer 46 in with symmetrical kicktails',wheels:'#e8d7b8',
  graphic:'a white heron with coral wing tips among teal tropical leaves and red hibiscus flowers, aged paint texture'},
 faroles:{name:'Faroles',shape:'cruiser 38 in with a small kicktail',wheels:'#f2c46b',
  graphic:'a deep blue night over adobe rooftops, warm glowing street lamps and small stars'},
 tejido:{name:'Tejido',shape:'drop-through 40 in with cut-outs near both ends',wheels:'#c7443b',
  graphic:'an original geometric pattern inspired by Andean weaving: stacked rhombuses and zigzags in red, mustard, teal and cream'},
 condor:{name:'Cóndor',shape:'pintail 42 in',wheels:'#3d3a36',
  graphic:'natural light maple wood with a fine engraved line drawing of an Andean condor with open wings, the wood grain clearly visible'}
};

const gem=(prompt,seed,aspect,images)=>({class_type:'GeminiImage2Node',inputs:{prompt,model:'gemini-3-pro-image-preview',seed,aspect_ratio:aspect,resolution:'1K',response_modalities:'IMAGE',images}});
const load=image=>({class_type:'LoadImage',inputs:{image}});
const save=(from,prefix)=>({class_type:'SaveImage',inputs:{images:[from,0],filename_prefix:prefix}});
const batch=(a,b)=>({class_type:'BatchImagesNode',inputs:{'images.image0':[a,0],'images.image1':[b,0]}});
function cutouts(g,sources,prefix){g['90']={class_type:'LoadBackgroundRemovalModel',inputs:{bg_removal_name:'birefnet.safetensors'}};
 sources.forEach(([from,name],i)=>{const b=100+i*10;
  g[b]={class_type:'RemoveBackground',inputs:{bg_removal_model:['90',0],image:[from,0]}};
  g[b+1]={class_type:'InvertMask',inputs:{mask:[String(b),0]}};
  g[b+2]={class_type:'JoinImageWithAlpha',inputs:{image:[from,0],alpha:[String(b+1),0]}};
  g[b+3]=save(String(b+2),`${prefix}_${name}_cutout`);});}

function character(id,seed){
 const c=CHARACTERS[id],p=`deriva/rider_${id}`;
 const g={'1':load(REF.neutral),'2':load(REF.left),'3':load(REF.right)};
 g['10']=gem(`Full-body character design portrait for a longboard game: ${c.look}. Standing relaxed at three-quarter front view facing the viewer, whole body visible from head to shoes, centred with margin, no longboard, no props. ${BG}. ${STYLE}`,seed,'2:3',['1',0]);
 g['11']=save('10',`${p}_portrait`);
 if(c.original){
  // El rider actual conserva sus poses: solo se le quita la tabla.
  [['neutral','1'],['left','2'],['right','3']].forEach(([pose,ref],i)=>{const n=20+i*10;
   g[n]=gem(`Edit this image. ${NOBOARD} Keep the rider, pose, clothing, framing and illustration style exactly the same. ${BG}.`,seed+1+i,'2:3',[ref,0]);g[n+1]=save(String(n),`${p}_${pose}`);});
 }else{
  g['19']=batch('10','1');
  g['20']=gem(`Draw the character from the first image (same face, hair, skin tone, body type, clothing and colours) in EXACTLY the pose, camera angle (seen from behind at three-quarters, low camera), scale and position in the frame of the rider in the second image: knees bent, feet apart, arms out for balance. ${NOBOARD} ${BG}. ${STYLE}`,seed+1,'2:3',['19',0]);
  g['21']=save('20',`${p}_neutral`);
  [['left','2'],['right','3']].forEach(([pose,ref],i)=>{const n=30+i*10;
   g[n-1]=batch('20',ref);
   g[n]=gem(`Draw the character from the first image in EXACTLY the carving pose, camera angle, scale and framing of the rider in the second image, clearly leaning the whole body into a ${pose} turn exactly as much as the rider in the second image: hips, shoulders and knees tilted toward the ${pose}, weight on the ${pose} edge, one arm lower than the other. Keep the same front foot, stance and bag side as the first image; never mirror the character. ${NOBOARD} ${BG}. ${STYLE}`,seed+2+i,'2:3',[String(n-1),0]);
   g[n+1]=save(String(n),`${p}_${pose}`);});
 }
 cutouts(g,[['10','portrait'],['20','neutral'],['30','left'],['40','right']],p);
 return g;
}
// Re-pose (v2, used for Killa and Nia): the chained generation above let the model invent a stance, and two
// riders came out with feet side by side, not a longboard stance. Here each pose is an EDIT of the original
// rider's pose: only the identity changes (from the character sheet), legs, feet and framing stay exact.
export const IDENTITY={
 killa:'95f55af4e6bc9a88df8a97747061eefde5c65b5b92602ded3dcc0479c9c085db.png',
 nia:'9ee8c77addeb547a60366a4dd6f619064659ca1e194647e7764a6ea3caae6f75.png'
};
// Details the edit must keep in every pose (v2.1: Nia's backpack appeared in only one of three poses).
export const KEEP={nia:'She wears her small black backpack with the skate helmet clipped to it, clearly visible on her back. '};
function repose(id,seed,only=['neutral','left','right']){
 const p=`deriva/rider_${id}_v2`;
 const g={'1':load(REF.neutral),'2':load(REF.left),'3':load(REF.right),'4':load(IDENTITY[id])};
 [['neutral','1'],['left','2'],['right','3']].forEach(([pose,ref],i)=>{if(!only.includes(pose))return;const n=20+i*10;
  g[n-1]=batch(ref,'4');
  g[n]=gem(`Edit the first image: replace the rider with the character from the second image (same face, hair, skin tone, body type, clothing, colours and accessories). Keep EXACTLY the pose of the first image: the same longboard stance with the feet one behind the other along the board, the same knee bend, lean, arm positions, camera angle, scale and position in the frame. Do not open the legs sideways. ${KEEP[id]||''}${NOBOARD} ${BG}. ${STYLE}`,seed+i,'2:3',[String(n-1),0]);
  g[n+1]=save(String(n),`${p}_${pose}`);});
  cutouts(g,[['20','neutral'],['30','left'],['40','right']].filter(([,pose])=>only.includes(pose)),p);
 return g;
}
function board(id,seed){
 const b=BOARDS[id],p=`deriva/board_${id}`;
 const g={'1':load(REF.quebrada)};
 g['10']=gem(`Top-down orthographic product view of the BOTTOM graphic of one longboard deck, without trucks or wheels. The deck is vertical, nose at the top, the whole deck visible with generous margin, centred. Shape: ${b.shape}. Graphic: ${b.graphic}. The thin layered maple edge is visible around the outline. Painted in the hand-painted gouache style and palette of the reference painting. No text, no logos, no letters, no numbers. ${BG}.`,seed,'9:16',['1',0]);
 g['11']=save('10',p);cutouts(g,[['10','deck']],p);return g;
}

const out={};let seed=5100;
for(const id of Object.keys(CHARACTERS)){seed+=10;out[`characters/comfyui/rider-${id}.api.json`]=character(id,seed);}
seed=5600;for(const id of Object.keys(BOARDS)){seed+=10;out[`boards/comfyui/board-${id}.api.json`]=board(id,seed);}
const root=new URL('.',import.meta.url);
for(const [path,wf] of Object.entries(out)){const file=new URL(path,root);mkdirSync(new URL('.',file),{recursive:true});writeFileSync(file,JSON.stringify(wf,null,1));}
writeFileSync(new URL('characters/comfyui/batch.json',root),JSON.stringify(Object.entries(out).map(([path,workflow])=>({tool:'submit_workflow',description:path.split('/').pop().replace('.api.json',''),workflow}))));
const redo={};seed=5900;for(const id of Object.keys(IDENTITY)){seed+=10;redo[`characters/comfyui/rider-${id}-v2.api.json`]=repose(id,seed);}
redo['characters/comfyui/rider-nia-v2.1.api.json']=repose('nia',5940,['neutral','right']);
for(const [path,wf] of Object.entries(redo)){const file=new URL(path,root);writeFileSync(file,JSON.stringify(wf,null,1));}
writeFileSync(new URL('characters/comfyui/batch-v2.json',root),JSON.stringify(Object.entries(redo).map(([path,workflow])=>({tool:'submit_workflow',description:path.split('/').pop().replace('.api.json',''),workflow}))));
console.log(Object.keys(out).concat(Object.keys(redo)).join('\n'));
