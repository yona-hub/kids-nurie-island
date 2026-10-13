import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';

// Derivation, not image editing: exact vector masks label the generated light
// samples. The original RGB painting never enters public content or the app.
const root='content/smooth-finish-i33',publicRoot='apps/web/public/content';
const before='test-results/smooth-home-i33/revision-1/before-files';
const W=1600,H=2000,N=W*H,sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),pretty=v=>JSON.stringify(v,null,2)+'\n';
const references=await read('test-results/smooth-home-i33/revision-1/before/evidence.json');
const catalog=await read(`${before}/apps__web__public__content__catalog.json`),reports=[];
await fs.mkdir(`${root}/derived`,{recursive:true});
for(const entry of catalog){
 const t=await read(`${before}/${entry.id}.json`),profile=t.paintingProfile,eyes=new Set(profile.eyes.map(e=>e.regionId));
 const groups=profile.groups.filter(g=>!g.regionIds.some(id=>eyes.has(id)));
 const parts=t.regions.filter(r=>groups.some(g=>g.regionIds.includes(r.id)));
 const groupIndex=parts.map(r=>groups.findIndex(g=>g.regionIds.includes(r.id)));
 const palette=references.find(e=>e.id===t.id).palette;
 const file=t.themeId==='princess'?'content/princess-master/originals/princess-finished-v1.png':`${root}/originals/${t.themeId}-finished-v1.png`;
 const original=await fs.readFile(file),meta=await sharp(original).metadata();
 let registered;
 if(t.themeId==='princess'){
  const {normalization:n}=await read('content/generated-lineart/compiled/gen-princess-bunny-v6/qa.json');
  registered=await sharp({create:{width:W,height:H,channels:3,background:'#fff'}}).composite([{input:await sharp(original).resize(...n.imageSize).toBuffer(),left:n.offset[0],top:n.offset[1]}]).removeAlpha().raw().toBuffer();
 }else{
  if(Math.abs(meta.width/meta.height-W/H)>.002)throw Error(`Master aspect ratio mismatch: ${t.id}`);
  registered=await sharp(original).resize(W,H).removeAlpha().raw().toBuffer();
 }
 await sharp(registered,{raw:{width:W,height:H,channels:3}}).png().toFile(`${root}/derived/${t.themeId}-registered.png`);
 const c=createCanvas(W,H),ctx=c.getContext('2d');
 for(const [i,r]of parts.entries()){ctx.fillStyle=`rgb(${i+1},0,0)`;ctx.fill(new Path2D(r.path),r.fillRule??'nonzero');}
 const labels=new Uint8Array(N),rgba=ctx.getImageData(0,0,W,H).data;
 let invalidLabels=0;
 for(let p=0;p<N;p++)if(rgba[p*4+3]===255){const label=rgba[p*4];if(label>0&&label<=parts.length)labels[p]=label;else invalidLabels++;}
 if(invalidLabels>100)throw Error(`Unexpected raster labels: ${t.id}: ${invalidLabels}`);
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';
 const faceIds=new Set(profile.eyes.map(e=>e.parentRegionId));
 for(const e of profile.eyes){const g=e.geometry;ctx.beginPath();ctx.ellipse(g.cx,g.cy,g.width*.82,g.height*.88,g.rotation,0,Math.PI*2);ctx.fill();}
 for(const r of t.regions.filter(r=>/口/.test(r.name))){const b=r.bounds;ctx.fillRect(b.x-12,b.y-12,b.width+24,b.height+24);}
 const protectedPixels=ctx.getImageData(0,0,W,H).data;c.width=c.height=1;
 const queue=new Int32Array(N),distance=new Uint16Array(N);distance.fill(65535);let head=0,tail=0;
 const neighbors=p=>[p%W?p-1:-1,p%W<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
 for(let p=0;p<N;p++)if(labels[p]&&neighbors(p).some(q=>q<0||labels[q]!==labels[p])){distance[p]=0;queue[tail++]=p;}
 while(head<tail){const p=queue[head++],d=distance[p]+1;for(const q of neighbors(p))if(q>=0&&labels[q]===labels[p]&&distance[q]>d){distance[q]=d;queue[tail++]=q;}}
 const light=new Float32Array(N),valid=new Uint8Array(N),samples=groups.map(()=>[]),partSamples=new Uint32Array(parts.length);
 const lum=p=>(.2126*registered[p*3]+.7152*registered[p*3+1]+.0722*registered[p*3+2])/255;
 const colorVectors=groups.map(g=>{const n=parseInt(palette[g.id].slice(1),16),channels=[n>>>16,(n>>>8)&255,n&255],sum=channels.reduce((a,b)=>a+b,0);return channels.map(v=>v/sum);});
 for(let p=0;p<N;p++)if(labels[p]&&distance[p]>=6){
  const pi=labels[p]-1,gi=groupIndex[pi],r=parts[pi],l=lum(p);
  if(faceIds.has(r.id)&&protectedPixels[p*4+3])continue;
  if(l<.045||l>.987)continue;
  const rgb=[registered[p*3],registered[p*3+1],registered[p*3+2]],sum=rgb.reduce((a,b)=>a+b,0),vector=colorVectors[gi];
  // Reject displaced neighboring pigments and white page samples, while
  // allowing neutral reflections and natural variation within the material.
  const chroma=Math.max(...rgb)-Math.min(...rgb),mismatch=Math.hypot(...rgb.map((v,i)=>v/sum-vector[i]));
  if(chroma>24&&mismatch>.19)continue;
  if(faceIds.has(r.id)&&l<.28)continue;
  valid[p]=1;light[p]=l;samples[gi].push(p);partSamples[pi]++;
 }
 const stats=groups.map((g,i)=>{
  const points=samples[i];points.sort((a,b)=>light[a]-light[b]);
  const reference=points.length?points[Math.floor(points.length*.56)]:null;
  return {groupId:g.id,name:g.name,referenceColor:palette[g.id],referenceLuminance:reference===null?.6:light[reference],sampleCount:points.length};
 });
 const inferred=[];for(let p=0;p<N;p++)if(labels[p]&&!valid[p])inferred.push(p);
 head=0;tail=0;for(let p=0;p<N;p++)if(valid[p])queue[tail++]=p;
 while(head<tail){const p=queue[head++];for(const q of neighbors(p))if(q>=0&&labels[q]===labels[p]&&!valid[q]){valid[q]=1;light[q]=light[p];queue[tail++]=q;}}
 for(let pass=0;pass<60;pass++)for(const p of inferred){let sum=0,count=0;for(const q of neighbors(p))if(q>=0&&labels[q]===labels[p]&&valid[q]){sum+=light[q];count++;}if(count)light[p]=sum/count;}
 const field=Buffer.alloc(N,128);let min=255,max=0;
 for(let p=0;p<N;p++)if(labels[p]){
  const s=stats[groupIndex[labels[p]-1]],l=valid[p]?light[p]:s.referenceLuminance,base=s.referenceLuminance;
  const value=l<base?.5*Math.max(.14,l/base):.5+.5*Math.min(.90,(l-base)/(1-base));
  const v=Math.round(value*255);field[p]=v;min=Math.min(min,v);max=Math.max(max,v);
 }
 // Extend the sampled edge through the existing opaque ink. Runtime coverage
 // still clips exactly, so this cannot paint a neighboring part or background.
 const extended=Buffer.from(field);for(let p=0;p<N;p++)if(!labels[p]){for(let radius=1;radius<=6;radius++){const q=[p-radius,p+radius,p-radius*W,p+radius*W].find(q=>q>=0&&q<N&&Math.abs(q%W-p%W)<=radius&&labels[q]);if(q!==undefined){extended[p]=field[q];break;}}}
 const map=await sharp(extended,{raw:{width:W,height:H,channels:1}}).blur(.65).resize(2048,2560,{kernel:'cubic'}).png().toBuffer();
 const url=`/content/media/smooth-${t.themeId}-v1.${sha(map)}.png`;
 try{await fs.writeFile(`apps/web/public${url}`,map,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||!map.equals(await fs.readFile(`apps/web/public${url}`)))throw e;}
 await fs.writeFile(`${root}/derived/${t.themeId}-light.png`,map);
 const previousHash=sha(await fs.readFile(`${before}/${entry.id}.json`));
 profile.mediumAssets.smooth=url;profile.smoothArtwork={encoding:'relative-light-v1',width:2048,height:2560,masterSha256:sha(original),ink:'pigment-v1',groups:stats.map(({groupId,referenceColor})=>({groupId,referenceColor}))};
 const bytes=pretty(t);entry.assetUrl=await publishRevision(publicRoot,'templates',t.id,'json',bytes);await fs.writeFile(`${publicRoot}/templates/${t.id}.json`,bytes);
 const report={theme:t.themeId,templateId:t.id,previousTemplateSha256:previousHash,templateSha256:sha(bytes),masterFile:file,masterSha256:sha(original),originalSize:[meta.width,meta.height],mapUrl:url,mapSha256:sha(map),range:[min,max],groups:stats,regionsWithoutDirectSamples:parts.filter((_,i)=>!partSamples[i]).map(r=>r.id),privateMaster:true,humanApproved:false};
 reports.push(report);console.log(JSON.stringify({theme:t.themeId,groups:groups.length,mapBytes:map.length,fallbackParts:report.regionsWithoutDirectSamples}));
}
await fs.writeFile(`${publicRoot}/catalog.json`,pretty(catalog));
await fs.writeFile(`${root}/manifest.json`,pretty({instruction:'I33',scope:'smooth only; current ten templates; geometry unchanged',humanApproved:false,templates:reports}));
