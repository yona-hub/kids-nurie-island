import {compileSurfaceLight} from './surface-light-atlas.mjs';
import sharp from 'sharp';

/** Each material owns its normalized light and its sampling gutter. A shared
 * page map cannot supply a boundary pixel after ownership has moved: it may
 * contain a neighboring material's normalization or a skin RGB value. */
export async function compileRelativePartLight(parts,labels,distance,gray,chromaticPixels,chromaticIds,groups=[],extra){
 const W=1600,H=2000,patches=[],rgbIds=new Set(chromaticIds),buckets=new Map();
 for(const [index,r]of parts.entries()){
  if(r.material==='skin')continue; // Retain the dedicated authored skin atlas.
  const id=(groups.find(g=>g.regionIds.includes(r.id))?.id??r.id)+':'+r.material;
  if(!buckets.has(id))buckets.set(id,[]);buckets.get(id).push({r,index});
 }
 for(const [id,members]of buckets){
  const x=Math.min(...members.map(({r})=>r.bounds.x)),y=Math.min(...members.map(({r})=>r.bounds.y)),right=Math.max(...members.map(({r})=>r.bounds.x+r.bounds.width)),bottom=Math.max(...members.map(({r})=>r.bounds.y+r.bounds.height));
  const r={id,bounds:{x,y,width:right-x,height:bottom-y}},indices=new Set(members.map(m=>m.index+1));
  const rgb=members.every(m=>rgbIds.has(m.r.id));
  const left=Math.max(0,Math.floor(x)-24),top=Math.max(0,Math.floor(y)-24),edgeX=Math.min(W,Math.ceil(right)+24),edgeY=Math.min(H,Math.ceil(bottom)+24);
  const width=edgeX-left,height=edgeY-top,N=width*height,data=Buffer.alloc(N*3,128),known=new Uint8Array(N),queue=new Int32Array(N);
  let head=0,tail=0;
  const seed=minDepth=>{for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const p=(y+top)*W+x+left,q=y*width+x;if(!indices.has(labels[p])||distance[p]<minDepth)continue;
   known[q]=1;queue[tail++]=q;
   if(rgb)data.set(chromaticPixels.subarray(p*3,p*3+3),q*3);else data.fill(gray[p],q*3,q*3+3);
  }};
  seed(4);if(!tail)seed(0);
  if(extra&&members.every(m=>m.r.material==='hair'))for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const p=(y+top)*W+x+left,q=y*width+x;if(known[q]||labels[p]||!extra.ink[p*4+3]||!indices.has(extra.owner[p]))continue;
   const spec=extra.hair.specifications[extra.owner[p]-1];if(!spec)continue;
   const v=extra.hair.value([extra.registered[p*3],extra.registered[p*3+1],extra.registered[p*3+2]],spec);if(v===undefined)continue;
   known[q]=1;queue[tail++]=q;data.fill(v,q*3,q*3+3);
  }
  if(!tail)throw Error(`Relative light has no own-region samples: ${r.id}`);
  while(head<tail){const p=queue[head++];for(const q of [p%width?p-1:-1,p%width<width-1?p+1:-1,p>=width?p-width:-1,p<N-width?p+width:-1])if(q>=0&&!known[q]){known[q]=1;data.set(data.subarray(p*3,p*3+3),q*3);queue[tail++]=q;}}
  // Keep a rubber joint's dark boundary out of the adjacent metal even when
  // both parts share one paint button. A median removes isolated source ink
  // fragments on manufactured surfaces while retaining broad gloss and form.
  const light=members.every(m=>['metal','plastic','glass'].includes(m.r.material))
   ?await sharp(data,{raw:{width,height,channels:3}}).median(5).raw().toBuffer():data;
  patches.push({regionId:r.id,target:{x:left,y:top,width,height},data:light});
 }
 try{
  const atlas=await compileSurfaceLight(patches);
  if(atlas)atlas.parts=atlas.parts.flatMap(p=>buckets.get(p.regionId).map(({r})=>({...p,regionId:r.id})));
  return atlas;
 }catch(e){
  if(e.message!=='Material light patches do not fit 2048x4096')throw e;
  // Disconnected groups waste a large empty bounding rectangle. Crop each
  // member from the SAME group field, retaining the shared light and phase.
  // 25-world-pixel alignment maps exactly to 32 atlas pixels at scale 1.28.
  const cropped=patches.flatMap(p=>buckets.get(p.regionId).map(({r})=>{
   const x=Math.max(0,Math.floor((r.bounds.x-24)/25)*25),y=Math.max(0,Math.floor((r.bounds.y-24)/25)*25),right=Math.min(W,Math.ceil((r.bounds.x+r.bounds.width+24)/25)*25),bottom=Math.min(H,Math.ceil((r.bounds.y+r.bounds.height+24)/25)*25),width=right-x,height=bottom-y,data=Buffer.alloc(width*height*3);
   for(let py=0;py<height;py++)for(let px=0;px<width;px++){const u=Math.max(0,Math.min(p.target.width-1,x+px-p.target.x)),v=Math.max(0,Math.min(p.target.height-1,y+py-p.target.y)),from=(v*p.target.width+u)*3;data.set(p.data.subarray(from,from+3),(py*width+px)*3);}
   return {regionId:r.id,target:{x,y,width,height},data};
  }));
  return compileSurfaceLight(cropped);
 }
}
