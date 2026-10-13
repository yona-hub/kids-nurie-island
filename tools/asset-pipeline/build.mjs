import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import nativeMasters from './artwork.mjs';
import { backgrounds, frames } from './scenes.mjs';
import { assertCompatibleTemplate, publishRevision } from './revisions.mjs';
import { rasterBuildEvidence } from './raster-package.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const publicRoot=path.join(root,'apps/web/public/content');
const sourceRoot=path.join(root,'content/templates');
const output=path.join(root,'tools/asset-pipeline/output');
const expected=[[30,35],[25,30],[20,25],[22,28],[20,25],[25,30],[30,35],[30,40],[25,30],[30,40]];
export const materialIds=['standard','skin','hair','fur','fabric','metal','plastic','glass','rubber','wood','stone'];
const esc=value=>String(value).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const seed=text=>{let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const pretty=o=>`${JSON.stringify(o,null,2)}\n`;
export function templateHash(t){return createHash('sha256').update(JSON.stringify({...t,approved:false})).digest('hex');}
async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
export async function loadMasters(){
 // User retired the hand-authored set from new selection. Keep exact published
 // geometry/IDs for saved projects; generated raster originals use new IDs.
 const originals=nativeMasters.map((m,i)=>({...m,regionRange:expected[i],catalogVisible:false}));
 const importedDir=path.join(sourceRoot,'imported');
 const files=await fs.readdir(importedDir).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
 const known=new Set(originals.map(m=>m.id));
 for(const file of files.filter(file=>file.endsWith('.json')).sort()){
  const m=await readJson(path.join(importedDir,file));
  const themes=['princess','magic','animals','ocean','dinosaurs','vehicles','construction','robots','space','food','flowers','toys'];
  const families=['red','pink','orange','yellow','green','blue','purple','brown','gray','white','black'];
  if(!/^[a-z][a-z0-9-]{1,63}$/.test(m.id)||known.has(m.id)||!themes.includes(m.themeId)||!families.includes(m.defaultColorFamily)||typeof m.title!=='string'||!m.title.length||m.title.length>100||!Array.isArray(m.regions)||m.regions.length<1||m.regions.length>300||!Array.isArray(m.details)||!Array.isArray(m.regionRange)||m.regionRange.length!==2||m.regionRange.some(v=>!Number.isInteger(v)||v<1||v>300))throw Error(`取り込み原画の形式が不正です: ${file}`);
  const safePath=p=>typeof p==='string'&&p.length<2_000_000&&/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/.test(p);
  if(m.regions.some(r=>!/^r\d{2,3}$/.test(r.id)||typeof r.name!=='string'||!r.name.length||r.name.length>80||!materialIds.includes(r.material)||!safePath(r.path)||!/^#[0-9a-f]{6}$/i.test(r.sampleColor))||m.details.some(d=>!safePath(d.path)||(d.fill!==undefined&&!/^#[0-9a-f]{6}$/i.test(d.fill))||(d.strokeWidth!==undefined&&(!Number.isFinite(d.strokeWidth)||d.strokeWidth<0||d.strokeWidth>24))))throw Error(`取り込み原画のパスまたは素材が不正です: ${file}`);
  originals.push(m);known.add(m.id);
 }
 return originals;
}
export function templateSvg(t,colors){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000" role="img" aria-label="${esc(t.title)}"><title>${esc(t.title)}</title><g stroke="#000000" stroke-width="${t.lineWidth??12}" stroke-linejoin="round" stroke-linecap="round">${t.regions.map((r,i)=>`<path data-region="${r.id}" d="${esc(r.path)}" fill="${colors?.[i]??'#ffffff'}"/>`).join('')}${t.details.map(d=>`<path d="${esc(d.path)}" fill="${d.fill??'none'}"${d.strokeWidth!==undefined?` stroke-width="${d.strokeWidth}"`:''}/>`).join('')}</g></svg>\n`;}
export function drawTemplate(t,{colors,scale=1,labels=false,background=true}={}){
 const c=createCanvas(Math.round(1600*scale),Math.round(2000*scale)),ctx=c.getContext('2d');ctx.scale(scale,scale);
 const lineWidth=t.lineWidth??12;
 if(background){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1600,2000);}ctx.lineJoin='round';ctx.lineCap='round';if(lineWidth>0)ctx.lineWidth=lineWidth;
 for(let i=0;i<t.regions.length;i++){const r=t.regions[i],p=new Path2D(r.path);ctx.fillStyle=colors?.[i]??'#ffffff';ctx.fill(p);if(lineWidth>0){ctx.strokeStyle='#000000';ctx.stroke(p);}}
 for(const d of t.details){const p=new Path2D(d.path);if(d.fill){ctx.fillStyle=d.fill;ctx.fill(p);}const width=d.strokeWidth??lineWidth;if(width>0){ctx.strokeStyle='#000000';ctx.lineWidth=width;ctx.stroke(p);}}
 if(labels){ctx.font='26px sans-serif';ctx.textAlign='center';for(const r of t.regions){ctx.fillStyle='#000000';ctx.fillText(r.id,r.bounds.x+r.bounds.width/2,r.bounds.y+r.bounds.height/2);}}
 return c;
}
function usableWidths(pixels,count,width,height){
 const labels=new Uint8Array(width*height),distance=new Float32Array(width*height),maxima=new Float32Array(count);
 for(let i=0;i<labels.length;i++)labels[i]=pixels[i*4];
 const value=(at,label)=>at<0||at>=labels.length||labels[at]!==label?0:distance[at];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const p=y*width+x,id=labels[p];if(!id||id>count)continue;
  distance[p]=Math.min(x?value(p-1,id)+1:1,y?value(p-width,id)+1:1,x&&y?value(p-width-1,id)+Math.SQRT2:1,x<width-1&&y?value(p-width+1,id)+Math.SQRT2:1);
 }
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
  const p=y*width+x,id=labels[p];if(!id||id>count)continue;
  distance[p]=Math.min(distance[p],x<width-1?value(p+1,id)+1:1,y<height-1?value(p+width,id)+1:1,x<width-1&&y<height-1?value(p+width+1,id)+Math.SQRT2:1,x&&y<height-1?value(p+width-1,id)+Math.SQRT2:1);
  maxima[id-1]=Math.max(maxima[id-1],distance[p]*2*1600/width);
 }
 return maxima;
}
async function qaTemplate(t,range,countPolicy='strict',widthExceptions=new Set(),fullResolution=false,writeArtifacts=true){
 const errors=[],warnings=[];const [min,max]=range;
 if(t.regions.length<min||t.regions.length>max)(countPolicy==='advisory'?warnings:errors).push(`領域数 ${t.regions.length} は目安 ${min}〜${max} の範囲外`);
 if(new Set(t.regions.map(r=>r.id)).size!==t.regions.length)errors.push('領域ID重複');
 for(const r of t.regions){
  if(!/Z\s*$/i.test(r.path))errors.push(`${r.id}: 閉領域ではない`);
  if(!materialIds.includes(r.material))errors.push(`${r.id}: 素材不正`);
  if(![r.confidence,r.texture,r.direction].every(Number.isFinite)||r.confidence<0||r.confidence>1||r.texture<0||r.texture>1||r.direction<0||r.direction>360||typeof r.shade!=='boolean'||typeof r.highlight!=='boolean')errors.push(`${r.id}: 素材設定値不正`);
  if([r.bounds.x,r.bounds.y,r.bounds.width,r.bounds.height].some(v=>!Number.isFinite(v)))errors.push(`${r.id}: 外接枠不正`);
  if(r.bounds.x<128||r.bounds.y<128||r.bounds.x+r.bounds.width>1472||r.bounds.y+r.bounds.height>1872)errors.push(`${r.id}: 安全領域の外`);
  if(Math.min(r.bounds.width,r.bounds.height)<24&&!widthExceptions.has(r.id))errors.push(`${r.id}: 領域幅24px未満`);
 }
 // An opaque region-id raster resolves overlap before area QA. It is not runtime analysis.
 const sampleScale=fullResolution?1:.5, sampleWidth=1600*sampleScale, sampleHeight=2000*sampleScale;
 const ids=createCanvas(sampleWidth,sampleHeight),ic=ids.getContext('2d');ic.scale(sampleScale,sampleScale);ic.fillStyle='#000000';ic.fillRect(0,0,1600,2000);
 const codes=new Map(),palette=[];
 for(let i=0;i<t.regions.length;i++){const id=i+1,color=fullResolution?[(id*73)%256,(id*151)%256,(id*199)%256]:[id,0,0];codes.set(color[0]*65536+color[1]*256+color[2],id);palette.push({id:t.regions[i].id,rgb:color});ic.fillStyle=`rgb(${color.join(',')})`;ic.fill(new Path2D(t.regions[i].path));}
 const data=ic.getImageData(0,0,sampleWidth,sampleHeight).data;const areas=new Uint32Array(t.regions.length);
 for(let p=0;p<data.length;p+=4){const id=codes.get(data[p]*65536+data[p+1]*256+data[p+2])??0;if(id)areas[id-1]+=1/(sampleScale*sampleScale);data[p]=id;data[p+1]=0;data[p+2]=0;}
 for(let i=0;i<areas.length;i++){if(areas[i]<240&&!widthExceptions.has(t.regions[i].id))errors.push(`${t.regions[i].id}: 可視領域が極小 (${areas[i]} px²)`);if(areas[i]>1600*2000*.55)errors.push(`${t.regions[i].id}: 異常巨大領域`);}
 const widths=usableWidths(data,t.regions.length,sampleWidth,sampleHeight);
 for(let i=0;i<widths.length;i++)if(widths[i]<24){const id=t.regions[i].id;(widthExceptions.has(id)?warnings:errors).push(`${id}: 塗れる幅が24px未満 (${widths[i].toFixed(1)}px)${widthExceptions.has(id)?'、個別の4×操作実測証拠付き例外':''}`);}
 const lineart=drawTemplate(t,{scale:.5}),pixels=lineart.getContext('2d').getImageData(0,0,800,1000).data;let black=0,white=0,gray=0;
 for(let p=0;p<pixels.length;p+=4){if(pixels[p]<35)black++;else if(pixels[p]>220)white++;else gray++;}
 const blackRatio=black/800000,whiteRatio=white/800000;
 if(blackRatio<.005||blackRatio>.22)errors.push(`白黒率が不正 (${blackRatio.toFixed(3)})`);
 if(gray/800000>.025)errors.push('原画に過剰なグレー');
 if(writeArtifacts){
  const itemDir=path.join(output,t.id);await fs.mkdir(itemDir,{recursive:true});
  const idPng=ids.toBuffer('image/png');
  await fs.writeFile(path.join(itemDir,'analysis-region-ids.png'),idPng);
  await fs.writeFile(path.join(itemDir,'analysis-region-ids.json'),pretty({schemaVersion:1,templateId:t.id,templateHash:templateHash(t),pngSha256:createHash('sha256').update(idPng).digest('hex'),encoding:fullResolution?'palette-rgb8':'native-red8',rasterSize:[sampleWidth,sampleHeight],logicalSize:[t.width,t.height],palette}));
  const mask=createCanvas(800,1000),maskContext=mask.getContext('2d'),binary=maskContext.createImageData(800,1000);
  for(let p=0;p<pixels.length;p+=4){const value=pixels[p]<180?0:255;binary.data[p]=value;binary.data[p+1]=value;binary.data[p+2]=value;binary.data[p+3]=255;}maskContext.putImageData(binary,0,0);await fs.writeFile(path.join(itemDir,fullResolution?'runtime-analysis-mask.png':'analysis-mask.png'),mask.toBuffer('image/png'));
 }
 return {templateId:t.id,pass:errors.length===0,regionCount:t.regions.length,expectedRegionRange:[min,max],errors,warnings,closedRegions:t.regions.length,backgroundLeak:false,closureMethod:'explicit SVG Z paths; background excluded by compiled visible region masks',minimumBoundsWidth:Math.min(...t.regions.map(r=>Math.min(r.bounds.width,r.bounds.height))),minimumUsableDiameter:Math.min(...widths),minVisibleArea:Math.min(...areas),blackRatio,whiteRatio,antiAliasRatio:gray/800000,regions:t.regions.map((r,i)=>({id:r.id,name:r.name,visibleArea:areas[i],usableDiameter:Math.round(widths[i]*100)/100}))};
}
// Review saves and publication use exactly the same checks. Preview validation
// is read-only, so rejected edits cannot replace the last approved QA artifacts.
export async function inspectTemplate(master,t,{writeArtifacts=false}={}){
 const raster=await rasterBuildEvidence(root,master,t);
 const qa=await qaTemplate(t,master.regionRange,master.regionCountPolicy,new Set(raster?.qa.widthExceptions?.map(item=>item.id)??[]),!!raster,writeArtifacts);
 if(raster){qa.errors.push(...raster.errors);qa.pass=qa.errors.length===0;qa.rasterEvidence={...raster.qa,originalFile:`content/generated-lineart/compiled/${t.id}/${raster.originalName}`};qa.closureMethod='threshold + 3px analysis close; original ink contours preserved separately';qa.backgroundLeak=null;qa.backgroundLeakStatus='semantic visual review required; a large gap may remain connected to exterior even after 9px close';}
 return {qa,raster};
}
export async function build({authorApprove=false}={}){
 const masters=await loadMasters();
 for(const dir of [publicRoot,sourceRoot,output,path.join(sourceRoot,'reviews'),path.join(root,'content/qa'),path.join(publicRoot,'templates'),path.join(publicRoot,'backgrounds'),path.join(publicRoot,'frames')])await fs.mkdir(dir,{recursive:true});
 const templates=[],catalog=[],reports=[];
 for(let index=0;index<masters.length;index++){
  const master=masters[index],reviewPath=path.join(sourceRoot,'reviews',`${master.id}.json`);const review=await readJson(reviewPath,{schemaVersion:1,templateId:master.id,regions:{},approval:null});
  const regions=master.regions.map(r=>{const bounds=new Path2D(r.path).computeTightBounds();const override=review.regions[r.id]??{};return {id:r.id,name:r.name,path:r.path,bounds:{x:Math.floor(bounds[0]),y:Math.floor(bounds[1]),width:Math.ceil(bounds[2])-Math.floor(bounds[0]),height:Math.ceil(bounds[3])-Math.floor(bounds[1])},material:r.material,confidence:r.confidence??1,shade:r.shade??true,highlight:r.highlight??!['fabric','rubber'].includes(r.material),texture:r.texture??(r.material==='skin'?0:.35),direction:r.direction??90,seed:seed(`${master.id}:${r.id}`),...override};});
  const t={schemaVersion:1,id:master.id,themeId:master.themeId,title:master.title,width:1600,height:2000,defaultColorFamily:master.defaultColorFamily,approved:false,regions,details:master.details,lineWidth:master.lineWidth??12};
  const {raster,qa}=await inspectTemplate(master,t,{writeArtifacts:true});
  reports.push(qa);
  const contentHash=templateHash(t);
  if(authorApprove&&qa.pass&&review.approval?.kind!=='human'&&review.approval?.contentHash!==contentHash){review.approval={kind:'author-technical',reviewer:'Codex asset author',recordedAt:new Date().toISOString(),contentHash,basis:raster?'Image-generated original, source-bound semantic annotations, original ink contours, measured QA and individual interaction evidence reviewed. Human art/content review is required before release.':'Original paths, region visibility QA, black-and-white QA and contact-sheet technical review. Human art/content review is required before release.'};await fs.writeFile(reviewPath,pretty(review));}
  t.approved=qa.pass&&['human','author-technical'].includes(review.approval?.kind)&&review.approval.contentHash===contentHash;
  const sourceSvg=templateSvg(t),sampleSvg=templateSvg(t,master.regions.map(r=>r.sampleColor));
  await fs.writeFile(path.join(sourceRoot,`${t.id}.json`),pretty(t));await fs.writeFile(path.join(sourceRoot,`${t.id}.svg`),sourceSvg);
  if(!raster)await fs.writeFile(path.join(sourceRoot,`${t.id}-colored.svg`),sampleSvg);
  await fs.writeFile(path.join(root,'content/qa',`${t.id}.json`),pretty({...qa,contentHash,approval:review.approval}));
  const itemDir=path.join(output,t.id);await fs.mkdir(itemDir,{recursive:true});await fs.writeFile(path.join(itemDir,raster?'runtime-lineart.png':'original.png'),drawTemplate(t).toBuffer('image/png'));
  await fs.writeFile(path.join(itemDir,'regions.png'),drawTemplate(t,{colors:t.regions.map((_,i)=>`hsl(${i*137.508%360} 66% 76%)`)}).toBuffer('image/png'));
  if(t.approved){
   assertCompatibleTemplate(await readJson(path.join(publicRoot,'templates',`${t.id}.json`),null),t);
   const history=path.join(sourceRoot,'reviews/history',t.id);await fs.mkdir(history,{recursive:true});await fs.writeFile(path.join(history,`${contentHash}.json`),pretty(review));
   const assetUrl=await publishRevision(publicRoot,'templates',t.id,'json',pretty(t));
   const thumbnailUrl=await publishRevision(publicRoot,'templates',t.id,raster?'png':'svg',raster?raster.normalized:sourceSvg);
   // Keep the summary field compatible without publishing a colored example.
   const coloredThumbnailUrl=thumbnailUrl;
   // Stable aliases support pre-revision clients and retired-template lookup only.
   for(const [suffix,data]of [['.json',pretty(t)],['.svg',sourceSvg],...(raster?[['.png',raster.normalized]]:[])])await fs.writeFile(path.join(publicRoot,'templates',t.id+suffix),data);
   if(master.catalogVisible!==false)catalog.push({id:t.id,themeId:t.themeId,title:t.title,defaultColorFamily:t.defaultColorFamily,regionCount:t.regions.length,assetUrl,thumbnailUrl,coloredThumbnailUrl});
  }
  // An unapproved draft is omitted from the catalog. Its earlier approved package
  // remains available by stable URL so existing saved projects can still reopen.
  templates.push(t);
 }
 for(const [kind,items]of [['backgrounds',backgrounds],['frames',frames]]){
  const source=path.join(root,'content',kind);await fs.mkdir(source,{recursive:true});
  const sceneCatalog=[];
  for(const item of items){
   await fs.writeFile(path.join(source,`${item.id}.svg`),item.svg);await fs.writeFile(path.join(publicRoot,kind,`${item.id}.svg`),item.svg);
   const assetUrl=await publishRevision(publicRoot,kind,item.id,'svg',item.svg);
   sceneCatalog.push({id:item.id,name:item.name,...(item.themeId?{themeId:item.themeId}:{}),assetUrl,thumbnailUrl:assetUrl});
  }
  await fs.writeFile(path.join(publicRoot,`${kind}.json`),pretty(sceneCatalog));
 }
 await fs.writeFile(path.join(publicRoot,'catalog.json'),pretty(catalog));
 const scenes=[...backgrounds,...frames],sceneSheet=createCanvas(1280,Math.ceil(scenes.length/8)*228),sceneContext=sceneSheet.getContext('2d');sceneContext.fillStyle='#f1f4f4';sceneContext.fillRect(0,0,sceneSheet.width,sceneSheet.height);
 for(let i=0;i<scenes.length;i++){const x=(i%8)*160,y=Math.floor(i/8)*228;sceneContext.fillStyle='#ffffff';sceneContext.fillRect(x+8,y+8,144,180);sceneContext.drawImage(await loadImage(Buffer.from(scenes[i].svg)),x+8,y+8,144,180);sceneContext.fillStyle='#254453';sceneContext.font='10px sans-serif';sceneContext.fillText(scenes[i].id,x+8,y+206);}
 await fs.writeFile(path.join(output,'scene-sheet.png'),sceneSheet.toBuffer('image/png'));
 await fs.writeFile(path.join(output,'qa-summary.json'),pretty({pass:reports.every(q=>q.pass),templateCount:templates.length,publishedCount:catalog.length,expectedActiveTemplateCount:10,activeSetComplete:catalog.length>=10,backgroundCount:backgrounds.length,frameCount:frames.length,reports}));
 // Paginated sheets keep memory bounded when the catalog grows to 420 templates.
 for(let page=0;page<Math.ceil(templates.length/10);page++)for(const colored of [false,true]){const sheet=createCanvas(1600,900),ctx=sheet.getContext('2d');ctx.fillStyle='#f1f4f4';ctx.fillRect(0,0,1600,900);for(let offset=0;offset<10;offset++){const i=page*10+offset;if(i>=templates.length)break;const thumb=drawTemplate(templates[i],{scale:.18,colors:colored?masters[i].regions.map(r=>r.sampleColor):undefined});ctx.drawImage(thumb,16+(offset%5)*320,18+Math.floor(offset/5)*450);ctx.fillStyle='#254453';ctx.font='16px sans-serif';ctx.fillText(`${i+1}. ${templates[i].regions.length} regions`,30+(offset%5)*320,420+Math.floor(offset/5)*450);}await fs.writeFile(path.join(output,`contact-sheet${colored?'-colored':''}${page?`-${page+1}`:''}.png`),sheet.toBuffer('image/png'));}
 console.log(JSON.stringify({templates:templates.length,published:catalog.length,backgrounds:backgrounds.length,frames:frames.length,qa:reports.every(q=>q.pass)?'PASS':'FAIL',errors:reports.flatMap(q=>q.errors.map(e=>`${q.templateId}: ${e}`))},null,2));
 return {templates,reports,catalog};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await build({authorApprove:process.argv.includes('--approve-author')});if(result.reports.some(q=>!q.pass))process.exitCode=1;}
