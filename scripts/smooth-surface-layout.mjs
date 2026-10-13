import {createCanvas,Path2D,PathOp,FillType,StrokeJoin,StrokeCap} from '@napi-rs/canvas';
import {fitPolygonPath} from '../tools/asset-pipeline/vector-curves.mjs';
import {euclideanOwners} from './euclidean-owners.mjs';

const W=1600,H=2000,N=W*H;
const stroke=(p,width)=>new Path2D(p).stroke({width,join:StrokeJoin.Round,cap:StrokeCap.Round});
const pathOf=(r,coverage=false)=>{const p=new Path2D(coverage?r.coveragePath??r.path:r.path);p.setFillType((coverage?r.coverageFillRule:r.fillRule)==='evenodd'?FillType.EvenOdd:FillType.Winding);return p;};
const bounds=p=>{const b=p.computeTightBounds();return {x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]};};
const solidFace=r=>(r.path.match(/M[^M]*/gi)??[]).map(path=>new Path2D(path)).sort((a,b)=>{const x=bounds(a),y=bounds(b);return y.width*y.height-x.width*x.height;})[0];

/** Label only solid pixels of each separate mask. Encoding IDs as RGB would
 * interpolate those IDs at antialiased edges and invent unrelated neighbors. */
export function rasterRegionLabels(parts,ctx){
 const labels=new Uint16Array(N);
 parts.forEach((r,i)=>{
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';ctx.fill(pathOf(r),r.fillRule??'nonzero');
  const x=Math.max(0,Math.floor(r.bounds.x)-1),y=Math.max(0,Math.floor(r.bounds.y)-1),right=Math.min(W,Math.ceil(r.bounds.x+r.bounds.width)+1),bottom=Math.min(H,Math.ceil(r.bounds.y+r.bounds.height)+1),w=right-x,h=bottom-y;
  const data=ctx.getImageData(x,y,w,h).data;
  for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(data[(py*w+px)*4+3]===255)labels[(py+y)*W+px+x]=i+1;
 });ctx.clearRect(0,0,W,H);return labels;
}

function simplifyOpen(points,tolerance){
 if(points.length<3)return points;const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const stack=[[0,points.length-1]],limit=tolerance*tolerance;
 while(stack.length){const [a,b]=stack.pop(),[x,y]=points[a],[u,v]=points[b],dx=u-x,dy=v-y,length=dx*dx+dy*dy;let best=limit,index=-1;
  for(let i=a+1;i<b;i++){const [px,py]=points[i],t=length?Math.max(0,Math.min(1,((px-x)*dx+(py-y)*dy)/length)):0,d=(px-x-t*dx)**2+(py-y-t*dy)**2;if(d>best){best=d;index=i;}}
  if(index>=0){keep[index]=1;stack.push([a,index],[index,b]);}
 }return points.filter((_,i)=>keep[i]);
}
function tracedPolygons(owner,include,count,tolerance=0){
 const edges=Array.from({length:count},()=>new Map()),stride=W+1;
 const put=(id,a,b)=>{const map=edges[id-1];if(!map.has(a))map.set(a,[]);map.get(a).push(b);};
 for(let p=0;p<N;p++)if(include(p)&&owner[p]){
  const id=owner[p],x=p%W,y=Math.floor(p/W),a=y*stride+x,same=q=>q>=0&&q<N&&owner[q]===id&&include(q);
  if(y===0||!same(p-W))put(id,a,a+1);
  if(x===W-1||!same(p+1))put(id,a+1,a+stride+1);
  if(y===H-1||!same(p+W))put(id,a+stride+1,a+stride);
  if(x===0||!same(p-1))put(id,a+stride,a);
 }
 return edges.map(map=>{
  let path='';while(map.size){const start=map.keys().next().value,points=[start];let at=start;
   do{const list=map.get(at);if(!list?.length)break;const next=list.pop();if(!list.length)map.delete(at);at=next;points.push(at);}while(at!==start);
   if(points.length>=4){let pts=points.slice(0,-1).map(v=>[v%stride,Math.floor(v/stride)]);
    if(tolerance&&pts.length>5){let far=1;for(let i=2;i<pts.length;i++)if((pts[i][0]-pts[0][0])**2+(pts[i][1]-pts[0][1])**2>(pts[far][0]-pts[0][0])**2+(pts[far][1]-pts[0][1])**2)far=i;
     pts=[...simplifyOpen(pts.slice(0,far+1),tolerance).slice(0,-1),...simplifyOpen([...pts.slice(far),pts[0]],tolerance).slice(0,-1)];}
    if(pts.length>=3)path+='M'+pts.map(p=>p.join(' ')).join('L')+'Z';}
  }
  return path;
 });
}

/** Compile full ink ownership and enclosed repair areas, with unchanged hit geometry. */
export function authorSurfaceLayout(t,parts,authored={}){
 const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
 const owner=rasterRegionLabels(parts,ctx),seeds=Uint16Array.from(owner),distance=new Uint16Array(N);distance.fill(65535);
 const queue=new Int32Array(N);let head=0,tail=0;
 for(let p=0;p<N;p++)if(owner[p]){distance[p]=0;queue[tail++]=p;}
 while(head<tail){const p=queue[head++],d=distance[p]+1;for(const q of [p%W?p-1:-1,p%W<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1])if(q>=0&&!owner[q]){owner[q]=owner[p];distance[q]=d;queue[tail++]=q;}}
 owner.set(euclideanOwners(seeds,W,H));
 const ink=new Path2D();for(const d of t.details.filter(d=>/^#0{3}(?:0{3})?$/i.test(d.fill)))ink.addPath(new Path2D(d.path));
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';ctx.fill(ink);const inkPixels=ctx.getImageData(0,0,W,H).data;
 // A cavity's pigment belongs inside its opening, not on the nearby outer
 // jaw. The enclosing body supplies old mouth ink; retain that exact black
 // ink separately while the cavity is unpainted or uses a dry medium.
 const mouthParts=parts.filter(r=>r.name==='口'||r.name.endsWith('の口'));
 // Only a registered complete cavity replaces its original mouth outline.
 // Animal tongue regions still need the surrounding nose/cheek smile ink.
 const cavityRegions=new Set([authored.mouth?.regionId,...(authored.sourceMouths??[]).map(m=>m.regionId)]),cavities=mouthParts.filter(r=>cavityRegions.has(r.id)),mouthIds=new Set(cavities.map(r=>parts.indexOf(r)+1)),bodyOwner=new Uint16Array(N);
 head=0;tail=0;for(let p=0;p<N;p++)if(seeds[p]&&!mouthIds.has(seeds[p])){bodyOwner[p]=seeds[p];queue[tail++]=p;}
 while(head<tail){const p=queue[head++];for(const q of [p%W?p-1:-1,p%W<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1])if(q>=0&&!bodyOwner[q]){bodyOwner[q]=bodyOwner[p];queue[tail++]=q;}}
 const bodySeeds=Uint16Array.from(seeds);for(let p=0;p<N;p++)if(mouthIds.has(bodySeeds[p]))bodySeeds[p]=0;
 const nearestBody=euclideanOwners(bodySeeds,W,H);
 for(let p=0;p<N;p++)if(inkPixels[p*4+3]&&mouthIds.has(owner[p]))owner[p]=bodyOwner[p];
 for(let p=0;p<N;p++)if(!seeds[p]||mouthIds.has(seeds[p]))owner[p]=nearestBody[p];
 const mouthMask=new Path2D(),mouths=mouthParts.map(r=>{const local=stroke(pathOf(r),24);if(cavityRegions.has(r.id))mouthMask.op(local,PathOp.Union);return {regionId:r.id,blankInkPath:new Path2D(ink).op(local,PathOp.Intersect).toSVGString()};});
 // Retired human brows and hair strokes inside the face belong to skin.
 // Spatial proximity alone would wrongly recolor these old ink holes as hair.
 for(const id of new Set(t.paintingProfile.eyes.filter(e=>e.artwork.kind==='human').map(e=>e.parentRegionId))){
  const i=parts.findIndex(r=>r.id===id);if(i<0)continue;
  ctx.clearRect(0,0,W,H);ctx.fill(solidFace(parts[i]));const face=ctx.getImageData(0,0,W,H).data;
  for(let p=0;p<N;p++)if(inkPixels[p*4+3]&&face[p*4+3])owner[p]=i+1;
 }
 for(const override of authored.surfaceOverrides??[]){
  const i=parts.findIndex(r=>r.id===override.regionId);if(i<0)throw Error('Unbound authored ink owner');
  ctx.clearRect(0,0,W,H);ctx.fill(new Path2D(override.path));const mask=ctx.getImageData(0,0,W,H).data;
  for(let p=0;p<N;p++)if(inkPixels[p*4+3]&&mask[p*4+3])owner[p]=i+1;
 }
 const opaque=new Path2D(t.paintingProfile.opaquePath);ctx.clearRect(0,0,W,H);ctx.fill(opaque);const silhouette=ctx.getImageData(0,0,W,H).data;
 ctx.clearRect(0,0,W,H);for(const r of t.regions)ctx.fill(pathOf(r,true),r.coverageFillRule??'nonzero');
 for(const e of t.paintingProfile.eyes)ctx.fill(new Path2D(e.artwork.opening));
 const covered=ctx.getImageData(0,0,W,H).data,repair=new Uint8Array(N);
 for(let p=0;p<N;p++)if(silhouette[p*4+3]>127&&!covered[p*4+3]&&!inkPixels[p*4+3]&&distance[p]<=80)repair[p]=1;
 const whiteDetails=[],explicitRepair=new Path2D(),enclosedReports=[];
 for(const item of authored.enclosedRepairs??[]){
  const i=parts.findIndex(r=>r.id===item.regionId);if(i<0)throw Error('Unbound authored repair');
  const seen=new Uint8Array(N),stack=[item.seed[1]*W+item.seed[0]],pixels=[];
  while(stack.length){const p=stack.pop();if(p<0||p>=N||seen[p]||covered[p*4+3]>127||inkPixels[p*4+3]>127)continue;seen[p]=1;pixels.push(p);if(pixels.length>item.maxPixels)throw Error(`Repair is not enclosed: ${t.id}/${item.regionId}`);const x=p%W;stack.push(x?p-1:-1,x<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1);}
  if(!pixels.length)throw Error(`Empty authored repair: ${t.id}/${item.regionId}`);
  const mask=new Path2D();for(const p of pixels){owner[p]=i+1;repair[p]=1;mask.rect(p%W,Math.floor(p/W),1,1);}
  const smooth=fitPolygonPath(mask.simplify().toSVGString(),{error:.35}).path,patch=new Path2D(smooth);patch.op(stroke(patch,3),PathOp.Union);explicitRepair.op(patch,PathOp.Union);
  ctx.clearRect(0,0,W,H);ctx.fill(patch,'evenodd');const data=ctx.getImageData(0,0,W,H).data;
  for(let p=0;p<N;p++)if(data[p*4+3]){owner[p]=i+1;repair[p]=1;}
  enclosedReports.push({regionId:item.regionId,seed:item.seed,pixels:pixels.length});
 }
 for(const [detailIndex,d]of t.details.entries())if(/^#f{3}(?:f{3})?$/i.test(d.fill)){
  const patch=new Path2D(d.path).op(stroke(new Path2D(d.path),12),PathOp.Union),b=bounds(patch);
  const tires=parts.map((r,i)=>({r,i})).filter(({r})=>r.material==='rubber'&&/タイヤ/.test(r.name));
  const explicitOwner=authored.whiteDetailOwners?.[detailIndex],target=explicitOwner?{r:parts.find(r=>r.id===explicitOwner),i:parts.findIndex(r=>r.id===explicitOwner)}:tires.sort((a,c)=>{const dist=r=>{const x=b.x+b.width/2,y=b.y+b.height/2,p=r.bounds;return Math.max(p.x-x,0,x-p.x-p.width)**2+Math.max(p.y-y,0,y-p.y-p.height)**2;};return dist(a.r)-dist(c.r);})[0];
  ctx.clearRect(0,0,W,H);ctx.fill(patch,'evenodd');const data=ctx.getImageData(0,0,W,H).data,votes=new Uint32Array(parts.length);
  for(let p=0;p<N;p++)if(data[p*4+3]&&owner[p]){repair[p]=1;if(target)owner[p]=target.i+1;votes[owner[p]-1]++;}
  const index=target?.i??votes.indexOf(Math.max(...votes));whiteDetails.push({detailIndex,regionId:parts[index].id});explicitRepair.op(patch,PathOp.Union);
 }
 // Enclosed collar gaps are finishing defects. Limit closing to an authored
 // neck neighborhood; intentional spaces elsewhere remain untouched.
 for(const neck of parts.filter(r=>r.name==='首')){
  const dilated=new Path2D(opaque).op(stroke(opaque,24),PathOp.Union),closed=new Path2D(dilated).op(stroke(dilated,24),PathOp.Difference),roi=new Path2D(),b=neck.bounds;
  roi.rect(b.x-16,b.y-16,b.width+32,b.height+32);const patch=closed.op(opaque,PathOp.Difference).op(roi,PathOp.Intersect);
  ctx.clearRect(0,0,W,H);ctx.fill(patch,'evenodd');const data=ctx.getImageData(0,0,W,H).data;
  for(let p=0;p<N;p++)if(data[p*4+3]&&owner[p])repair[p]=1;explicitRepair.op(patch,PathOp.Union);
 }
 const allowed=new Path2D(opaque).op(explicitRepair,PathOp.Union);
 // Authored regular fill regions can cover old white pinholes that the legacy
 // opaque silhouette omitted. Never intersect those valid faces away.
 for(const r of t.regions)allowed.op(pathOf(r),PathOp.Union);
 const paintSurface=new Path2D(allowed).op(ink,PathOp.Union);
 const repairCounts=new Uint32Array(parts.length),inkCounts=new Uint32Array(parts.length);
 for(let p=0;p<N;p++)if(owner[p]){if(inkPixels[p*4+3])inkCounts[owner[p]-1]++;if(repair[p])repairCounts[owner[p]-1]++;}
 // Whole nearest-region cells are simple color fields. Tracing thousands of
 // separate ink ribbons would be needlessly costly and leave field pinholes.
 const colorCells=tracedPolygons(owner,()=>true,parts.length),repairMasks=tracedPolygons(owner,p=>!!repair[p],parts.length);
 const fit=s=>s?new Path2D(fitPolygonPath(s,{error:.35}).path):new Path2D();
 const fitting=authored.colorFieldFitting??{error:3,cornerSpan:27,smoothingPasses:6};
 const fields=parts.map((r,i)=>{
  const localFit={...fitting,...authored.regionColorFieldFitting?.[r.id]};
  const area=new Path2D(colorCells[i]?fitPolygonPath(colorCells[i],localFit).path:'M0 0Z');
  if(colorCells[i])area.op(stroke(area,Math.max(8,localFit.error*2+2)),PathOp.Union);
  if(t.paintingProfile.eyes.some(e=>e.parentRegionId===r.id&&e.artwork.kind==='human'))area.op(solidFace(r),PathOp.Union);
  const visible=new Path2D(area).op(paintSurface,PathOp.Intersect),visibleBounds=bounds(visible);
  const result={regionId:r.id,path:area.toSVGString()||'M0 0Z',paintedByField:!!colorCells[i],bounds:visibleBounds.width>0&&visibleBounds.height>0?visibleBounds:r.bounds};
  if(repairCounts[i]){
   const extra=fit(repairMasks[i]),coverage=pathOf(r,true).op(new Path2D(extra).op(stroke(extra,2),PathOp.Union),PathOp.Union).op(allowed,PathOp.Intersect);
   result.coveragePath=coverage.toSVGString();result.paintBounds=bounds(coverage);
  }
  return result;
 });
 // Adjacent surfaces share one authored curve at a delicate facial junction.
 // The underpaint overlaps beneath its neighbor; cutting both existing fields
 // alone can leave paper where the old nearest-region cell never reached.
 for(const boundary of authored.fieldBoundaryOverrides??[]){
  const ids=new Set([boundary.regionId,...boundary.neighborRegionIds]);
  if(!boundary.neighborRegionIds.includes(boundary.complementRegionId)||[...ids].some(id=>!fields.some(f=>f.regionId===id)))throw Error('Unbound authored field boundary');
  if(!Number.isFinite(boundary.overlapWorld)||boundary.overlapWorld<0||boundary.overlapWorld>2)throw Error('Invalid authored boundary overlap');
  const domain=new Path2D(boundary.domainPath),inside=new Path2D(boundary.regionPath).op(domain,PathOp.Intersect);
  const underpaint=new Path2D(inside).op(stroke(inside,boundary.overlapWorld*2),PathOp.Union).op(domain,PathOp.Intersect);
  const complement=new Path2D(domain).op(inside,PathOp.Difference);
  for(const field of fields.filter(f=>ids.has(f.regionId))){
   const area=new Path2D(field.path);
   if(field.regionId===boundary.regionId)area.op(domain,PathOp.Difference).op(underpaint,PathOp.Union);
   else if(field.regionId===boundary.complementRegionId)area.op(domain,PathOp.Difference).op(complement,PathOp.Union);
   else area.op(inside,PathOp.Difference);
   field.path=area.toSVGString();const visible=bounds(new Path2D(area).op(paintSurface,PathOp.Intersect));
   if(visible.width>0&&visible.height>0)field.bounds=visible;
  }
 }
 const faces=[];
 for(const parent of new Set(t.paintingProfile.eyes.filter(e=>e.artwork.kind!=='human').map(e=>e.parentRegionId))){
  const eyes=t.paintingProfile.eyes.filter(e=>e.parentRegionId===parent),r=parts.find(r=>r.id===parent);if(!r)continue;
  const gs=eyes.map(e=>e.geometry),w=Math.max(...gs.map(g=>g.width)),h=Math.max(...gs.map(g=>g.height));
  const roi=new Path2D();roi.rect(Math.min(...gs.map(g=>g.cx))-w*1.5,Math.min(...gs.map(g=>g.cy))-h*1.3,Math.max(...gs.map(g=>g.cx))-Math.min(...gs.map(g=>g.cx))+w*3,Math.max(...gs.map(g=>g.cy))-Math.min(...gs.map(g=>g.cy))+h*3.1);
  const face=solidFace(r),inside=new Path2D(face).op(stroke(face,12),PathOp.Difference);
  let detail=new Path2D(ink).op(inside,PathOp.Intersect).op(roi,PathOp.Intersect);
  if(['bunny','cat'].includes(eyes[0].owner)){
   const localInk=new Path2D(ink).op(roi,PathOp.Intersect),core=new Path2D(localInk).op(stroke(localInk,4),PathOp.Difference),wide=new Path2D(core).op(stroke(core,8),PathOp.Union);
   detail.op(new Path2D(localInk).op(wide,PathOp.Difference),PathOp.Union);
  }
  for(const e of eyes){const g=e.geometry,mask=new Path2D();mask.ellipse(g.cx,g.cy,g.width*.67,g.height*.70,g.rotation,0,Math.PI*2);detail.op(mask,PathOp.Difference);}
  if(authored.featureErasePath)detail.op(new Path2D(authored.featureErasePath),PathOp.Difference);
  detail.op(mouthMask,PathOp.Difference);
  faces.push({parentRegionId:parent,colorRegionId:eyes[0].artwork.kind==='robot'?eyes[0].regionId:parent,kind:eyes[0].artwork.kind,path:detail.toSVGString()});
 }
 canvas.width=canvas.height=1;
 return {fields,faces,whiteDetails,mouths,owner,inkPixels,paintSurfacePath:paintSurface.toSVGString(),repairSilhouettePath:explicitRepair.toSVGString(),report:{ownedInkPixels:Array.from(inkCounts),repairPixels:Array.from(repairCounts),whiteDetails,enclosedRepairs:enclosedReports,faceCount:faces.length,colorFieldFitting:fitting,fieldBoundaryOverrides:authored.fieldBoundaryOverrides??[],ownership:'euclidean-v2'}};
}
