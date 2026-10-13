import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),root='content/ui-art-v1';
const manifest=JSON.parse(await fs.readFile(root+'/manifest.json','utf8'));
const compiled=JSON.parse(await fs.readFile(root+'/compiled.json','utf8')).outputs;
const originals=[];
for(const record of manifest.assets){
 const original=await fs.readFile(record.originalFile);if(sha(original)!==record.sha256)throw Error('Original changed '+record.id);
 const normalized=await fs.readFile('apps/web/public'+compiled[record.id].src);if(sha(normalized)!==compiled[record.id].sha256)throw Error('Output changed '+record.id);
 const {data,info}=await sharp(normalized).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,opaque=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)transparent++;if(data[i]===255)opaque++;}
 if(!transparent||!opaque)throw Error('Alpha bounds/opaque paint required '+record.id);
 originals.push({id:record.id,sha256:record.sha256,outputSha256:compiled[record.id].sha256,transparent,opaque,width:info.width,height:info.height});
}
const mask=await sharp('apps/web/public'+compiled['paint-dab'].src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let maskCenterMinAlpha=255;for(let y=40;y<88;y++)for(let x=40;x<88;x++)maskCenterMinAlpha=Math.min(maskCenterMinAlpha,mask.data[(y*128+x)*4+3]);
// Preserve the original soft alpha; production adds an opaque CSS color core.
// Exact rendered center RGB is asserted from real Chrome pixels in the UI test.
const brandDerivatives=[];
for(const file of ['icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','ogp.png']){
 let decoder=sharp('apps/web/public/'+file);
 if(file==='ogp.png')decoder=decoder.extract({left:110,top:150,width:280,height:280});
 const {data,info}=await decoder.ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const colors=new Set();let opaque=true;
 for(let i=0;i<data.length;i+=4){if(data[i+3]>0)colors.add(data[i]+','+data[i+1]+','+data[i+2]);if(data[i+3]!==255)opaque=false;}
 if(colors.size<256)throw Error('Generated island is missing from brand derivative '+file);
 if(file.includes('maskable')&&!opaque)throw Error('Maskable icon must be opaque');
 brandDerivatives.push({file,width:info.width,height:info.height,uniqueRGB:colors.size,opaque});
}
const sheet=sharp({create:{width:1200,height:Math.ceil(originals.length/5)*230,channels:4,background:'#edf6f5'}});
const tiles=await Promise.all(manifest.assets.map(async(record,index)=>({input:await sharp('apps/web/public'+compiled[record.id].src).resize(200,200,{fit:'contain',background:'#edf6f5'}).png().toBuffer(),left:(index%5)*240+20,top:Math.floor(index/5)*230+10})));
await fs.mkdir(root+'/review',{recursive:true});await sheet.composite(tiles).png().toFile(root+'/review/all-25.png');
const result={tool:manifest.tool,humanAdoption:manifest.humanAdoption,assets:originals,maskCenterMinAlpha,maskCoverage:'soft generated edge plus opaque live-color core; actual center RGB requires Chrome check',maskableOpaque:true,brandDerivatives};
const evidenceRoot=process.env.UI_ART_EVIDENCE_OUTPUT??'test-results/ui-art-v1/revision-2';
await fs.mkdir(evidenceRoot,{recursive:true});await fs.writeFile(evidenceRoot+'/asset-integrity.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({originals:originals.length,outputs:Object.keys(compiled).length,maskCenterMinAlpha,maskableOpaque:true,brandDerivatives}));
