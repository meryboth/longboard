// Workflows ComfyUI (formato API) del look Jujuy de Deriva: node art/comfyui-jujuy.mjs
// Escribe art/jujuy/comfyui/*.api.json y el lote para Comfy Cloud en art/jujuy/comfyui/batch.json.
import {writeFileSync,mkdirSync} from 'node:fs';

// Panorama de la Quebrada (art/jujuy/source/panorama-ref.png) subido a Comfy Cloud: ancla de estilo.
const REF='2b910e004211af4efc5d2d9e69196f141d9515943793ea99992046247a08761c.png';
const STYLE='STYLE: match the hand-painted gouache technique, light and palette of the reference painting of the Quebrada de Humahuaca (Jujuy, Argentina): warm golden afternoon light, soft visible brush texture, earthy adobe tones.';
const TEXTURE='FORMAT: a GAME TEXTURE for a 3D box: a perfectly flat orthographic elevation of ONE wall seen dead-on, zero perspective. The wall fills the ENTIRE frame edge to edge: left and right edges are the building corners, the bottom edge is the ground line with a low worn plinth, the top edge is the top of the parapet of a flat mud roof. FORBIDDEN: sky, roof seen from above, ground, street, people, animals, text, signs, numbers, plants in front of the wall, borders, cast shadows from outside objects. Even soft light, subtle ambient occlusion in the openings.';
const SPRITES='Each element is completely isolated on a flat uniform pure magenta (#FF00FF) background, centred in its own quadrant with generous margin, fully visible from base to top, seen from the side at eye level. No ground plane, no shadow on the background, no text, no borders.';
const TILE='A SEAMLESS TILEABLE texture seen straight from above (top-down, orthographic), uniform density everywhere, no focal point, no large objects, no shadows of objects, even flat lighting; the left edge continues seamlessly into the right edge and the top into the bottom.';

export const HOUSES={
 j1:'whitewashed adobe walls with patches where the lime has fallen off revealing mud bricks, a deep-blue wooden door and one small window with blue wooden shutters',
 j2:'bare unplastered adobe mud-brick walls in warm earth tones, a weathered green wooden door and a small window under a lintel of cardón cactus wood',
 j3:'ochre-yellow lime-washed adobe, a wide double wooden carriage door (portón) made of cardón wood, and one window with iron bars',
 j4:'soft salmon-pink plastered adobe, a small corner shop (almacén) with a wooden door and a display window behind an iron grille, no signage',
 j5:'terracotta-red washed adobe with a cream painted plinth band, a turquoise wooden door and two small windows with iron bars',
 j6:'white adobe with a plinth of rounded river stones, an arched doorway with an old wooden door, and a clay rain spout sticking out near the top'
};
const gem=(prompt,seed,aspect,res,images)=>({class_type:'GeminiImage2Node',inputs:{prompt,model:'gemini-3-pro-image-preview',seed,aspect_ratio:aspect,resolution:res,response_modalities:'IMAGE',images}});
const save=(from,prefix)=>({class_type:'SaveImage',inputs:{images:[from,0],filename_prefix:'deriva/jujuy_'+prefix}});
const ref={class_type:'LoadImage',inputs:{image:REF},_meta:{title:'Ref: panorama Quebrada'}};
const cutout=(from,prefix)=>({
 '20':{class_type:'LoadBackgroundRemovalModel',inputs:{bg_removal_name:'birefnet.safetensors'}},
 '21':{class_type:'RemoveBackground',inputs:{bg_removal_model:['20',0],image:[from,0]}},
 '22':{class_type:'InvertMask',inputs:{mask:['21',0]}},
 '23':{class_type:'JoinImageWithAlpha',inputs:{image:[from,0],alpha:['22',0]}},
 '24':save('23',prefix+'_cutout')});

const out={};let seed=4100;
for(const [id,desc] of Object.entries(HOUSES)){seed+=10;out['house-'+id]={'1':ref,
 '10':gem(`Paint the FRONT (street) facade of a traditional one-storey adobe house from a Quebrada de Humahuaca town (Purmamarca, Tilcara, Humahuaca), built right on the street line. The wall is 8 m wide and 4.5 m tall. HOUSE: ${desc}.\n${TEXTURE}\n${STYLE}`,seed,'16:9','1K',['1',0]),'11':save('10',id+'_front'),
 '20':gem(`The reference image is the approved FRONT facade of this exact house. Paint its SIDE wall (medianera), also 8 m wide and 4.5 m tall: identical adobe material, colour, plinth, parapet and painting style, so both walls meet at the corner. Mostly plain wall with one small deep-set window with a wooden frame, subtle cracks and patches of bare adobe bricks. No door.\n${TEXTURE}`,seed+1,'16:9','1K',['10',0]),'21':save('20',id+'_side')};}
out.church={'1':ref,
 '10':gem(`Paint the FRONT facade of a small colonial Andean adobe church of the Quebrada de Humahuaca (like the churches of Purmamarca or Uquía): thick whitewashed adobe, a double wooden door of cardón wood under a round stone arch, a small round window above it, crowned by a straight white parapet with a simple cross in the middle. The facade is 10 m wide and 7 m tall.\n${TEXTURE}\n${STYLE}`,4201,'4:3','1K',['1',0]),'11':save('10','church_front'),
 '20':gem(`The reference image is the approved FRONT facade of this church. Paint the SIDE wall of its nave, 16 m long and 7 m tall: identical whitewashed adobe and painting style, three sloped buttresses painted flat, two small high windows, stone plinth. No door.\n${TEXTURE}`,4202,'21:9','1K',['10',0]),'21':save('20','church_side'),
 '30':gem(`The reference image is the approved FRONT facade of this church. Paint ONE face of its square adobe bell tower, 4.5 m wide and 8 m tall: identical whitewashed adobe and painting style, an arched belfry opening near the top with a bronze bell inside, plain wall below.\n${TEXTURE}`,4203,'9:16','1K',['10',0]),'31':save('30','church_tower')};
out.ground={'1':ref,'10':gem(`${TILE} Dry valley soil of the Quebrada de Humahuaca: pinkish-ochre compacted earth with small pebbles, sparse tufts of dry golden ichu grass and a few tiny grey-green shrubs. ${STYLE}`,4301,'1:1','1K',['1',0]),'11':save('10','ground')};
out.street={'1':ref,'10':gem(`${TILE} Compacted dirt street of a small Jujuy town: light beige-ochre packed earth with fine gravel and a few small stones, very subtle. ${STYLE}`,4401,'1:1','1K',['1',0]),'11':save('10','street')};
out.pirca={'1':ref,'10':gem(`Front elevation of a dry-stone wall (pirca) of the Quebrada de Humahuaca: stacked irregular reddish, ochre and grey field stones without mortar, about 1 m tall. The wall fills the frame edge to edge, perfectly flat and orthographic, the left edge continues seamlessly into the right edge. No sky, no ground, no plants, no borders, even light. ${STYLE}`,4501,'21:9','1K',['1',0]),'11':save('10','pirca')};
out.trees={'1':ref,'10':gem(`A 2x2 sprite sheet of four plants for a 2.5D game set in Jujuy: top-left a tall columnar cardón cactus with two upturned arms, top-right a tall slender Lombardy poplar (álamo) with golden-green leaves, bottom-left a wide spreading algarrobo tree with a twisted trunk, bottom-right a weeping molle (Peruvian pepper tree). ${SPRITES} ${STYLE}`,4601,'1:1','2K',['1',0]),'11':save('10','trees'),...cutout('10','trees')};
out.shrubs={'1':ref,'10':gem(`A 2x2 sprite sheet for a 2.5D game set in Jujuy: top-left a rounded grey-green tola shrub, top-right a tuft of dry golden ichu grass, bottom-left a cluster of reddish-ochre boulders, bottom-right a small young cardón cactus. ${SPRITES} ${STYLE}`,4701,'1:1','2K',['1',0]),'11':save('10','shrubs'),...cutout('10','shrubs')};

const dir=new URL('./jujuy/comfyui/',import.meta.url);mkdirSync(dir,{recursive:true});
for(const [name,wf] of Object.entries(out))writeFileSync(new URL(name+'.api.json',dir),JSON.stringify(wf,null,1));
writeFileSync(new URL('batch.json',dir),JSON.stringify(Object.entries(out).map(([name,workflow])=>({tool:'submit_workflow',description:'jujuy-'+name,workflow}))));
console.log(Object.keys(out).join(' '));
