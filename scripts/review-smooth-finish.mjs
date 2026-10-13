import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';

const phase=process.argv[2]??'before',root=process.env.SMOOTH_EVIDENCE_OUTPUT??'test-results/smooth-home-i33/revision-1';
const out=`${root}/${phase}`;await fs.mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const catalog=await read('apps/web/public/content/catalog.json');
const overrides={
 princess:['#94522E','#F8D8C6','#F47DAF','#F47DAF','#F6D16B','#E75B9B','#FFF9EE','#F8B7CA','#85C89A','#8F542E','#8F542E','#F6D16B','#ED8278','#E99EB6','#ED8278'],
 magic:['#8764C9','#94522E','#F8D8C6','#8764C9','#C1AFE7','#4D638D','#73503C','#3F3D4B','#A77945','#EDBD5C','#FFF3D2','#8F542E','#F6D16B','#F6D16B','#E8847F','#F6D16B','#B799DB','#BDE8F2','#FF9B49','#FFEBA1'],
 animals:['#80B45C','#E8BE8F','#EDCAA3','#F7B7BD','#8F542E','#68A894','#A77945','#58463C','#EB8F8E','#E695A0'],
 ocean:['#73BDE9','#A7D27C','#71AA62','#F2A146','#FFF0BA','#CDF3F8','#36619A','#8F542E','#8F542E','#D8878C','#E88788','#E88788','#EC9CA3','#A986C7','#F9D67A','#F1CFB2'],
 dinosaurs:['#8EC986','#52785D','#FFF9EE','#F1E4C9','#F6E0AD','#8F542E','#DB8A8D','#F1DEB1','#E8D5AC','#A6A69C','#C1B9A7'],
 construction:['#F2BC4C','#E7AC3E','#A9D5E8','#A4B0BA','#D2DADE','#6A7885','#445364','#9CAEBB','#6D7D89','#F49B51','#F49B51','#FFF9EE','#626A73','#FFE4A2','#808D99'],
 vehicles:['#E96759','#AFD8EC','#4B5361','#B2C2CC','#AFBBC7','#FFF3BE','#667381','#C1CBD1','#F5E9D8'],
 robots:['#A2D4EC','#6E9DCC','#C4E7F2','#7AADD7','#526D91','#91BEDE','#3B526F','#61C0F5','#F1C55D','#7996B9','#466B94','#99D9E7','#E78487','#EFCF75','#91CD9F','#6D91B5'],
 space:['#F2D37C','#F6E9D4','#ED7C67','#F7F0E4','#C49B78','#B4C4D4','#98AFC7','#53687F','#8F542E','#E67A61','#CDB38A','#F5DA7E','#AEC3D0','#A3D8EE','#94522E','#F8D8C6','#E18A85','#92BCC9','#E6BD58','#687A8B','#97ADC2','#F9A24C','#FFE69A'],
 flowers:['#F393AF','#F2D177','#EFA2BE','#7EB75E','#AC9DDB','#EBD482','#D9E7EC','#ED9EAF','#817494','#C59F45','#F6D379'],
};
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
try{
 const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
 const evidence=[];
 for(const entry of catalog){
  const bytes=await fs.readFile('apps/web/public'+entry.assetUrl),t=JSON.parse(bytes),palette=Object.fromEntries(t.paintingProfile.groups.map((g,i)=>[g.id,overrides[t.themeId][i]]));
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile.mediumAssets).map(async([name,url])=>[name,await loadImage('apps/web/public'+url)])));
  const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t);engine.setMediumImages(media);
  const states=[];
  for(const type of ['blank','smooth','crayon','pencil']){
   const paints=type==='blank'?{}:Object.fromEntries(t.paintingProfile.groups.flatMap(g=>g.regionIds.map(r=>[r,{color:palette[g.id],paintType:type}])));
   engine.setScene({regions:paints});const shot=engine.renderSnapshot(320),rgba=shot.getContext('2d').getImageData(0,0,320,400).data;
   const png=shot.toBuffer('image/png');await fs.writeFile(`${out}/${t.themeId}-${type}.png`,png);states.push({type,rgbaSha256:sha(rgba),pngSha256:sha(png)});shot.width=shot.height=1;
   if(type==='smooth'){const input=engine.renderSnapshot(1600);await fs.writeFile(`${out}/${t.themeId}-source.png`,input.toBuffer('image/png'));input.width=input.height=1;}
  }
  evidence.push({id:t.id,previousId:t.paintingProfile.upgradeFrom,theme:t.themeId,templateSha256:sha(bytes),geometrySha256:sha(JSON.stringify([t.regions,t.details,t.paintingProfile.opaquePath,t.paintingProfile.eyes,t.paintingProfile.groups])),palette,states});
  engine.dispose();
 }
 await fs.writeFile(`${out}/evidence.json`,JSON.stringify(evidence,null,2)+'\n');
 if(phase!=='before'){
  const before=await read(`${root}/before/evidence.json`);
  const compare=evidence.map(a=>{const b=before.find(b=>b.theme===a.theme);return {id:a.id,previousId:b.id,geometryUnchanged:a.geometrySha256===b.geometrySha256,states:a.states.map(s=>({type:s.type,unchanged:s.rgbaSha256===b.states.find(x=>x.type===s.type).rgbaSha256}))};});
  await fs.writeFile(`${out}/comparison.json`,JSON.stringify(compare,null,2)+'\n');
  for(const t of compare){if(!t.geometryUnchanged||t.states.some(s=>s.unchanged!==(s.type!=='smooth')))throw Error(`Unexpected affected state: ${t.id}`);}
  const legacy=[];
  for(const b of before){
   const t=await read(`apps/web/public/content/templates/${b.id}.json`),media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)])));
   const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t);engine.setMediumImages(media);
   const states=[];for(const old of b.states){engine.setScene({regions:old.type==='blank'?{}:Object.fromEntries(t.paintingProfile.groups.flatMap(g=>g.regionIds.map(r=>[r,{color:b.palette[g.id],paintType:old.type}])))});const shot=engine.renderSnapshot(320),hash=sha(shot.getContext('2d').getImageData(0,0,320,400).data);states.push({type:old.type,rgbaSha256:hash,unchanged:hash===old.rgbaSha256});shot.width=shot.height=1;}
   engine.dispose();legacy.push({id:b.id,states});
  }
  await fs.writeFile(`${out}/legacy-comparison.json`,JSON.stringify(legacy,null,2)+'\n');
  if(legacy.some(t=>t.states.some(s=>!s.unchanged)))throw Error('An existing saved-work render changed');
 }
 console.log(JSON.stringify({phase,templates:evidence.length,states:evidence.length*4,out}));
}finally{await server.close();}
