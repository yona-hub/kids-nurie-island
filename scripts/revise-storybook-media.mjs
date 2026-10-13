import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file='content/storybook-generated/manifest.json',manifest=JSON.parse(await fs.readFile(file,'utf8'));
const revision=JSON.parse(await fs.readFile('content/storybook-generated/media-revision-specs.json','utf8'));
manifest.history??=[];
for(const asset of revision.assets){
 const previous=manifest.assets.find(a=>a.id===asset.id);if(!previous&&asset.id!=='iris')throw Error(`Missing previous ${asset.id}`);
 const bytes=await fs.readFile(asset.source),sha256=createHash('sha256').update(bytes).digest('hex');
 const originalFile=`content/storybook-generated/originals/${asset.id}-${sha256.slice(0,12)}.png`;
 await fs.writeFile(originalFile,bytes,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
 if(previous?.sha256===sha256)continue;
 if(previous)manifest.history.push({...previous,supersededAt:new Date().toISOString(),reason:revision.reason});
 const current={...(previous??{id:asset.id,kind:'medium',transparent:true}),prompt:asset.prompt,sha256,originalFile,generatedAt:new Date().toISOString()};
 if(previous)manifest.assets[manifest.assets.indexOf(previous)]=current;else manifest.assets.push(current);
}
await fs.writeFile(file,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({currentAssets:manifest.assets.length,preservedRevisions:manifest.history.length}));
