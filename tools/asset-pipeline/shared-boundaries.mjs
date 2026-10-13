import {Path2D,PathOp,FillType,createCanvas} from '@napi-rs/canvas';

const context=createCanvas(1,1).getContext('2d');
export function parityPath(path){const p=new Path2D(path);p.setFillType(FillType.EvenOdd);return p;}

/** One authored boundary graph supplies visible ink, exact fills and hit data. */
export function sharedBoundaries(traced,fit){
 const loops=traced.boundaries.map(b=>({...b,path:fit(b.path)}));
 for(const b of loops){b.shape=new Path2D(b.path);b.bounds=b.shape.computeTightBounds();}
 const white=loops.filter(b=>b.depth%2===1),used=new Map();
 return {
  ink:loops.map(b=>b.path).join(''),
  region(source,openings=[]){
   const original=new Path2D(source.path),bb=original.computeTightBounds();let match;
   // Deep interior samples avoid a raster stair step or the slightly moved ink.
   for(const count of [1,4,8,16,32]){
    for(let y=0;y<count&&!match;y++)for(let x=0;x<count&&!match;x++){
     const px=bb[0]+(x+.5)/count*(bb[2]-bb[0]),py=bb[1]+(y+.5)/count*(bb[3]-bb[1]);
     if(!context.isPointInPath(original,px,py))continue;
     const candidates=white.filter(b=>px>b.bounds[0]&&px<b.bounds[2]&&py>b.bounds[1]&&py<b.bounds[3]&&context.isPointInPath(b.shape,px,py)&&!loops.some(child=>child.parent===b.index&&context.isPointInPath(child.shape,px,py)));
     if(candidates.length>1)throw Error(`Ambiguous boundary at ${source.id}: ${px},${py}`);
     match=candidates[0];
    }
    if(match)break;
   }
   if(!match)throw Error(`No enclosed ink boundary for ${source.id} (${source.name})`);
   if(used.has(match.index))throw Error(`Unseparated semantic regions ${used.get(match.index)} and ${source.id}`);
   used.set(match.index,source.id);
   // Immediate black children exclude noses, mouths and enclosed other regions.
   // Deeper white grandchildren retain their own independent semantic IDs.
   const children=loops.filter(b=>b.parent===match.index).map(b=>b.path);
   let path=[match.path,...children].join('');
   for(const opening of openings)path=parityPath(path).op(new Path2D(opening),PathOp.Difference).toSVGString();
   return {path,fillRule:'evenodd',boundary:match.index};
  },
  report:()=>({inkBoundaries:loops.length,matchedRegions:used.size,matches:Object.fromEntries([...used].map(([b,id])=>[id,b]))}),
 };
}
