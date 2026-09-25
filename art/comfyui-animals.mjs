// Workflows ComfyUI (formato API) de los animales que cruzan la ruta: node art/comfyui-animals.mjs
// Escribe art/animals/comfyui/<id>.api.json y batch.json. Cada animal son dos cuadros de caminata de perfil,
// encadenados (el segundo es una edición del primero) para que sean el mismo animal, y recortados con BiRefNet.
import {writeFileSync,mkdirSync} from 'node:fs';

// Pose neutral del rider original aplanada sobre gris (art/characters/refs/), ya subida a Comfy Cloud:
// fija el estilo de ilustración para que los animales y los riders se vean del mismo mundo.
const STYLE_REF='b671a87a2997975050f76fcc26fb455feab2990a13fc907d743994b293d4b928.png';
const BG='plain flat light grey background (#d6d6d2), no ground, no shadow on the background, no text, no border';
const STYLE='Match exactly the illustration style of the reference image: clean ink outlines, soft cel shading, muted natural colours, semi-realistic proportions. Do not draw the person from the reference, only use its style.';

export const ANIMALS={
 llama:{name:'Llama',
  look:'one adult llama from the Quebrada de Humahuaca (Jujuy, Argentina) with thick cream and warm brown wool, long neck held upright, banana-shaped ears decorated with small colourful woollen tassels in pink, red and yellow as in the Andean señalada tradition'}
};

const gem=(prompt,seed,images)=>({class_type:'GeminiImage2Node',inputs:{prompt,model:'gemini-3-pro-image-preview',seed,aspect_ratio:'1:1',resolution:'1K',response_modalities:'IMAGE',images}});
const save=(from,prefix)=>({class_type:'SaveImage',inputs:{images:[from,0],filename_prefix:prefix}});
function cutouts(g,sources,prefix){g['90']={class_type:'LoadBackgroundRemovalModel',inputs:{bg_removal_name:'birefnet.safetensors'}};
 sources.forEach(([from,name],i)=>{const b=100+i*10;
  g[b]={class_type:'RemoveBackground',inputs:{bg_removal_model:['90',0],image:[from,0]}};
  g[b+1]={class_type:'InvertMask',inputs:{mask:[String(b),0]}};
  g[b+2]={class_type:'JoinImageWithAlpha',inputs:{image:[from,0],alpha:[String(b+1),0]}};
  g[b+3]=save(String(b+2),`${prefix}_${name}_cutout`);});}

function animal(id,seed){
 const a=ANIMALS[id],p=`deriva/animal_${id}`;
 const g={'1':{class_type:'LoadImage',inputs:{image:STYLE_REF}}};
 // Cuadro A: perfil caminando hacia la derecha, cuerpo entero con margen.
 g['10']=gem(`Game sprite, exact side profile view of ${a.look}, walking to the RIGHT across the frame, mid-stride: the front leg nearest the viewer reaches forward and the hind leg nearest the viewer pushes back. The whole animal is visible from the tips of the ears to the hooves, centred, with generous margin, feet at the same height near the bottom. ${BG}. ${STYLE}`,seed,['1',0]);
 g['11']=save('10',`${p}_walk_a`);
 // Cuadro B: el mismo animal, mismo encuadre, la fase contraria del paso.
 g['20']=gem(`Edit this image: the same ${a.name.toLowerCase()} in exactly the same position, size, framing, colours and style, at the opposite phase of the walk cycle: the legs that were forward are now back and the legs that were back are now forward, the legs nearest the viewer close together under the body. Keep the head, neck, ears, tassels and wool identical. ${BG}.`,seed+1,['10',0]);
 g['21']=save('20',`${p}_walk_b`);
 cutouts(g,[['10','walk_a'],['20','walk_b']],p);
 return g;
}

const root=new URL('.',import.meta.url),out={};let seed=6100;
for(const id of Object.keys(ANIMALS)){seed+=10;out[`animals/comfyui/${id}.api.json`]=animal(id,seed);}
for(const [path,wf] of Object.entries(out)){const file=new URL(path,root);mkdirSync(new URL('.',file),{recursive:true});writeFileSync(file,JSON.stringify(wf,null,1));}
writeFileSync(new URL('animals/comfyui/batch.json',root),JSON.stringify(Object.entries(out).map(([path,workflow])=>({tool:'submit_workflow',description:path.split('/').pop().replace('.api.json',''),workflow}))));
console.log(Object.keys(out).join('\n'));
