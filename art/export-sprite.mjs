// Crop a cut-out PNG to its opaque pixels and export it as WebP for the game.
//   node art/export-sprite.mjs <in.png> <out.webp> [--height 900] [--pad 12] [--union other.png ...]
// The bounds are read from the alpha channel pixel by pixel. ffmpeg's cropdetect is meant for video and gave
// wrong boxes on single images (it clipped the llama's snout, heads and feet in the portraits, board tips).
// --union makes several frames share one crop, so an animation does not jump between frames.
// Needs ffmpeg on the PATH.
import {execFileSync} from 'node:child_process';

const args=process.argv.slice(2),opt=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const [input,output]=args,height=+opt('--height',900),pad=+opt('--pad',12);
const union=args.flatMap((a,i)=>args[i-1]==='--union'?[a]:[]);
if(!input||!output){console.error('usage: node art/export-sprite.mjs <in.png> <out.webp> [--height 900] [--pad 12] [--union other.png]');process.exit(1);}

function bounds(file){
 const [w,h]=execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','csv=p=0',file]).toString().trim().split(',').map(Number);
 const alpha=execFileSync('ffmpeg',['-v','error','-i',file,'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','-'],{maxBuffer:w*h+1024});
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha[y*w+x]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 if(x1<0)throw new Error(`${file} has no opaque pixels`);
 return {x0,y0,x1,y1};
}
const b=[input,...union].map(bounds).reduce((a,c)=>({x0:Math.min(a.x0,c.x0),y0:Math.min(a.y0,c.y0),x1:Math.max(a.x1,c.x1),y1:Math.max(a.y1,c.y1)}));
const crop=`${b.x1-b.x0+1}:${b.y1-b.y0+1}:${b.x0}:${b.y0}`;
// Scale the opaque part to height - 2·pad, then add the transparent margin all round.
const filter=`crop=${crop},scale=-2:${height-2*pad},pad=iw+${2*pad}:${height}:${pad}:${pad}:color=black@0`;
execFileSync('ffmpeg',['-v','error','-y','-i',input,'-vf',filter,'-c:v','libwebp','-quality','88',output]);
console.log(`${output}  crop=${crop}  height=${height}  pad=${pad}`);
