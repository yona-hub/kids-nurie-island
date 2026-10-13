import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createCanvas,Path2D,PathOp} from '@napi-rs/canvas';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';
import {fitPolygonPath} from '../tools/asset-pipeline/vector-curves.mjs';
import {authorSurfaceLayout,rasterRegionLabels} from './smooth-surface-layout.mjs';
import {chromaticFinish} from './chromatic-finish.mjs';
import {registerSourceMouth} from './semantic-features.mjs';
import {compileSkinLight} from './skin-light-atlas.mjs';
import {compileRelativePartLight} from './relative-part-light.mjs';
import {sampleHairShadows} from './hair-light-samples.mjs';

// Derivation, not image editing: exact vector masks label the generated light
// samples. The original RGB painting never enters public content or the app.
const root='content/smooth-finish-i34',masterRoot='content/smooth-finish-i33',publicRoot='apps/web/public/content';
const before='test-results/smooth-home-i34/revision-1/before-files';
const W=1600,H=2000,N=W*H,sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),pretty=v=>JSON.stringify(v,null,2)+'\n';
const references=await read('test-results/smooth-home-i33/revision-1/before/evidence.json');
const catalog=await read(`${before}/apps__web__public__content__catalog.json`),reports=[];
const authored=await read(`${root}/authoring.json`);
await fs.mkdir(`${root}/derived`,{recursive:true});
for(const entry of catalog){
 const t=await read(`${before}/${entry.id}.json`),previousId=t.id,profile=t.paintingProfile,eyes=new Set(profile.eyes.map(e=>e.regionId));
 const groups=profile.groups.filter(g=>!g.regionIds.some(id=>eyes.has(id)));
 const parts=t.regions.filter(r=>groups.some(g=>g.regionIds.includes(r.id)));
 const groupIndex=parts.map(r=>groups.findIndex(g=>g.regionIds.includes(r.id)));
 const palette=references.find(e=>e.id===t.id).palette;
 const file=t.themeId==='princess'?'content/princess-master/originals/princess-finished-v1.png':`${masterRoot}/originals/${t.themeId}-finished-v1.png`;
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
 const labels=rasterRegionLabels(parts,ctx);
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';
 const faceIds=new Set(profile.eyes.map(e=>e.parentRegionId));
 for(const e of profile.eyes){const g=e.geometry,human=e.artwork.kind==='human';ctx.beginPath();ctx.ellipse(g.cx,g.cy,g.width*(human?.84:.82),g.height*(human?.84:.88),g.rotation,0,Math.PI*2);ctx.fill();}
 // Remove displaced dark eyelash/lid pixels, without blanking the nearby nose.
 for(const e of profile.eyes.filter(e=>e.artwork.kind==='human')){const g=e.geometry;for(let y=Math.floor(g.cy-g.height);y<g.cy+g.height*.8;y++)for(let x=Math.floor(g.cx-g.width);x<g.cx+g.width;x++){const p=y*W+x,v=(registered[p*3]+registered[p*3+1]+registered[p*3+2])/3;if(v<130&&((x-g.cx)/g.width)**2+((y-g.cy)/g.height)**2<1)ctx.fillRect(x,y,1,1);}}
 for(const r of t.regions.filter(r=>r.name==='口'||r.name.endsWith('の口'))){const b=r.bounds;ctx.fillRect(b.x-24,b.y-24,b.width+48,b.height+48);}
 const protectedPixels=ctx.getImageData(0,0,W,H).data;
 const queue=new Int32Array(N),distance=new Uint16Array(N);distance.fill(65535);let head=0,tail=0;
 const neighbors=p=>[p%W?p-1:-1,p%W<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
 for(let p=0;p<N;p++)if(labels[p]&&neighbors(p).some(q=>q<0||labels[q]!==labels[p])){distance[p]=0;queue[tail++]=p;}
 while(head<tail){const p=queue[head++],d=distance[p]+1;for(const q of neighbors(p))if(q>=0&&labels[q]===labels[p]&&distance[q]>d){distance[q]=d;queue[tail++]=q;}}
 const light=new Float32Array(N),valid=new Uint8Array(N),samples=groups.map(()=>[]),partSamples=new Uint32Array(parts.length);
 const lum=p=>(.2126*registered[p*3]+.7152*registered[p*3+1]+.0722*registered[p*3+2])/255;
 const layout=authorSurfaceLayout(t,parts,authored[t.themeId]),fields=layout.fields;
 const brows=[],hair=groups.find(g=>g.regionIds.some(id=>t.regions.find(r=>r.id===id).material==='hair'));
 for(const [eyeIndex,eye]of profile.eyes.filter(e=>e.artwork.kind==='human').entries()){
  const g=eye.geometry,pi=parts.findIndex(r=>r.id===eye.parentRegionId),x0=Math.floor(g.cx-g.width*.85),x1=Math.ceil(g.cx+g.width*.85),y0=Math.floor(g.cy-g.height*1.6),y1=Math.ceil(g.cy-g.height*.65);
  // The original face path has holes for its inked eyebrows. Sample the solid
  // outer face here so a new authored brow is not cut by those obsolete holes.
  const faceContours=parts[pi].path.match(/M[^M]*/gi),outer=faceContours.map(p=>({path:p,b:new Path2D(p).computeTightBounds()})).sort((a,b)=>(b.b[2]-b.b[0])*(b.b[3]-b.b[1])-(a.b[2]-a.b[0])*(a.b[3]-a.b[1]))[0];
  const solidFace=new Path2D(outer.path);
  const bits=new Uint8Array((x1-x0+1)*(y1-y0+1)),rw=x1-x0+1,rh=y1-y0+1;let count=0;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const p=y*W+x;if(ctx.isPointInPath(solidFace,x+.5,y+.5))protectedPixels[p*4+3]=255;
   if(ctx.isPointInPath(solidFace,x+.5,y+.5)&&lum(p)<.65&&registered[p*3+1]<registered[p*3]*.78&&registered[p*3]-registered[p*3+2]>25)bits[(y-y0)*rw+x-x0]=1;
  }
  const dilated=new Uint8Array(bits.length),closed=new Uint8Array(bits.length),mask=new Path2D();
  for(let y=1;y<rh-1;y++)for(let x=1;x<rw-1;x++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(bits[(y+dy)*rw+x+dx])dilated[y*rw+x]=1;
  for(let y=1;y<rh-1;y++)for(let x=1;x<rw-1;x++){let keep=1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!dilated[(y+dy)*rw+x+dx])keep=0;closed[y*rw+x]=keep;if(keep){mask.rect(x+x0,y+y0,1,1);count++;}}
  if(count>20||authored[t.themeId]?.brows?.[eyeIndex]){
   const polygon=mask.simplify().toSVGString(),path=authored[t.themeId]?.brows?.[eyeIndex]??fitPolygonPath(polygon,{error:.6}).path;
   const b=new Path2D(path).computeTightBounds();
   brows.push({parentRegionId:eye.parentRegionId,colorRegionId:hair?.regionIds[0]??eye.parentRegionId,path,clipPath:solidFace.toSVGString(),bounds:{x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]},sourcePixels:count});
  }
 }
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
 const extended=Buffer.from(field),edgeDepth=new Uint8Array(N),extendedLabels=Uint16Array.from(labels);head=0;tail=0;for(let p=0;p<N;p++)if(labels[p])queue[tail++]=p;
 while(head<tail){const p=queue[head++];if(edgeDepth[p]>=32)continue;for(const q of neighbors(p))if(q>=0&&!extendedLabels[q]&&layout.owner[q]===extendedLabels[p]){extendedLabels[q]=extendedLabels[p];edgeDepth[q]=edgeDepth[p]+1;extended[q]=extended[p];queue[tail++]=q;}}
 for(const zone of authored[t.themeId]?.sourceLightingZones??[]){const pi=parts.findIndex(r=>r.id===zone.regionId),base=stats[groupIndex[pi]].referenceLuminance,reference=colorVectors[groupIndex[pi]];for(let y=zone.y;y<zone.y+zone.height;y++)for(let x=zone.x;x<zone.x+zone.width;x++){const p=y*W+x;if(layout.owner[p]!==pi+1)continue;const l=lum(p),rgb=[registered[p*3],registered[p*3+1],registered[p*3+2]],sum=rgb.reduce((a,b)=>a+b,0),chroma=Math.max(...rgb)-Math.min(...rgb),mismatch=Math.hypot(...rgb.map((v,i)=>v/(sum||1)-reference[i]));if((chroma>24&&mismatch>.19)||(chroma<=24&&l<base*.55))continue;const v=l<base?.5*Math.max(.025,l/base):.5+.5*Math.min(.97,(l-base)/(1-base)),u=Math.min(1,Math.min(x-zone.x,zone.x+zone.width-x,y-zone.y,zone.y+zone.height-y)/(zone.feather??24)),weight=u*u*(3-2*u);extended[p]=Math.round(extended[p]*(1-weight)+v*255*weight);}}
 // Soft silhouette occlusion gives white fur a readable edge without a drawn
 // outline. Only the exterior opaque silhouette is used, never eye/ink holes.
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';ctx.fill(new Path2D(profile.opaquePath));
 const silhouette=ctx.getImageData(0,0,W,H).data,sd=new Uint16Array(N);sd.fill(65535);head=0;tail=0;
 for(let p=0;p<N;p++)if(silhouette[p*4+3]>127&&neighbors(p).some(q=>q<0||silhouette[q*4+3]<=127)){sd[p]=0;queue[tail++]=p;}
 while(head<tail){const p=queue[head++],d=sd[p]+1;if(d>10)continue;for(const q of neighbors(p))if(q>=0&&silhouette[q*4+3]>127&&sd[q]>d){sd[q]=d;queue[tail++]=q;}}
 for(let p=0;p<N;p++)if(sd[p]<10){
  const inward=(silhouette[(p+8)*4+3]>127?1:0)-(silhouette[(p-8)*4+3]>127?1:0)+(silhouette[(p+8*W)*4+3]>127?1:0)-(silhouette[(p-8*W)*4+3]>127?1:0);
  const strength=inward>0?.09:inward<0?.22:.16;
  extended[p]=Math.round(extended[p]*(1-strength*(1-sd[p]/10)**2));
 }
 c.width=c.height=1;
 const hairSamples=sampleHairShadows(parts,labels,registered,extended,stats,groups);
 // Authored source-mouth masks register the whole generated cavity, rather
 // than sampling only the smaller legacy tongue-shaped paintable opening.
 const semantic=Buffer.from(registered);
 for(const feature of authored[t.themeId]?.sourceMouths??[]){
  const pi=parts.findIndex(r=>r.id===feature.regionId);registerSourceMouth(semantic,registered,labels,pi+1,parts[pi],feature.path);
 }
 const chromatic=chromaticFinish(t,parts,labels,semantic,distance,protectedPixels,extended,layout.owner,authored[t.themeId]?.noseZone);
 const surface=await compileRelativePartLight(parts,labels,distance,extended,chromatic.pixels,chromatic.regionIds,groups,{registered,ink:layout.inkPixels,owner:layout.owner,hair:hairSamples});
 let surfaceLight;
 if(surface){
  const surfaceUrl=`/content/media/surface-${t.themeId}-v1.${sha(surface.image)}.png`;
  try{await fs.writeFile(`apps/web/public${surfaceUrl}`,surface.image,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||!surface.image.equals(await fs.readFile(`apps/web/public${surfaceUrl}`)))throw e;}
  profile.mediumAssets.surface=surfaceUrl;surfaceLight={width:surface.width,height:surface.height,parts:surface.parts};
 }
 const skin=await compileSkinLight(chromatic.skinPatches);let skinLight;
 if(skin){
  const skinUrl=`/content/media/skin-${t.themeId}-v1.${sha(skin.image)}.png`;
  try{await fs.writeFile(`apps/web/public${skinUrl}`,skin.image,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||!skin.image.equals(await fs.readFile(`apps/web/public${skinUrl}`)))throw e;}
  profile.mediumAssets.skin=skinUrl;skinLight={width:skin.width,height:skin.height,parts:skin.parts};
 }
 const map=await sharp(chromatic.pixels,{raw:{width:W,height:H,channels:chromatic.channels}}).blur(.65).resize(2048,2560,{kernel:'cubic'}).png().toBuffer();
 const url=`/content/media/smooth-${t.themeId}-v2.${sha(map)}.png`;
 try{await fs.writeFile(`apps/web/public${url}`,map,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||!map.equals(await fs.readFile(`apps/web/public${url}`)))throw e;}
 await fs.writeFile(`${root}/derived/${t.themeId}-light.png`,map);
 const previousHash=sha(await fs.readFile(`${before}/${previousId}.json`));
 const eyeFinishes=profile.eyes.map(e=>{
  const a=e.artwork,g=e.geometry,human=a.kind==='human',robot=a.kind==='robot';
  // The upper lid occludes the iris. A narrower, upward projection keeps
  // side/lower sclera without leaving a parallel pale band above the iris.
  const factors=e.owner==='princess'?[1.02,1.02,1.10,1.10]:human?[.94,.94,1.15,1.15]:robot?[1.02,1.02,1,1]:[.84,1.12,.82,1.12];
  const oval=(p,x,y,isIris=false)=>({...p,cx:p.cx,cy:p.cy-(human?g.height*.035:0),width:p.width*x,height:human&&isIris?Math.max(p.width*y,g.height*.95):(human?p.width:p.height)*y,rotation:g.rotation});
  const finishedIris=oval(a.iris,factors[0],factors[1],true);
  let upperShadePath;
  if(human){const nums=a.upperLid.match(/-?\d+(?:\.\d+)?/g).map(Number),points=[],other=[];const start=nums.slice(0,2),curves=[];for(let i=2;i<nums.length;i+=6)curves.push(nums.slice(i,i+6));let from=start;
   for(const [ci,curve]of curves.entries()){const [x1,y1,x2,y2,x3,y3]=curve,[x0,y0]=from;for(let j=0;j<=24;j++){if(ci&&j===0)continue;const u=j/24,v=1-u,q=(ci+u)/curves.length,x=v*v*v*x0+3*v*v*u*x1+3*v*u*u*x2+u*u*u*x3,y=v*v*v*y0+3*v*v*u*y1+3*v*u*u*y2+u*u*u*y3,dx=3*v*v*(x1-x0)+6*v*u*(x2-x1)+3*u*u*(x3-x2),dy=3*v*v*(y1-y0)+6*v*u*(y2-y1)+3*u*u*(y3-y2),length=Math.hypot(dx,dy),w=a.upperWidth*(e.owner==='princess'?.40:.45)*Math.sin(Math.PI*q)**.6;points.push([x-dy/length*w,y+dx/length*w]);other.push([x+dy/length*w,y-dx/length*w]);}from=[x3,y3];}
    const lid=new Path2D(fitPolygonPath('M'+[...points,...other.reverse()].map(p=>p.join(' ')).join('L')+'Z',{error:.12}).path);
    // Oppositely wound lash contours must be united, not concatenated: their
    // overlap otherwise cancels the lid fill and cuts white holes at the roots.
    for(const lash of authored[t.themeId]?.lashShapes?.[e.regionId]??[])lid.op(new Path2D(lash),PathOp.Union);
    upperShadePath=lid.toSVGString();
  }
  const lighting=authored[t.themeId]?.eyeLighting?.[e.regionId];
  if(human&&!lighting)throw Error(`Missing authored eye lighting: ${t.themeId}/${e.regionId}`);
  const reflectionCenters=human?[lighting.reflection,lighting.glint].map(([x,y])=>({x:finishedIris.cx+finishedIris.width*x,y:finishedIris.cy+finishedIris.height*y})):a.reflections.map(r=>{const b=new Path2D(r.path).computeTightBounds();return {x:(b[0]+b[2])/2,y:(b[1]+b[3])/2};});
  return {regionId:e.regionId,iris:finishedIris,pupil:oval(a.pupil,factors[2],factors[3]),upperShadePath,reflectionScale:robot?1.4:2.1,reflectionCenters};
 });
 profile.mediumAssets.smooth=url;profile.smoothArtwork={encoding:chromatic.regionIds.length?'relative-light-rgb-v2':'relative-light-v1',chromaticRegionIds:chromatic.regionIds,width:2048,height:2560,masterSha256:sha(original),ink:'surface-v1',eyes:eyeFinishes,skinLight,surfaceLight,surfaceFields:{fillRule:'evenodd',parts:fields,brows:brows.map(({parentRegionId,colorRegionId,path,clipPath,bounds})=>({parentRegionId,colorRegionId,path,clipPath,bounds})),faces:layout.faces,whiteDetails:layout.whiteDetails,mouths:layout.mouths.map(m=>({...m,...(authored[t.themeId]?.mouth?.regionId===m.regionId?authored[t.themeId].mouth:{})})),insets:authored[t.themeId]?.insets??[],repairSilhouettePath:layout.repairSilhouettePath,paintSurfacePath:layout.paintSurfacePath},groups:stats.map(({groupId,referenceColor})=>({groupId,referenceColor}))};
 // Finishing repairs fill legacy internal gaps. Publish a separate improved
 // artwork so saved originals keep their exact previous content and drawing.
 t.id=previousId.endsWith('-master-v3')?previousId.replace(/-master-v3$/,'-master-v4'):previousId.replace(/-storybook-v2$/,'-smooth-v3');
 profile.upgradeFrom=previousId;profile.regionMap=Object.fromEntries(t.regions.map(r=>[r.id,r.id]));profile.upgradeSources={...profile.upgradeSources,[previousId]:profile.regionMap};entry.id=t.id;
 const bytes=pretty(t);entry.assetUrl=await publishRevision(publicRoot,'templates',t.id,'json',bytes);await fs.writeFile(`${publicRoot}/templates/${t.id}.json`,bytes);
 await fs.copyFile(`${before}/${previousId}.json`,`${publicRoot}/templates/${previousId}.json`);
 const report={theme:t.themeId,templateId:t.id,previousTemplateId:previousId,previousTemplateSha256:previousHash,templateSha256:sha(bytes),masterFile:file,masterSha256:sha(original),originalSize:[meta.width,meta.height],mapUrl:url,mapSha256:sha(map),range:[min,max],groups:stats,brows,chromatic:chromatic.references,skinLight:skin?{...skinLight,mapUrl:profile.mediumAssets.skin,mapSha256:sha(skin.image),mapBytes:skin.image.length}:undefined,surfaceLight:surface?{...surfaceLight,mapUrl:profile.mediumAssets.surface,mapSha256:sha(surface.image),mapBytes:surface.image.length}:undefined,hairShadowSamples:hairSamples.count,layout:layout.report,regionsWithoutDirectSamples:parts.filter((_,i)=>!partSamples[i]).map(r=>r.id),privateMaster:true,humanApproved:false};
 reports.push(report);console.log(JSON.stringify({theme:t.themeId,groups:groups.length,mapBytes:map.length,fallbackParts:report.regionsWithoutDirectSamples}));
}
await fs.writeFile(`${publicRoot}/catalog.json`,pretty(catalog));
const upgrades=await read(`${publicRoot}/upgrade-index.json`);
for(const report of reports){const t=await read(`${publicRoot}/templates/${report.templateId}.json`);for(const sourceId of [report.previousTemplateId,...Object.keys(t.paintingProfile.upgradeSources??{})])upgrades[sourceId]=t.id;}
await fs.writeFile(`${publicRoot}/upgrade-index.json`,pretty(upgrades));
await fs.writeFile(`${root}/manifest.json`,pretty({instruction:'I34',scope:'smooth only; current ten templates; regular geometry unchanged; one alpha mask for surface-colored ink',humanApproved:false,templates:reports}));
