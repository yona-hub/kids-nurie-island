import type {Region,RegionPaint,Template} from '../../shared-types/src/index';
import type {MediumImages} from './storybook-texture';
import {canvasImage,context2D,type CanvasFactory} from './canvas';

/** Registered relative lighting, applied to the freely selected base pigment. */
export function drawSmoothLight(ctx:CanvasRenderingContext2D,region:Region,color:string,template:Template,media?:MediumImages):boolean{
  const art=template.paintingProfile?.smoothArtwork;
  if(!art||!media?.smooth)return false;
  const chromatic=art.encoding==='relative-light-rgb-v2'&&art.chromaticRegionIds?.includes(region.id);
  if(!chromatic&&art.ink==='surface-v1'&&art.surfaceFields?.mouths?.some(m=>m.regionId===region.id)){
    const b=region.bounds,n=parseInt(color.slice(1),16),channels=[n>>>16,(n>>>8)&255,n&255],shade=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.height);
    for(const [stop,factor]of [[0,.28],[.5,.48],[1,.95]])shade.addColorStop(stop,`rgb(${channels.map(c=>Math.round(c*factor)).join(',')})`);
    ctx.save();ctx.fillStyle=shade;ctx.fillRect(b.x-16,b.y-16,b.width+32,b.height+32);ctx.restore();return true;
  }
  const rx=art.width/template.width,ry=art.height/template.height;
  const sx=Math.max(0,Math.floor((region.bounds.x-16)*rx)),sy=Math.max(0,Math.floor((region.bounds.y-16)*ry));
  const right=Math.min(art.width,Math.ceil((region.bounds.x+region.bounds.width+16)*rx)),bottom=Math.min(art.height,Math.ceil((region.bounds.y+region.bounds.height+16)*ry));
  ctx.save();ctx.globalCompositeOperation='hard-light';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(!chromatic&&art.ink==='surface-v1'&&template.paintingProfile?.eyes.some(e=>e.parentRegionId===region.id&&e.artwork?.kind==='human'))ctx.globalAlpha=.70;
  const surface=media.surface&&art.surfaceLight?.parts.find(p=>p.regionId===region.id);
  const skin=media.skin&&art.skinLight?.parts.find(p=>p.regionId===region.id);
  if(surface){const a=surface.source,b=surface.target;ctx.drawImage(media.surface!,a.x,a.y,a.width,a.height,b.x,b.y,b.width,b.height);}
  else if(skin){const a=skin.source,b=skin.target;ctx.drawImage(media.skin!,a.x,a.y,a.width,a.height,b.x,b.y,b.width,b.height);}
  else ctx.drawImage(media.smooth,sx,sy,right-sx,bottom-sy,sx/rx,sy/ry,(right-sx)/rx,(bottom-sy)/ry);
  if(chromatic){
    const n=parseInt(color.slice(1),16),r=n>>>16,g=(n>>>8)&255,b=n&255,human=template.paintingProfile?.eyes.some(e=>e.parentRegionId===region.id&&e.artwork?.kind==='human');
    // Keep natural blush for warm skin pigments. Other chosen hues and mouth
    // pigments retain their hue while the registered cavity/volume remains.
    if(!human||r<g||g<b||r-b<8){ctx.globalCompositeOperation='color';ctx.globalAlpha=human?.85:.55;ctx.fillStyle=color;if(art.surfaceLight){ctx.save();ctx.resetTransform();ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();}else ctx.fillRect(region.bounds.x-16,region.bounds.y-16,region.bounds.width+32,region.bounds.height+32);}
    ctx.restore();return true;
  }
  // Multiplying a pale pigment alone dulls skin/fur and bright colors. Restore
  // the chosen chroma over the measured luminance; no source color is used.
  ctx.globalCompositeOperation='color';ctx.globalAlpha=art.ink==='surface-v1'?.90:.75;ctx.fillStyle=color;
  const margin=art.ink==='surface-v1'?16:4;
  if(art.surfaceLight){ctx.save();ctx.resetTransform();ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();}
  else ctx.fillRect(region.bounds.x-margin,region.bounds.y-margin,region.bounds.width+margin*2,region.bounds.height+margin*2);ctx.restore();
  return true;
}

export interface SurfaceInkPart {region:Region;path:Path2D;field:Path2D;paint?:RegionPaint}

/** Shade before clipping: applying the same antialiased clip to pigment,
 * light and chroma separately exposes the white base at the old ink edge. */
export function drawSurfacePaint(ctx:CanvasRenderingContext2D,parts:SurfaceInkPart[],template:Template,media:MediumImages|undefined,createCanvas:CanvasFactory):void{
  const pigment=createCanvas(ctx.canvas.width,ctx.canvas.height),shade=context2D(pigment);
  for(const {region,field,paint}of parts.filter(p=>p.paint?.paintType==='smooth').sort((a,b)=>pigmentLuminance(b.paint!.color)-pigmentLuminance(a.paint!.color))){
    shade.resetTransform();shade.globalCompositeOperation='source-over';shade.globalAlpha=1;shade.fillStyle=paint!.color;shade.fillRect(0,0,pigment.width,pigment.height);
    shade.setTransform(ctx.getTransform());drawSmoothLight(shade,region,paint!.color,template,media);
    ctx.save();ctx.clip(field,'evenodd');ctx.resetTransform();ctx.drawImage(canvasImage(pigment),0,0);ctx.restore();
  }
  pigment.width=pigment.height=1;
}

/** One alpha application: colored fields cannot widen, tint or darken the ink edge. */
export function drawSurfaceInk(ctx:CanvasRenderingContext2D,ink:Path2D,parts:SurfaceInkPart[],template:Template,media:MediumImages|undefined,createCanvas:CanvasFactory):void{
  const layer=createCanvas(ctx.canvas.width,ctx.canvas.height),field=context2D(layer);
  field.fillStyle='#000';field.fillRect(0,0,layer.width,layer.height);field.setTransform(ctx.getTransform());
  const smooth=parts.filter(p=>p.paint?.paintType==='smooth').sort((a,b)=>pigmentLuminance(b.paint!.color)-pigmentLuminance(a.paint!.color));
  if(template.paintingProfile?.smoothArtwork?.surfaceLight)drawSurfacePaint(field,smooth,template,media,createCanvas);
  else for(const {region,field:area,paint}of smooth){
    field.save();field.clip(area,'evenodd');field.fillStyle=paint!.color;
    field.fillRect(0,0,template.width,template.height);
    drawSmoothLight(field,region,paint!.color,template,media);field.restore();
  }
  // An unpainted or dry-medium neighbor keeps its original clean lineart.
  // The final alpha mask, rather than the overlapping fields, defines coverage.
  field.fillStyle=field.strokeStyle='#000';field.lineWidth=12;field.lineJoin=field.lineCap='round';
  for(const p of parts)if(p.paint?.paintType!=='smooth'){
    field.fill(p.field,'evenodd');
    // The old outline remains beside untouched paper. Restricting this to the
    // original ink bitmap below prevents an extra or enlarged drawn border.
    if(template.paintingProfile?.smoothArtwork?.surfaceLight){field.fill(p.path,p.region.fillRule??'nonzero');field.stroke(p.path);}
  }
  // A separately rasterized mask also avoids backend-dependent path clipping
  // when a large compound contour crosses a tile's negative translation.
  const mask=createCanvas(layer.width,layer.height),m=context2D(mask);m.setTransform(field.getTransform());m.fillStyle='#000';m.fill(ink);
  field.resetTransform();field.globalCompositeOperation='destination-in';field.drawImage(canvasImage(mask),0,0);
  ctx.save();ctx.resetTransform();ctx.drawImage(canvasImage(layer),0,0);ctx.restore();layer.width=layer.height=mask.width=mask.height=1;
}

export const pigmentLuminance=(hex:string)=>{const n=parseInt(hex.slice(1),16);return .2126*(n>>>16)+.7152*((n>>>8)&255)+.0722*(n&255);};
const pigmentInk=(color:string,material:Region['material'])=>{
  const n=parseInt(color.slice(1),16),factor=material==='hair'?.36:material==='skin'?.57:material==='fabric'?.46:.48;
  return `rgb(${[n>>>16,(n>>>8)&255,n&255].map(c=>Math.round(9+c*factor)).join(',')})`;
};

/** Tint only existing opaque ink. A paint can never add a line or cross its mask. */
export function drawPigmentInk(ctx:CanvasRenderingContext2D,ink:Path2D,parts:{region:Region;path:Path2D;paint:RegionPaint}[]):void{
  if(!parts.length)return;
  ctx.save();ctx.clip(ink);ctx.lineWidth=30;ctx.lineJoin='round';ctx.lineCap='round';
  // At a shared edge the darker neighbor supplies the edge color, independent
  // of which part was painted last. Erasure recomputes this from saved paints.
  for(const {region,path,paint}of [...parts].sort((a,b)=>pigmentLuminance(b.paint.color)-pigmentLuminance(a.paint.color))){
    ctx.strokeStyle=pigmentInk(paint.color,region.material);
    ctx.fillStyle=pigmentInk(paint.color,['skin','fur'].includes(region.material)?'hair':region.material);
    ctx.fill(path,region.fillRule??'nonzero');ctx.stroke(path);
  }
  ctx.restore();
}
