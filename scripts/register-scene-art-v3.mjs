import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const [kind,id,source]=process.argv.slice(2),root='content/scene-art-v3';
const plan=JSON.parse(await fs.readFile(`${root}/prompts.json`,'utf8'));
const spec=plan.find(a=>a.kind===kind&&a.id===id);if(!spec||!source)throw Error('Unknown generated scene.');
let manifest;try{manifest=JSON.parse(await fs.readFile(`${root}/manifest.json`,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;manifest={tool:'built-in image_gen',humanAdoption:'not-received',assets:[]};}
if(manifest.assets.some(a=>a.kind===kind&&a.id===id))throw Error('Retain existing scene original.');
const bytes=await fs.readFile(source),sha256=createHash('sha256').update(bytes).digest('hex'),originalFile=`${root}/originals/${kind}-${id}-v1.png`;
await fs.mkdir(path.dirname(originalFile),{recursive:true});await fs.writeFile(originalFile,bytes,{flag:'wx'});
const m=await sharp(bytes).metadata();manifest.assets.push({...spec,originalFile,sourceFile:source,sha256,width:m.width,height:m.height,recordedAt:new Date().toISOString()});
await fs.writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({kind,id,sha256,width:m.width,height:m.height,originalFile}));
