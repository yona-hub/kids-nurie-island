import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const generated='C:/Users/yonaf/.codex/generated_images/01a11153-749f-7af1-9d87-047b622f384b';
const root='content/vector-generated',hash=b=>createHash('sha256').update(b).digest('hex');
const requests=[
 {id:'excavator-faceless-v1',source:'content/generated-lineart/compiled/gen-excavator-cones-v2/original.png',result:`${generated}/exec-5a31e505-94de-4794-a32e-c13bca9cfd15.png`,transparent:false,
  prompt:"Edit target: the attached approved original black-and-white children's coloring-page excavator with two traffic cones. Make a tightly controlled production revision, preserving the entire excavator silhouette, raised articulated boom, bucket, hinges, tracks, side window, door, vents, both cones, their positions, scale, angle, composition, and clean bold closed black line art on pure white paper. Remove ALL anthropomorphic facial features from the excavator: both eyes including outer eye ovals and highlight rings, both eyebrows, and the smiling mouth including its inner boundary. The front cab window should be a single clean EMPTY glazing panel with its original enclosing frame; the body panel below the front window should be clean and empty. This is a real toy-like machine, not a character. Do not turn headlights, glazing, grilles, hinges, vents, or any mechanical part into eyes or a mouth. Keep the page uncolored: white interiors, black smooth continuous outlines, no gray or shading. No new objects, no people, no text, no logo. Match the exact original drawing everywhere except removal of the face. Portrait 4:5 layout, include all original objects and margins. This output is the new line-art source, not a colored preview."},
 {id:'construction-v2',source:'content/brand-generated/originals/construction-v1.png',result:`${generated}/exec-9c801518-ea32-4cb8-b168-7de938e3ccef.png`,transparent:true,
  prompt:"Edit target: this approved miniature Working Vehicles Island home illustration for a children's coloring app. Preserve the exact premium dimensional picture-book style, yellow excavator pose and articulated raised arm, bucket pouring sand, black tracks, red fire engine and all its equipment, palm trees, cones, sand/grass, small stones, oval floating island and turquoise water rim, entire composition and lighting. Make ONE targeted correction: remove both large cartoon eyes, their white rings, and the smiling mouth from the excavator's yellow front body panel. Replace ONLY those facial features with continuous naturally shaded yellow painted metal matching the surrounding surface. No eyes, mouth, eyebrows or face on any vehicle. Keep the front windshield as blue glass and the fire engine's headlights, grille and all real mechanical parts intact. Do not add a face-like grille or stickers. No other design changes, no lettering, labels or watermark. Entire scene isolated on genuinely transparent background, preserving the original soft clean alpha silhouette including the water rim. Same landscape aspect ratio and full uncropped island."},
];
await fs.mkdir(`${root}/originals`,{recursive:true});
const records=[];
for(const r of requests){const original=await fs.readFile(r.result),sourceBytes=await fs.readFile(r.source),file=`${root}/originals/${r.id}.png`;try{await fs.writeFile(file,original,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||hash(await fs.readFile(file))!==hash(original))throw e;}
 const metadata=await sharp(original).metadata();if(r.transparent&&!metadata.hasAlpha)throw Error('Home island has no alpha channel.');
 records.push({...r,result:undefined,originalFile:file,sourceSha256:hash(sourceBytes),sha256:hash(original),width:metadata.width,height:metadata.height,generator:'standard imagegen',humanApproval:'pending'});
 if(r.id==='construction-v2'){
  for(const width of [480,960]){const b=await sharp(original).resize(width).webp({quality:94,alphaQuality:100}).toBuffer(),digest=hash(b),url=`/images/islands/construction-v2-${width}.${digest}.webp`;await fs.writeFile(path.join('apps/web/public',url),b);records.at(-1)[`delivery${width}`]={url,sha256:digest};}
 }
}
await fs.writeFile(`${root}/faceless-vehicle-generation.json`,JSON.stringify({schemaVersion:1,instruction:'I15/I17: remove facial features from working vehicles, preserve actual parts',assets:records},null,2)+'\n');
const home=records.find(r=>r.id==='construction-v2');
await fs.writeFile('apps/web/src/construction-island.ts',`// Generated delivery URLs; original/prompt/source hashes are preserved in content/vector-generated.\nexport const constructionIsland=${JSON.stringify({src:home.delivery480.url,srcSet:`${home.delivery480.url} 480w, ${home.delivery960.url} 960w`},null,2)};\n`);
console.log(JSON.stringify(records.map(({id,sha256,delivery480})=>({id,sha256,delivery480})),null,2));
