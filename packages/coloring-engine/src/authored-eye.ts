import type { EyeFinish } from '../../shared-types/src/index';
import type { MediumImages } from './storybook-texture';

export interface AuthoredEyePaths { opening:Path2D; upper:Path2D; lower:Path2D; lashes:Path2D[]; reflections:Path2D[]; blankSilhouette?:Path2D[] }
export function makeEyePaths(eye:EyeFinish,create:(p:string)=>Path2D):AuthoredEyePaths {
  const a=eye.artwork;if(!a)throw new Error('目の制作データがありません。');
  return {opening:create(a.opening),upper:create(a.upperLid),lower:create(a.lowerLid),lashes:a.lashes.map(create),reflections:a.reflections.map(r=>create(r.path)),blankSilhouette:a.blankInkPath?.match(/M[^M]*/gi)?.map(create)};
}
function hueValue(color:string,factor:number,white=0,alpha=1):string {
  const n=parseInt(color.slice(1),16),c=[n>>>16,(n>>>8)&255,n&255];
  const channels=c.map(v=>Math.round(v*factor*(1-white)+255*white)).join(',');
  return alpha===1?`rgb(${channels})`:`rgba(${channels},${alpha})`;
}
function irisFibres(ctx:CanvasRenderingContext2D,eye:EyeFinish,color:string){
  const iris=eye.artwork!.iris;let seed=[...`${eye.owner}/${eye.regionId}`].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.save();ctx.translate(iris.cx,iris.cy);ctx.rotate(iris.rotation);ctx.scale(iris.width/2,iris.height/2);
  for(let i=0;i<240;i++){
    const angle=(i+random()*.8)*Math.PI*2/240,start=.40+random()*.21,end=.78+random()*.22,bend=(random()-.5)*.04;
    const point=(r:number,a:number)=>[Math.cos(a)*r,Math.sin(a)*r] as const;
    const p0=point(start,angle),p1=point(start+(end-start)*.4,angle+bend),p2=point(end,angle+bend*.6);
    ctx.beginPath();ctx.moveTo(...p0);ctx.quadraticCurveTo(...p1,...p2);
    ctx.lineWidth=.0035+random()*.0045;ctx.strokeStyle=i%3?hueValue(color,.37+random()*.34,0,.18+random()*.23):hueValue(color,1,.18+random()*.22,.22);
    ctx.stroke();
  }
  ctx.restore();
}
/** A single authored opening/lid is shared by the blank and finished eye. */
export function drawAuthoredEye(ctx:CanvasRenderingContext2D,eye:EyeFinish,paths:AuthoredEyePaths,color?:string,media?:MediumImages):void {
  const a=eye.artwork!,g=eye.geometry!,iris=a.iris,pupil=a.pupil;
  ctx.save();ctx.clip(paths.opening);ctx.fillStyle='#FFFFFF';ctx.fill(paths.opening);
  const ellipse=(v:typeof iris)=>{ctx.beginPath();ctx.ellipse(v.cx,v.cy,v.width/2,v.height/2,v.rotation,0,Math.PI*2);};
  if(color){
    ctx.save();ellipse(iris);ctx.clip();
    const glow=ctx.createLinearGradient(iris.cx,iris.cy-iris.height*.5,iris.cx,iris.cy+iris.height*.5);
    glow.addColorStop(0,hueValue(color,.35));glow.addColorStop(.30,hueValue(color,.67));glow.addColorStop(.61,hueValue(color,1));glow.addColorStop(.84,hueValue(color,1,.22));glow.addColorStop(1,hueValue(color,.82));
    ctx.fillStyle=glow;ctx.fillRect(iris.cx-iris.width,iris.cy-iris.height,iris.width*2,iris.height*2);
    if(media?.iris){ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.38;ctx.drawImage(media.iris,iris.cx-iris.width/2,iris.cy-iris.height/2,iris.width,iris.height);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    irisFibres(ctx,eye,color);
    const upper=ctx.createLinearGradient(iris.cx,iris.cy-iris.height*.5,iris.cx,iris.cy+iris.height*.38);
    upper.addColorStop(0,'rgba(0,0,0,.58)');upper.addColorStop(.42,'rgba(0,0,0,.12)');upper.addColorStop(.76,'rgba(0,0,0,0)');upper.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=upper;ctx.fillRect(iris.cx-iris.width,iris.cy-iris.height,iris.width*2,iris.height*2);
    // The pupil is round and almost black in the chosen hue. A feathered edge
    // avoids a cutout appearance while preserving a clear, dark pupil.
    ctx.save();ctx.translate(pupil.cx,pupil.cy);ctx.rotate(pupil.rotation);ctx.scale(1,pupil.height/pupil.width);
    const p=ctx.createRadialGradient(0,0,0,0,0,pupil.width*.68);
    p.addColorStop(0,hueValue(color,.025));p.addColorStop(.48,hueValue(color,.035));p.addColorStop(.66,hueValue(color,.06));p.addColorStop(.82,hueValue(color,.1,0,.88));p.addColorStop(.94,hueValue(color,.22,0,.32));p.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=p;ctx.fillRect(-pupil.width,-pupil.width,pupil.width*2,pupil.width*2);ctx.restore();ctx.restore();
  }else{
    ctx.strokeStyle='#000';ctx.lineWidth=Math.max(1.6,g.width*.025);ellipse(iris);ctx.stroke();ellipse(pupil);ctx.stroke();
  }
  for(let i=0;i<paths.reflections.length;i++){ctx.globalAlpha=color?a.reflections[i].opacity:1;ctx.fillStyle='#fff';ctx.fill(paths.reflections[i]);if(!color){ctx.strokeStyle='#000';ctx.lineWidth=Math.max(1.5,g.width*.022);ctx.stroke(paths.reflections[i]);}}
  ctx.restore();
  // Neutral, restrained lids: no warm/pink lower ring, no duplicated original
  // eye ink, and no runtime lashes added to a boy, animal or dinosaur.
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color?'#211c1d':'#000';
  ctx.lineWidth=a.upperWidth;ctx.stroke(paths.upper);
  ctx.strokeStyle=color?'rgba(33,28,29,.52)':'#000';ctx.lineWidth=a.lowerWidth;ctx.stroke(paths.lower);
  ctx.strokeStyle=color?'#211c1d':'#000';ctx.lineWidth=a.lashWidth;for(const lash of paths.lashes)ctx.stroke(lash);
  ctx.restore();
}
