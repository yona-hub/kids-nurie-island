import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='content/ui-art-v1',publicRoot='apps/web/public/images/ui-art-v1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const prompts=JSON.parse(await fs.readFile(root+'/prompts.json','utf8'));
const manifest=JSON.parse(await fs.readFile(root+'/manifest.json','utf8'));
if(manifest.assets.length!==prompts.length)throw Error('Generate every specified illustration before compilation.');
await fs.mkdir(publicRoot,{recursive:true});
const outputs={};
for(const spec of prompts){
 const record=manifest.assets.find(a=>a.id===spec.id);if(!record)throw Error('Missing '+spec.id);
 const original=await fs.readFile(record.originalFile);if(sha(original)!==record.sha256)throw Error('Original hash changed '+spec.id);
 const m=await sharp(original).metadata();if(!m.hasAlpha)throw Error('Transparent artwork must preserve alpha '+spec.id);
 const width=spec.kind==='surface'?1200:spec.kind==='mask'?128:192,height=spec.kind==='surface'?400:width;
 const pixels=await sharp(original).trim({threshold:6}).resize(width,height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({lossless:true}).toBuffer();
 const hash=sha(pixels),name=spec.id+'-'+hash.slice(0,16)+'.webp',file=path.join(publicRoot,name);
 try{await fs.writeFile(file,pixels,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||sha(await fs.readFile(file))!==hash)throw e;}
 outputs[spec.id]={src:'/images/ui-art-v1/'+name,width,height,sha256:hash,originalSha256:record.sha256};
}
await fs.writeFile(root+'/compiled.json',JSON.stringify({tool:manifest.tool,humanAdoption:manifest.humanAdoption,outputs},null,2)+'\n');
await fs.writeFile('apps/web/src/ui-art.ts','// Compiled from retained built-in image_gen originals; regenerate with build-ui-art-v1.mjs.\nexport const UI_ART = '+JSON.stringify(outputs,null,2)+' as const;\nexport type UiArtId = keyof typeof UI_ART;\n');
await fs.writeFile('apps/web/src/styles-ui-art.css',':root {\n  --palette-board: url("'+outputs['palette-board'].src+'");\n  --paint-dab: url("'+outputs['paint-dab'].src+'");\n}\n');
console.log(JSON.stringify({generated:prompts.length,compiled:Object.keys(outputs).length,bytes:await Promise.all(Object.values(outputs).map(async a=>(await fs.stat('apps/web/public'+a.src)).size)).then(a=>a.reduce((x,y)=>x+y,0))}));

