import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';
import {templateHash} from '../tools/asset-pipeline/build.mjs';
import {buildFriendlyBlankEyes} from './build-princess-blank-eyes.mjs';

// Technical derivation from the generated painting. The generated original is
// retained privately; only a colorless relative-light field is shipped.
const publicRoot='apps/web/public/content',root='content/princess-master';
const oldId='gen-princess-bunny-v6-storybook-v2',id='gen-princess-bunny-v6-master-v3';
const W=1600,H=2000,N=W*H,sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),pretty=v=>JSON.stringify(v,null,2)+'\n';
const oldBytes=await fs.readFile(`${publicRoot}/templates/${oldId}.json`),old=JSON.parse(oldBytes);
const masterFile=`${root}/originals/princess-finished-v1.png`,masterBytes=await fs.readFile(masterFile);
const sourceQa=await read('content/generated-lineart/compiled/gen-princess-bunny-v6/qa.json');
const normalization=sourceQa.normalization;
if(normalization.method!=='contain-whole-page-on-white'||JSON.stringify(normalization.canvasSize)!=='[1600,2000]')throw Error('Unknown source registration.');
const meta=await sharp(masterBytes).metadata();
if(meta.width!==sourceQa.originalSize[0]||meta.height!==sourceQa.originalSize[1])throw Error('Generated master must match the source-page registration.');
await fs.mkdir(`${root}/derived`,{recursive:true});
const normalized=await sharp({create:{width:W,height:H,channels:3,background:'#fff'}})
  .composite([{input:await sharp(masterBytes).resize(...normalization.imageSize,{kernel:'lanczos3'}).toBuffer(),left:normalization.offset[0],top:normalization.offset[1]}]).removeAlpha().raw().toBuffer();
await sharp(normalized,{raw:{width:W,height:H,channels:3}}).png().toFile(`${root}/derived/registered-master.png`);

const groups=old.paintingProfile.groups.filter(g=>!old.paintingProfile.eyes.some(e=>g.regionIds.includes(e.regionId)));
const labels=new Uint8Array(N),distance=new Uint16Array(N),light=new Float32Array(N),valid=new Uint8Array(N);
const queue=new Int32Array(N),stats=[];
const lum=i=>(.2126*normalized[i*3]+.7152*normalized[i*3+1]+.0722*normalized[i*3+2])/255;
// Finished eyes/mouths are drawn by the vector renderer. Their painted-source
// ink and eyelid shadows must not survive as a second set on the skin/fur.
const faceProtection=createCanvas(W,H),protect=faceProtection.getContext('2d');
for(const eye of old.paintingProfile.eyes){const g=eye.geometry;protect.beginPath();protect.ellipse(g.cx,g.cy,g.width*1.10,g.height*1.25,g.rotation,0,Math.PI*2);protect.fill();}
for(const rid of ['r16','r46','r47']){const b=old.regions.find(r=>r.id===rid).bounds;protect.fillRect(b.x-22,b.y-22,b.width+44,b.height+44);}
const protectedPixels=faceProtection.getContext('2d').getImageData(0,0,W,H).data;faceProtection.width=faceProtection.height=1;
// Exact authored regions supply all masks. There is no color-based grouping.
for(const [index,group]of groups.entries()){
  const c=createCanvas(W,H),ctx=c.getContext('2d');
  for(const rid of group.regionIds){const r=old.regions.find(r=>r.id===rid);ctx.fill(new Path2D(r.path),r.fillRule??'nonzero');}
  const data=ctx.getImageData(0,0,W,H).data;
  for(let p=0;p<N;p++)if(data[p*4+3]>250)labels[p]=index+1;
  c.width=c.height=1;
}
// Keep the painted master's dark outer contour out of the lighting field.
distance.fill(65535);let head=0,tail=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p=y*W+x,l=labels[p];
  if(l&&(x===0||y===0||x===W-1||y===H-1||labels[p-1]!==l||labels[p+1]!==l||labels[p-W]!==l||labels[p+W]!==l)){distance[p]=0;queue[tail++]=p;}
}
while(head<tail){const p=queue[head++],l=labels[p],d=distance[p]+1;for(const q of [p-1,p+1,p-W,p+W])if(q>=0&&q<N&&labels[q]===l&&distance[q]>d){distance[q]=d;queue[tail++]=q;}}

function eligible(p,material,group){
  const [r,g,b]=normalized.subarray(p*3,p*3+3),l=lum(p),chroma=Math.max(r,g,b)-Math.min(r,g,b);
  if(distance[p]<5)return false;
  if(['g2','g7'].includes(group)&&protectedPixels[p*4+3])return false;
  if(material==='hair')return l>.075&&l<.86&&r>g*1.04&&g>b*1.03&&chroma>25;
  if(material==='fabric'&&['g3','g4'].includes(group))return l>.15&&r>g*1.08&&b>g*.85;
  if(group==='g5'||material==='metal')return l>.15&&r>b*1.20&&g>b*1.10;
  if(group==='g9')return l>.20&&g>r*.93&&g>b*1.03;
  if(group==='g6')return l>.12&&r>g*1.15&&b>g*.85;
  if(material==='fur')return l>.48&&r>=b*.96&&r<g*1.28;
  if(group==='g2')return l>.55&&r>g*1.025&&r<g*1.66&&g>b*.95;
  return l>.16&&l<.99;
}
for(const [index,group]of groups.entries()){
  const material=old.regions.find(r=>r.id===group.regionIds[0]).material,samples=[];
  for(let p=0;p<N;p++)if(labels[p]===index+1&&eligible(p,material,group.id))samples.push(p);
  if(samples.length<8)throw Error(`Insufficient registered lighting samples: ${group.name}`);
  samples.sort((a,b)=>lum(a)-lum(b));
  const reference=samples[Math.floor(samples.length*.57)],referenceL=lum(reference);
  const color='#'+[...normalized.subarray(reference*3,reference*3+3)].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
  for(const p of samples){valid[p]=1;light[p]=lum(p);}
  stats.push({groupId:group.id,name:group.name,material,referenceColor:color,referenceLuminance:referenceL,sampleCount:samples.length});
}
// Inpaint only untrusted boundary/ink samples, inside the same authored group.
// Different semantic parts never supply one another's lighting.
const inferred=[];for(let p=0;p<N;p++)if(labels[p]&&!valid[p])inferred.push(p);
head=0;tail=0;for(let p=0;p<N;p++)if(valid[p])queue[tail++]=p;
while(head<tail){const p=queue[head++],l=labels[p];for(const q of [p-1,p+1,p-W,p+W])if(q>=0&&q<N&&labels[q]===l&&!valid[q]){valid[q]=1;light[q]=light[p];queue[tail++]=q;}}
// Harmonic filling removes nearest-neighbor stripes from repaired boundaries
// and facial protection zones while retaining all measured form samples.
for(let pass=0;pass<100;pass++)for(const p of inferred){let sum=0,count=0;for(const q of [p-1,p+1,p-W,p+W])if(q>=0&&q<N&&labels[q]===labels[p]){sum+=light[q];count++;}if(count)light[p]=sum/count;}
const field=Buffer.alloc(N,128);let min=255,max=0;
for(let p=0;p<N;p++)if(labels[p]){
  const s=stats[labels[p]-1],l=valid[p]?light[p]:s.referenceLuminance,base=s.referenceLuminance;
  // Hard-light: below neutral multiplies the chosen pigment, above neutral
  // adds an achromatic reflection. Pure white still shades; pure black shines.
  const value=l<base?.5*Math.max(.16,l/base):.5+.5*Math.min(.78,(l-base)/(1-base));
  const v=Math.round(value*255);field[p]=v;min=Math.min(min,v);max=Math.max(max,v);
}
// Extend the field into the existing opaque ink only. Exact vector paint masks
// remain responsible for coverage, so this cannot leak into a neighboring part.
const extended=Buffer.from(field);for(let y=4;y<H-4;y++)for(let x=4;x<W-4;x++){
  const p=y*W+x;if(labels[p])continue;
  for(let r=1;r<=4;r++){const q=[p-r,p+r,p-r*W,p+r*W].find(q=>labels[q]);if(q!==undefined){extended[p]=field[q];break;}}
}
const mapBytes=await sharp(extended,{raw:{width:W,height:H,channels:1}}).blur(1.15).resize(2048,2560,{kernel:'cubic'}).png().toBuffer();
const formUrl=`/content/media/princess-form-v1.${sha(mapBytes)}.png`;
try{await fs.writeFile(`apps/web/public${formUrl}`,mapBytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||!mapBytes.equals(await fs.readFile(`apps/web/public${formUrl}`)))throw error;}
await fs.writeFile(`${root}/derived/relative-light-v1.png`,mapBytes);
const next=structuredClone(old);next.id=id;
const profile=next.paintingProfile;profile.version=4;profile.eyeStyle='friendly-ink-v4';profile.mediumAssets.form=formUrl;delete profile.mediumAssets.iris;
profile.formArtwork={encoding:'relative-light-v1',width:2048,height:2560,masterSha256:sha(masterBytes),sourceTemplateId:oldId,groups:stats.map(({groupId,referenceColor})=>({groupId,referenceColor}))};
profile.upgradeSources={...profile.upgradeSources,...Object.fromEntries([oldId,'gen-princess-bunny-v6-master-v1','gen-princess-bunny-v6-master-v2'].map(source=>[source,Object.fromEntries(next.regions.map(r=>[r.id,r.id]))]))};
const blankSource=await buildFriendlyBlankEyes(profile.eyes);
for(const eye of profile.eyes){
  const a=eye.artwork,b=new Path2D(a.reflections[0].path).computeTightBounds();
  a.blankGuide={cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2,radius:eye.geometry.width*.085,strokeWidth:Math.max(1.5,eye.geometry.width*.022)};a.blankInkPath=blankSource.eyes.find(e=>e.regionId===eye.regionId).path;
}
function lineart(t){
  const eyes=t.paintingProfile.eyes.map(e=>`<path d="${e.artwork.opening}" fill="white"/><path data-eye-blank-ink="${e.regionId}" d="${e.artwork.blankInkPath}" fill="#000" fill-rule="evenodd"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2000" viewBox="0 0 1600 2000"><rect width="1600" height="2000" fill="white"/><path d="${t.paintingProfile.opaquePath}" fill="white"/>${t.details.map(d=>`<path d="${d.path}" fill="${d.fill??'none'}" stroke="#000" stroke-width="${d.strokeWidth??0}"/>`).join('')}${eyes}</svg>`;
}
const svg=lineart(next),assetUrl=await publishRevision(publicRoot,'templates',id,'json',pretty(next)),thumbnailUrl=await publishRevision(publicRoot,'templates',id,'svg',svg);
await fs.writeFile(`${publicRoot}/templates/${id}.json`,pretty(next));await fs.writeFile(`${publicRoot}/templates/${id}.svg`,svg);
const catalog=await read(`${publicRoot}/catalog.json`),slot=catalog.findIndex(e=>e.themeId==='princess');
if(slot<0)throw Error('Princess catalog slot is absent.');
catalog[slot]={...catalog[slot],id,assetUrl,thumbnailUrl,coloredThumbnailUrl:thumbnailUrl};
await fs.writeFile(`${publicRoot}/catalog.json`,pretty(catalog));
const upgrades=await read(`${publicRoot}/upgrade-index.json`);for(const from of Object.keys(profile.upgradeSources))upgrades[from]=id;await fs.writeFile(`${publicRoot}/upgrade-index.json`,pretty(upgrades));
const report={templateId:id,sourceTemplateId:oldId,sourceTemplateSha256:sha(oldBytes),masterFile,masterSha256:sha(masterBytes),masterSize:[meta.width,meta.height],normalization,blankSource,formUrl,formSha256:sha(mapBytes),decodedBytes:2048*2560*4,neutralEncoding:'achromatic hard-light; 128 neutral; darker shadow / lighter reflection',fieldRange:[min,max],groups:stats,contentHash:templateHash(next),humanApproved:false,status:'I22 white pupil lineart candidate; current visual/browser/performance verification pending'};
try{const previous=await fs.readFile(`${root}/manifest.json`);await fs.mkdir(`${root}/history`,{recursive:true});await fs.writeFile(`${root}/history/${sha(previous)}.json`,previous,{flag:'wx'});}catch(error){if(!['ENOENT','EEXIST'].includes(error.code))throw error;}
await fs.writeFile(`${root}/manifest.json`,pretty(report));
await fs.writeFile(`content/qa/${id}.json`,pretty({...report,pass:false}));
await fs.writeFile(`content/templates/reviews/${id}.json`,pretty({schemaVersion:1,templateId:id,regions:{},approval:{kind:'author-technical',contentHash:report.contentHash,reviewer:'Codex princess master author',basis:'I19 one-princess prototype; no transferred human adoption'}}));
console.log(JSON.stringify({id,assetUrl,formUrl,groups:stats.length,decodedBytes:report.decodedBytes,masterPrivate:true}));
