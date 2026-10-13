import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Path2D,PathOp,createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {groupsByTheme,eyesByTheme,regionId} from '../tools/asset-pipeline/storybook-groups.mjs';
import {fitPolygonPath,polygonContours} from '../tools/asset-pipeline/vector-curves.mjs';
import {authorEye,eyeNames,eyeParents,additionalEyeClearance} from '../tools/asset-pipeline/authored-eyes.mjs';
import {templateHash} from '../tools/asset-pipeline/build.mjs';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';
import {constructionMap,retired} from '../tools/asset-pipeline/faceless-vehicle.mjs';
import {sharedBoundaries,parityPath} from '../tools/asset-pipeline/shared-boundaries.mjs';
import {retainedVectorDetails} from '../tools/asset-pipeline/vector-detail-retirements.mjs';

const publicRoot='apps/web/public/content',out='content/vector-generated/compiled';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8')),pretty=v=>JSON.stringify(v,null,2)+'\n',sha=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(out,{recursive:true});
const adoption=await read('content/generated-lineart/user-adoption.json'),reports=[],catalog=[],upgrades={};
const bbox=p=>{const b=new Path2D(p).computeTightBounds();return {x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]};};
// Fixed semantic correspondence reviewed on debug-regions.png; no grouping or
// upgrade is inferred from current paint/color/material. r08 is negative space.
function facelessSource(raw,old){return {...raw,regions:raw.regions.filter(r=>constructionMap[Number(r.id.slice(1))]).map(r=>{const original=old.regions.find(o=>o.id===regionId(constructionMap[Number(r.id.slice(1))]));return {...original,path:r.path,bounds:r.bounds};})};}
function envelope(a,b){const points=[...polygonContours(a).flat(),...polygonContours(b).flat()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of [...points].reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];}
function measure(points){
 const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cy=points.reduce((a,p)=>a+p[1],0)/points.length;let xx=0,xy=0,yy=0;for(const [x,y]of points){xx+=(x-cx)**2;xy+=(x-cx)*(y-cy);yy+=(y-cy)**2;}
 let r=.5*Math.atan2(2*xy,xx-yy)-Math.PI/2;while(r<-Math.PI/2)r+=Math.PI;while(r>Math.PI/2)r-=Math.PI;if(Math.hypot(xx-yy,2*xy)/(xx+yy)<.08)r=0;
 const c=Math.cos(r),s=Math.sin(r),u=points.map(([x,y])=>(x-cx)*c+(y-cy)*s),v=points.map(([x,y])=>-(x-cx)*s+(y-cy)*c),umin=Math.min(...u),umax=Math.max(...u),vmin=Math.min(...v),vmax=Math.max(...v),mu=(umin+umax)/2,mv=(vmin+vmax)/2;
 return {cx:cx+mu*c-mv*s,cy:cy+mu*s+mv*c,width:umax-umin+4,height:vmax-vmin+4,rotation:r};
}
function lineart(t){
 const profile=t.paintingProfile;
 const geometry=v=>`<ellipse cx="${v.cx}" cy="${v.cy}" rx="${v.width/2}" ry="${v.height/2}" transform="rotate(${v.rotation*180/Math.PI} ${v.cx} ${v.cy})"/>`;
 const eyes=profile.eyes.map((e,i)=>{const a=e.artwork,g=e.geometry;return `<defs><clipPath id="e${i}"><path d="${a.opening}"/></clipPath></defs><g clip-path="url(#e${i})"><path d="${a.opening}" fill="white"/><g fill="none" stroke="#000" stroke-width="${Math.max(1.6,g.width*.025)}">${geometry(a.iris)}${geometry(a.pupil)}<g fill="white" stroke-width="${Math.max(1.5,g.width*.022)}">${a.reflections.map(r=>`<path d="${r.path}"/>`).join('')}</g></g></g><g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><path d="${a.upperLid}" stroke-width="${a.upperWidth}"/><path d="${a.lowerLid}" stroke-width="${a.lowerWidth}"/>${a.lashes.map(p=>`<path d="${p}" stroke-width="${a.lashWidth}"/>`).join('')}</g>`;}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2000" viewBox="0 0 1600 2000"><rect width="1600" height="2000" fill="white"/><path d="${profile.opaquePath}" fill="white"/>${t.details.map(d=>`<path d="${d.path}" fill="${d.fill??'none'}" stroke="#000" stroke-width="${d.strokeWidth??0}"/>`).join('')}${eyes}</svg>`;
}
for(const entry of adoption.templates){
 const old=await read(`${publicRoot}/templates/${entry.id}.json`);if(templateHash(old)!==entry.contentHash||sha(await fs.readFile(entry.originalFile))!==entry.originalSha256)throw Error(`Adopted source changed: ${entry.id}`);
 const previous=await read(`${publicRoot}/templates/${entry.id}-storybook-v1.json`);
 const raw=old.themeId==='construction'?await read('content/vector-generated/faceless-source/template.json'):await read(`content/generated-lineart/compiled/${entry.id}/template.json`);
 const source=old.themeId==='construction'?facelessSource(raw,old):raw,id=`${entry.id}-storybook-v2`,automatic=new Set(),eyeById=new Map();
 const eyes=old.themeId==='construction'?[]:(eyesByTheme[old.themeId]??[]).map(([a,b,owner],index)=>{const region=source.regions.find(r=>r.id===regionId(a)),highlight=source.regions.find(r=>r.id===regionId(b)),authored=authorEye(measure(envelope(region.path,highlight.path)),owner,index);const eye={regionId:region.id,highlightId:highlight.id,owner,parentRegionId:eyeParents[owner],...authored};automatic.add(highlight.id);eyeById.set(region.id,eye);return eye;});
 let points=0,segments=0;
 const fit=p=>{const q=fitPolygonPath(p);points+=q.sourcePoints;segments+=q.segments;return q.path;};
 const ink=new Path2D(source.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' '));
 const scale=2,c=createCanvas(1600*scale,2000*scale),ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#000';ctx.fill(ink);
 // Reclaim the complete original eye hole INCLUDING its old ink into the
 // authored face parent, then cut the new opening from that same geometry.
 // This prevents a deleted lid becoming a white chip on painted skin.
 const clearedEyePaths=[];
 const poly=p=>'M'+p.map(p=>p.join(' ')).join('L')+'Z';
 const hit=createCanvas(1,1).getContext('2d');
 for(const parentId of new Set(eyes.map(e=>e.parentRegionId))){
  const parent=source.regions.find(r=>r.id===parentId);if(!parent)throw Error(`Authored eye parent is absent: ${id}/${parentId}`);
  const parts=polygonContours(parent.path).map(poly),owned=eyes.filter(e=>e.parentRegionId===parentId);
  for(const eye of owned){
   const g=eye.geometry,iris=source.regions.find(r=>r.id===eye.regionId),highlight=source.regions.find(r=>r.id===eye.highlightId),hull=poly(envelope(iris.path,highlight.path));
   // A nearby nose/mouth can overlap the eye's box. Only the closed hole
   // containing this pupil belongs to the eye and may be reclaimed.
   const holes=parts.flatMap((p,i)=>i&&hit.isPointInPath(new Path2D(p),g.cx,g.cy)?[{p,i}]:[]);
   for(const reviewed of additionalEyeClearance[eye.owner]?.[eye.regionId]??[]){
    const p=parts[reviewed.contour],b=p?new Path2D(p).computeTightBounds():[];
    if(b.length!==4||b.some((v,i)=>Math.abs(v-reviewed.bounds[i])>.01))throw Error(`Source eye clearance changed: ${id}/${eye.regionId}`);
    if(!holes.some(h=>h.i===reviewed.contour))holes.push({p,i:reviewed.contour});
   }
   let reclaim;
   if(holes.length){reclaim=new Path2D(holes.map(h=>h.p).join(' '));}
   else reclaim=new Path2D(hull).op(new Path2D(hull).stroke({width:18}),PathOp.Union);
   // The eye is required to be inside its assigned face or a source eye notch.
   if(!holes.length&&!hit.isPointInPath(reclaim,g.cx,g.cy))throw Error('Eye reclaim does not enclose the source pupil.');
   const reclaimed=reclaim.asWinding().toSVGString(),clear=new Path2D(reclaimed).op(new Path2D(reclaimed).stroke({width:2.5}),PathOp.Union).asWinding();clearedEyePaths.push({eye,path:clear});
  }
 }
 const dir=`${out}/ink/${id}`;await fs.mkdir(dir,{recursive:true});const sourceInkFile=`${dir}/source-ink.png`;await fs.writeFile(sourceInkFile,c.toBuffer('image/png'));
 for(const {path:p}of clearedEyePaths){ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fill(p);ctx.restore();}
 const inkFile=`${dir}/general.png`;await fs.writeFile(inkFile,c.toBuffer('image/png'));
 // A SINGLE white foreground prevents neighboring paint from being wiped out
 // by white region bases. Negative spaces remain transparent to backgrounds.
 ctx.clearRect(0,0,1600,2000);ctx.fillStyle='#000';ctx.fill(ink);for(const r of source.regions)ctx.fill(new Path2D(r.path));for(const d of source.details.filter(d=>d.fill==='#FFFFFF'))ctx.fill(new Path2D(d.path));
 const opaqueFile=`${dir}/opaque.png`;await fs.writeFile(opaqueFile,c.toBuffer('image/png'));
 // The sports car has an intentional narrow exterior gap between the hood
 // and headlight. Closing it would turn the gap into isolated unpaintable dots.
 const closeSeams=old.themeId==='vehicles'?0:1.5;
 const input=`${dir}/trace-input.json`,output=`${dir}/trace-output.json`;await fs.writeFile(input,pretty([{file:inkFile,x:0,y:0,scale,closeSeams,protectSilhouette:{opaque:opaqueFile,ink:sourceInkFile,width:5}},{file:opaqueFile,x:0,y:0,scale,closeSeams:1}]));
 const proc=spawnSync('C:/Users/yonaf/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',['tools/asset-pipeline/trace_storybook_ink.py',input,output],{encoding:'utf8',windowsHide:true});if(proc.status)throw Error(proc.stderr);const traced=await read(output);
 const shared=sharedBoundaries(traced[0],fit),fittedInk=shared.ink,opaquePath=fit(traced[1].path);
 const regions=source.regions.map(r=>{
  const exact=eyeById.has(r.id)?{path:eyeById.get(r.id).artwork.opening,fillRule:'nonzero'}:automatic.has(r.id)?{path:fit(r.path),fillRule:'nonzero'}:shared.region(r,eyes.filter(e=>e.parentRegionId===r.id).map(e=>e.artwork.opening));
  const p=exact.path;
  // Under-ink overlap may cover the ink itself, never bare background or the
  // neighboring exact region. A uniform outward stroke alone leaks pure color.
  const coverage=eyeById.has(r.id)||automatic.has(r.id)?p:parityPath(p)
   .op(new Path2D(p).stroke({width:5.5}),PathOp.Union)
   .op(parityPath(p).op(new Path2D(fittedInk),PathOp.Union),PathOp.Intersect)
   .asWinding().toSVGString();
  return {...r,path:p,fillRule:exact.fillRule,coveragePath:coverage,coverageFillRule:'evenodd',bounds:bbox(coverage)};
 });
 const groups=[],seen=new Set();
 const add=(name,ids,direction=100)=>{if(ids.some(id=>seen.has(id)||automatic.has(id)||!regions.some(r=>r.id===id)))throw Error(`Authored group invalid ${id}/${name}`);ids.forEach(id=>seen.add(id));const rs=ids.map(id=>regions.find(r=>r.id===id)),x=Math.min(...rs.map(r=>r.bounds.x)),y=Math.min(...rs.map(r=>r.bounds.y));const prior=previous.paintingProfile.groups.find(g=>g.name===name);groups.push({id:`g${groups.length+1}`,name,regionIds:ids,bounds:{x,y,width:Math.max(...rs.map(r=>r.bounds.x+r.bounds.width))-x,height:Math.max(...rs.map(r=>r.bounds.y+r.bounds.height))-y},direction,...(prior?.shading?{shading:prior.shading}:{})});};
 for(const [name,numbers,direction]of groupsByTheme[source.themeId]??[])add(name,numbers.map(regionId),direction);
 for(const owner of new Set(eyes.map(e=>e.owner)))add(`${eyeNames[owner]}の目`,eyes.filter(e=>e.owner===owner).map(e=>e.regionId));
 for(const r of regions)if(!seen.has(r.id)&&!automatic.has(r.id))add(r.name,[r.id],r.direction);
 const regionMap=Object.fromEntries(regions.map(r=>[r.id,r.id])),upgradeSources={[entry.id]:regionMap,[previous.id]:regionMap};
 const profile={version:3,eyeStyle:'authored-v3',groups,eyes,upgradeFrom:entry.id,regionMap,upgradeSources,...(old.themeId==='construction'?{retiredRegionIds:retired}:{}),opaquePath,mediumAssets:previous.paintingProfile.mediumAssets};
 const t={...old,id,regions,details:[...retainedVectorDetails(source).filter(d=>d.fill!=='#000000').map(d=>({...d,path:fit(d.path)})),{path:fittedInk,fill:'#000000',strokeWidth:0}],paintingProfile:profile};
 const svg=lineart(t),contentHash=templateHash(t),assetUrl=await publishRevision(publicRoot,'templates',id,'json',pretty(t)),thumbnailUrl=await publishRevision(publicRoot,'templates',id,'svg',svg);
 await fs.writeFile(`${publicRoot}/templates/${id}.json`,pretty(t));await fs.writeFile(`${publicRoot}/templates/${id}.svg`,svg);await fs.writeFile(`${out}/${id}.json`,pretty(t));
 const report={templateId:id,contentHash,sourceTemplateId:entry.id,sourceSha256:old.themeId==='construction'?sha(await fs.readFile('content/vector-generated/originals/excavator-faceless-v1.png')):entry.originalSha256,sourcePoints:points,cubicSegments:segments,curveError:.65,sharedBoundaries:shared.report(),regionCount:regions.length,groupCount:groups.length,eyeCount:eyes.length,retiredRegionIds:profile.retiredRegionIds??[],status:'candidate: native, browser, independent visual and performance verification pending',pass:false};reports.push(report);
 await fs.writeFile(`content/qa/${id}.json`,pretty(report));await fs.writeFile(`content/templates/reviews/${id}.json`,pretty({schemaVersion:1,templateId:id,regions:{},approval:{kind:'author-technical',contentHash,reviewer:'Codex vector artwork author',basis:'I17 implementation candidate; not a transfer of I5 adoption or prior PASS'}}));
 catalog.push({id,themeId:t.themeId,title:t.title,defaultColorFamily:t.defaultColorFamily,regionCount:t.regions.length,assetUrl,thumbnailUrl,coloredThumbnailUrl:thumbnailUrl});for(const from of Object.keys(upgradeSources))upgrades[from]=id;
 console.log(JSON.stringify({id,points,segments,regions:regions.length,eyes:eyes.length}));
}
await fs.writeFile(`${out}/technical-report.json`,pretty({reports,status:'pending current verification'}));await fs.writeFile(`${publicRoot}/catalog.json`,pretty(catalog));await fs.writeFile(`${publicRoot}/upgrade-index.json`,pretty(upgrades));
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');const c=createCanvas(1600,1000),ctx=c.getContext('2d');ctx.fillStyle='#edf6f6';ctx.fillRect(0,0,c.width,c.height);
for(let i=0;i<catalog.length;i++){const t=await read(`${out}/${catalog[i].id}.json`),x=i%5*320+12,y=Math.floor(i/5)*500+12;ctx.drawImage(await loadImage(Buffer.from(lineart(t))),x,y,296,370);ctx.fillStyle='#345563';ctx.font='16px "Review Japanese"';ctx.fillText(t.title,x+8,y+410,280);}
await fs.writeFile(`${out}/lineart-review.png`,c.toBuffer('image/png'));
