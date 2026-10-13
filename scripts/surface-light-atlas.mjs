import sharp from 'sharp';

// Keep the original light samples and their resolution. A shelf wastes whole
// rows beside tall/narrow patches; deterministic free rectangles fit them in
// the same 2048x4096 limit without shrinking or rotating the artwork.
export function packSurfacePatches(rectangles,width=2048,height=4096){
 const contains=(a,b)=>a.x<=b.x&&a.y<=b.y&&a.x+a.w>=b.x+b.w&&a.y+a.h>=b.y+b.h;
 let best;
 for(const order of ['area','height','width','side'])for(const heuristic of ['short','area','bottom']){
  const sorted=rectangles.map((r,i)=>({...r,i,w:r.width+8,h:r.height+8})).sort((a,b)=>{
   const metric=r=>order==='area'?r.w*r.h:order==='height'?r.h:order==='width'?r.w:Math.max(r.w,r.h);
   return metric(b)-metric(a)||b.h-a.h||a.i-b.i;
  });
  let free=[{x:0,y:0,w:width,h:height}],used=[],failed=false;
  for(const r of sorted){
   const choices=free.filter(f=>r.w<=f.w&&r.h<=f.h).map(f=>{const a=f.w-r.w,b=f.h-r.h;return {f,score:heuristic==='area'?f.w*f.h-r.w*r.h:heuristic==='bottom'?f.y+r.h:Math.min(a,b),second:Math.max(a,b)};}).sort((a,b)=>a.score-b.score||a.second-b.second||a.f.y-b.f.y||a.f.x-b.f.x);
   if(!choices.length){failed=true;break;}
   const u={x:choices[0].f.x,y:choices[0].f.y,w:r.w,h:r.h,i:r.i};used.push(u);const next=[];
   for(const f of free){
    if(u.x>=f.x+f.w||u.x+u.w<=f.x||u.y>=f.y+f.h||u.y+u.h<=f.y){next.push(f);continue;}
    if(u.x>f.x)next.push({...f,w:u.x-f.x});
    if(u.x+u.w<f.x+f.w)next.push({...f,x:u.x+u.w,w:f.x+f.w-u.x-u.w});
    if(u.y>f.y)next.push({...f,h:u.y-f.y});
    if(u.y+u.h<f.y+f.h)next.push({...f,y:u.y+u.h,h:f.y+f.h-u.y-u.h});
   }
   free=next.filter((f,i)=>!next.some((g,j)=>i!==j&&contains(g,f)&&(!contains(f,g)||j<i)));
  }
  if(failed)continue;
  const bottom=Math.max(...used.map(r=>r.y+r.h));
  if(!best||bottom<best.height)best={width,height:bottom,positions:used.sort((a,b)=>a.i-b.i).map(r=>({x:r.x+4,y:r.y+4,width:r.w-8,height:r.h-8}))};
 }
 if(!best)throw Error('Material light patches do not fit 2048x4096');
 return best;
}

export async function compileSurfaceLight(patches){
 if(!patches.length)return undefined;
 const rects=patches.map(p=>({width:Math.ceil(p.target.width*1.28),height:Math.ceil(p.target.height*1.28)})),packed=packSurfacePatches(rects),parts=[],images=[];
 for(const [i,patch]of patches.entries()){
  const source=packed.positions[i],image=await sharp(patch.data,{raw:{width:patch.target.width,height:patch.target.height,channels:3}}).blur(1.25).resize(source.width,source.height,{kernel:'cubic'}).png().toBuffer();
  parts.push({regionId:patch.regionId,source,target:patch.target});images.push({input:image,left:source.x,top:source.y});
 }
 const image=await sharp({create:{width:packed.width,height:packed.height,channels:3,background:{r:128,g:128,b:128}}}).composite(images).png().toBuffer();
 return {image,width:packed.width,height:packed.height,parts};
}
