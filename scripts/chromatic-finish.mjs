import {createCanvas,Path2D} from '@napi-rs/canvas';

// A separate, padded patch prevents a face from sampling the adjacent part's
// differently normalized lighting during image filtering or ink composition.
function skinLightPatch(part,domain,pixels){
 const left=Math.max(0,Math.floor(part.bounds.x)-24),top=Math.max(0,Math.floor(part.bounds.y)-24),right=Math.min(1600,Math.ceil(part.bounds.x+part.bounds.width)+24),bottom=Math.min(2000,Math.ceil(part.bounds.y+part.bounds.height)+24),width=right-left,height=bottom-top,N=width*height;
 const data=Buffer.alloc(N*3),known=new Uint8Array(N),queue=new Int32Array(N);let head=0,tail=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y+top)*1600+x+left,q=y*width+x;if(domain(p)){known[q]=1;queue[tail++]=q;data.set(pixels.subarray(p*3,p*3+3),q*3);}}
 while(head<tail){const p=queue[head++];for(const q of [p%width?p-1:-1,p%width<width-1?p+1:-1,p>=width?p-width:-1,p<N-width?p+width:-1])if(q>=0&&!known[q]){known[q]=1;data.set(data.subarray(p*3,p*3+3),q*3);queue[tail++]=q;}}
 return {regionId:part.id,target:{x:left,y:top,width,height},data};
}

/** Relative per-channel light for authored faces and mouth cavities. Neutral
 * 128 keeps any chosen pigment; local variation preserves blush and volume. */
export function chromaticFinish(t,parts,labels,registered,distance,protectedPixels,gray,owner,noseZone){
 const W=1600,H=2000,N=W*H,humanFaces=t.paintingProfile.eyes.filter(e=>e.artwork.kind==='human').map(e=>e.parentRegionId),skinGroups=t.paintingProfile.groups.filter(g=>g.regionIds.some(id=>humanFaces.includes(id))),ids=new Set([...humanFaces,...parts.filter(r=>r.material==='skin'&&skinGroups.some(g=>g.regionIds.includes(r.id))).map(r=>r.id),...parts.filter(r=>r.name==='口'||r.name.endsWith('の口')).map(r=>r.id)]);
 if(!ids.size)return {pixels:gray,channels:1,regionIds:[],references:[],skinPatches:[]};
 const out=Buffer.alloc(N*3);for(let p=0;p<N;p++)out.fill(gray[p],p*3,p*3+3);
 const references=[],skinPatches=[],neighbors=p=>[p%W?p-1:-1,p%W<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
 for(const id of ids){
  const pi=parts.findIndex(r=>r.id===id);if(pi<0)continue;const human=humanFaces.includes(id),skinGroup=skinGroups.find(g=>g.regionIds.includes(id)),mouth=parts[pi].name==='口'||parts[pi].name.endsWith('の口');
  let face,eyeOpenings;
  if(human){
   // Old lids cut the skin into isolated little islands. Connect those holes
   // through the outer face before inferring protected lighting; otherwise an
   // island with no valid samples would be normalized from zero (black).
   const paths=(parts[pi].path.match(/M[^M]*/gi)??[]).map(p=>new Path2D(p)).sort((a,b)=>{const x=a.computeTightBounds(),y=b.computeTightBounds();return (y[2]-y[0])*(y[3]-y[1])-(x[2]-x[0])*(x[3]-x[1]);});
   const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');ctx.fill(paths[0]);face=ctx.getImageData(0,0,W,H).data;
   ctx.clearRect(0,0,W,H);for(const eye of t.paintingProfile.eyes.filter(e=>e.parentRegionId===id))ctx.fill(new Path2D(eye.artwork.opening));eyeOpenings=ctx.getImageData(0,0,W,H).data;canvas.width=canvas.height=1;
  }
  // A broad authored nose zone can overlap a displaced source iris. Its
  // low-luminance exemption must never admit pigment inside an eye opening.
  const isNose=p=>noseZone?.regionId===id&&owner[p]===pi+1&&!eyeOpenings?.[p*4+3]&&((p%W-noseZone.x-noseZone.width/2)/(noseZone.width/2))**2+((Math.floor(p/W)-noseZone.y-noseZone.height/2)/(noseZone.height/2))**2<=1;
  // Some retired eye cutouts connect to the outside within the same contour,
  // so filling the largest subpath still leaves them outside `face`. Include
  // protected holes owned by this face before inferring their light. They
  // remain unknown samples: no original iris pigment seeds the skin atlas.
  const domain=p=>labels[p]===pi+1||isNose(p)||!!(face?.[p*4+3]&&(!labels[p]||labels[p]===pi+1))||!!(human&&protectedPixels[p*4+3]&&owner[p]===pi+1);
  const values=new Float32Array(N*3),valid=new Uint8Array(N),queue=new Int32Array(N),unknown=[],samples=[];let head=0,tail=0;
  for(let p=0;p<N;p++)if(domain(p)){
   const rgb=[registered[p*3],registered[p*3+1],registered[p*3+2]],l=(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255;
   const nose=isNose(p);
   const skinSample=!skinGroup||nose||(l>.30&&rgb[0]-rgb[2]>12&&rgb[0]>rgb[1]*1.04&&rgb[1]>rgb[2]*1.05&&rgb[1]>rgb[0]*.60&&rgb[2]>rgb[0]*.40);
   // Unlabeled ink/antialias holes have distance=65535, not interior depth.
   // Infer their light from actual skin; never seed them with neighboring RGB.
   if(((labels[p]===pi+1&&distance[p]>=4)||nose||mouth)&&(!human||!protectedPixels[p*4+3]||nose)&&l>(mouth?.002:.018)&&l<.985&&skinSample){
    valid[p]=1;queue[tail++]=p;values.set(rgb,p*3);samples.push({p,l});
   }else unknown.push(p);
  }
  if(samples.length<20)continue;
  samples.sort((a,b)=>a.l-b.l);const middle=samples.slice(Math.floor(samples.length*.45),Math.ceil(samples.length*.65));
  const faceReference=skinGroup&&references.find(r=>humanFaces.includes(r.regionId)&&skinGroup.regionIds.includes(r.regionId));
  const base=faceReference?.sourceReferenceRgb??[0,1,2].map(c=>{const a=middle.map(s=>values[s.p*3+c]).sort((a,b)=>a-b);return a[Math.floor(a.length/2)];});
  while(head<tail){const p=queue[head++];for(const q of neighbors(p))if(q>=0&&domain(q)&&!valid[q]){valid[q]=1;for(let c=0;c<3;c++)values[q*3+c]=values[p*3+c];queue[tail++]=q;}}
  for(let pass=0;pass<45;pass++)for(const p of unknown){const ns=neighbors(p).filter(q=>q>=0&&domain(q)&&valid[q]);if(ns.length)for(let c=0;c<3;c++)values[p*3+c]=ns.reduce((sum,q)=>sum+values[q*3+c],0)/ns.length;}
  const region=new Uint8Array(N);
  for(let p=0;p<N;p++)if(domain(p)){region[p]=1;for(let c=0;c<3;c++){const s=valid[p]?values[p*3+c]:base[c],b=base[c];out[p*3+c]=Math.round(s<b?127.5*Math.max(.025,s/Math.max(1,b)):127.5+127.5*Math.min(.97,(s-b)/Math.max(1,255-b)));}}
  if(skinGroup)skinPatches.push(skinLightPatch(parts[pi],domain,out));
  // The owner, rather than the nearest arbitrary color, supplies ink lighting.
  // A mouth rim must not read the differently normalized adjacent skin map.
  // Skin also needs a six-pixel sampling gutter across the old ink gap. Without
  // it, filtered edge pixels alternate between RGB skin and neutral light.
  const depth=new Uint8Array(N);head=0;tail=0;for(let p=0;p<N;p++)if(region[p])queue[tail++]=p;
  while(head<tail){const p=queue[head++];if(depth[p]>=32)continue;for(const q of neighbors(p))if(q>=0&&!region[q]&&(owner[q]===pi+1||(skinGroup&&depth[p]<6&&!labels[q]))){region[q]=1;depth[q]=depth[p]+1;out.set(out.subarray(p*3,p*3+3),q*3);queue[tail++]=q;}}
  references.push({regionId:id,sourceReferenceRgb:base,sampleCount:samples.length});
 }
 return {pixels:out,channels:3,regionIds:references.map(r=>r.regionId),references,skinPatches};
}
