import {Path2D,PathOp,FillType,StrokeJoin,StrokeCap} from '@napi-rs/canvas';

const bounds=p=>{const b=p.computeTightBounds();return {x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]};};

/** Color a retained ink mask from the same continuous curves as its fills.
 * Raster nearest-owner cells are a fallback for detached ink only; using their
 * city-block borders beside a curve exposes steps at high zoom and DPR. */
export function continuousInkFields(parts,fields,humanParents,ink,{outset=0}={}){
 const locals=new Map(),near=new Path2D();
 for(const r of parts){
  let local=new Path2D();
  // Original cavity outlines belong to the face. The registered cavity is
  // drawn separately; recoloring its displaced old ink revives a second mouth.
  if(r.name!=='口'&&!r.name.endsWith('の口')){
   const path=r.coveragePath??r.path;
   if(humanParents.has(r.id)){
    // The outer face also owns retired brow/eye holes. Authored eyes and brows
    // are drawn on top; the blank and dry-medium contours stay unchanged.
    local=(path.match(/M[^M]*/gi)??[]).map(p=>new Path2D(p)).sort((a,b)=>{
     const x=bounds(a),y=bounds(b);return y.width*y.height-x.width*x.height;
    })[0]??local;
   }else{
    local=new Path2D(path);
    local.setFillType((r.coverageFillRule??r.fillRule)==='evenodd'?FillType.EvenOdd:FillType.Winding);
   }
   if(outset)local.op(new Path2D(local).stroke({width:outset,join:StrokeJoin.Round,cap:StrokeCap.Round}),PathOp.Union);
  }
  locals.set(r.id,local);near.op(local,PathOp.Union);
 }
 return fields.map(f=>{
  const field=new Path2D(f.path);field.setFillType(FillType.EvenOdd);
  field.op(near,PathOp.Difference).op(locals.get(f.regionId),PathOp.Union);
  const ownedInk=new Path2D(field).op(ink,PathOp.Intersect);
  return {...f,path:field.toSVGString()||'M0 0Z',bounds:bounds(ownedInk)};
 });
}
