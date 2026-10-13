import type { EyeFinish, Region, RegionPaint, Template } from '../../shared-types/src/index';
import {fixedSeed,seededRandom} from './texture';
export interface MediumImages { paper: CanvasImageSource; wax: CanvasImageSource; pencil: CanvasImageSource; iris?: CanvasImageSource }

function dark(color: string, factor: number): string {
  const n = parseInt(color.slice(1), 16);
  return `rgb(${[n >>> 16, (n >>> 8) & 255, n & 255].map(v => Math.round(v * factor)).join(',')})`;
}

function eyeColor(color: string, target: number[], amount: number): string {
  const value = parseInt(color.slice(1), 16);
  return `rgb(${[value >>> 16, (value >>> 8) & 255, value & 255].map((channel, index) => Math.round(channel * (1 - amount) + target[index] * amount)).join(',')})`;
}

function luminousIris(color:string):string {
  const v=parseInt(color.slice(1),16),r=v>>>16,g=(v>>>8)&255,b=v&255;
  return r>g*1.2&&g>b*1.25?eyeColor(color,[255,195,72],.70):eyeColor(color,[255,255,255],.32);
}

/** The same geometry is used for the blank guides and the finished eye. */
export function eyeFinishPoint(region: Region, eye: EyeFinish | undefined, nx: number, ny: number): {x:number;y:number} {
  const g=eye?.geometry??{cx:region.bounds.x+region.bounds.width/2,cy:region.bounds.y+region.bounds.height/2,width:region.bounds.width,height:region.bounds.height,rotation:0};
  const x=(nx-.5)*g.width,y=(ny-.5)*g.height,c=Math.cos(g.rotation),s=Math.sin(g.rotation);
  return {x:g.cx+x*c-y*s,y:g.cy+x*s+y*c};
}

export function eyeReflectionPosition(eye: EyeFinish | undefined): {x:number;y:number} {
  const angle=-.85-(eye?.geometry?.rotation??0);
  return {x:.36+.17*Math.cos(angle),y:.465+.13*Math.sin(angle)};
}

/** Rounded, tapered eyelid and lashes. Original ink remains for blank lineart. */
export function drawStorybookEyeContour(ctx:CanvasRenderingContext2D,region:Region,path:Path2D,eye:EyeFinish):void {
  const g=eye.geometry;if(!g)return;
  const {cx,cy,width:w,height:h,rotation}=g;
  ctx.save();
  const edge=ctx.createLinearGradient(cx,cy-h/2,cx,cy+h/2);
  edge.addColorStop(0,'#352019');edge.addColorStop(.4,'rgba(73,40,29,.85)');edge.addColorStop(.72,'rgba(147,98,68,.40)');edge.addColorStop(1,'rgba(177,132,92,.25)');
  ctx.strokeStyle=edge;ctx.lineWidth=Math.max(2.5,w*.037);ctx.lineJoin='round';ctx.stroke(path);
  ctx.translate(cx,cy);ctx.rotate(rotation);
  ctx.strokeStyle='#3c231b';ctx.lineCap='round';ctx.lineWidth=Math.max(4,w*.09);
  ctx.beginPath();ctx.ellipse(0,0,w*.505,h*.50,0,Math.PI+.04,Math.PI*1.86);ctx.stroke();
  const side=eye.lashSide==='left'?-1:1;
  for(let i=0;i<3;i++){
    const angle=-.47-i*.23,x=side*Math.cos(angle)*w*.505,y=Math.sin(angle)*h*.5;
    ctx.lineWidth=Math.max(1.4,w*(.031-i*.005));ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+side*w*.06,y-h*.006,x+side*w*(.10-i*.012),y-h*.045,x+side*w*(.10-i*.012),y-h*(.10-i*.012));ctx.stroke();
  }
  ctx.restore();
}

export function drawStorybookEye(ctx: CanvasRenderingContext2D, region: Region, path: Path2D, color?: string, media?: MediumImages, eye?: EyeFinish): void {
  const g=eye?.geometry??{cx:region.bounds.x+region.bounds.width/2,cy:region.bounds.y+region.bounds.height/2,width:region.bounds.width,height:region.bounds.height,rotation:0};
  const {width:w,height:h}=g,x=g.cx-w/2,y=g.cy-h/2,light=eyeReflectionPosition(eye);
  const ellipse=(cx:number,cy:number,rx:number,ry:number)=>{ctx.beginPath();ctx.ellipse(x+w*cx,y+h*cy,w*rx,h*ry,0,0,Math.PI*2);};
  ctx.save();ctx.clip(path);
  ctx.translate(g.cx,g.cy);ctx.rotate(g.rotation);ctx.translate(-g.cx,-g.cy);
  if(color){
    // A visible white crescent, tinted pupil, iris fibers and soft lid shadow
    // reproduce the home princess's eye structure within the adopted opening.
    const sclera=ctx.createLinearGradient(x,y,x+w,y+h);sclera.addColorStop(0,'#cbbdc2');sclera.addColorStop(.4,'#fff9ed');sclera.addColorStop(.85,'#fffcf5');sclera.addColorStop(1,eyeColor(color,[255,249,238],.95));ctx.fillStyle=sclera;ctx.fillRect(x,y,w,h);
    ctx.save();ellipse(.36,.49,.46,.395);ctx.clip();
    const surround=ctx.createLinearGradient(x,y,x+w*.15,y+h);
    surround.addColorStop(0,eyeColor(color,[13,9,15],.78));
    surround.addColorStop(.38,eyeColor(color,[22,12,16],.26));surround.addColorStop(.64,color);
    surround.addColorStop(.78,luminousIris(color));surround.addColorStop(1,eyeColor(color,[65,34,24],.25));
    ctx.fillStyle=surround;ctx.fillRect(x,y,w,h);
    if(media?.iris){ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.55;ctx.drawImage(media.iris,x-w*.10,y+h*.095,w*.92,h*.79);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    ctx.save();ctx.translate(x+w*.36,y+h*.465);ctx.scale(w*.205,h*.18);
    const pupil=ctx.createRadialGradient(0,0,0,0,0,1);
    pupil.addColorStop(0,eyeColor(color,[4,3,8],.98));pupil.addColorStop(.74,eyeColor(color,[6,4,9],.95));pupil.addColorStop(1,'rgba(8,5,10,0)');
    ctx.fillStyle=pupil;ctx.fillRect(-1,-1,2,2);ctx.restore();ctx.restore();
    // Soft upper-lid occlusion follows the eye opening, over the iris and white.
    const lid=ctx.createLinearGradient(x,y,x,y+h*.52);lid.addColorStop(0,'rgba(27,13,20,.48)');lid.addColorStop(.7,'rgba(27,13,20,.10)');lid.addColorStop(1,'rgba(27,13,20,0)');ctx.fillStyle=lid;ctx.fillRect(x,y,w,h*.52);
  }else{
    ctx.strokeStyle='#000000';ctx.lineWidth=Math.max(2.5,w*.028);
    ellipse(.36,.465,.205,.18);ctx.stroke();
  }
  ctx.fillStyle='#FFFFFF';
  if(color){const glow=ctx.createRadialGradient(x+w*light.x,y+h*light.y,0,x+w*light.x,y+h*light.y,w*.10);glow.addColorStop(0,'rgba(255,255,255,.25)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(x+w*(light.x-.12),y+h*(light.y-.12),w*.24,h*.24);ctx.fillStyle='#fffefb';}
  const lx=x+w*light.x,ly=y+h*light.y;
  ctx.beginPath();ctx.moveTo(lx-w*.052,ly-h*.024);ctx.bezierCurveTo(lx-w*.047,ly-h*.053,lx+w*.034,ly-h*.049,lx+w*.054,ly-h*.013);ctx.bezierCurveTo(lx+w*.065,ly+h*.016,lx+w*.030,ly+h*.045,lx-w*.014,ly+h*.039);ctx.bezierCurveTo(lx-w*.052,ly+h*.034,lx-w*.063,ly,lx-w*.052,ly-h*.024);ctx.closePath();ctx.fill();if(!color)ctx.stroke();
  if(color)ctx.globalAlpha=.72;
  ellipse(light.x+.085,light.y+.055,.015,.014);ctx.fill();if(!color)ctx.stroke();
  ctx.restore();
}

export function drawStorybookFinish(ctx: CanvasRenderingContext2D, region: Region, path: Path2D, paint: RegionPaint, template: Template, media?: MediumImages): void {
  const eye = template.paintingProfile?.eyes.find(x => x.regionId === region.id);
  const group = template.paintingProfile?.groups.find(x => x.regionIds.includes(region.id));
  const b = group?.bounds ?? region.bounds;
  ctx.save();ctx.clip(path);ctx.fillStyle = paint.color;ctx.fillRect(region.bounds.x - 2, region.bounds.y - 2, region.bounds.width + 4, region.bounds.height + 4);
  if (eye) {
    drawStorybookEye(ctx,region,path,paint.color,media,eye);
    ctx.restore();return;
  }
  if (paint.paintType !== 'smooth' && media) {
    // Pigment pressure is visible beneath the generated wax-and-paper mask.
    if (paint.paintType === 'crayon') {
      const random=seededRandom(fixedSeed(`${template.id}:${group?.id ?? region.id}:wax-pressure`));
      ctx.save();ctx.translate(b.x+b.width/2,b.y+b.height/2);ctx.rotate((group?.direction ?? region.direction)*Math.PI/180);
      const extent=Math.hypot(b.width,b.height);ctx.lineCap='round';ctx.strokeStyle=dark(paint.color,.76);ctx.globalAlpha=.075;
      for(let i=0;i<34;i++){const x=(random()-.5)*extent,y=(random()-.5)*extent,length=extent*(.08+random()*.16);ctx.lineWidth=10+random()*25;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+length*.25,y-3,x+length*.7,y+4,x+length,y+1);ctx.stroke();}
      ctx.restore();
    }else{
      // Overlapping translucent pressure passes follow the authored direction.
      // These are colored strokes under the actual paper-tooth scan.
      const random=seededRandom(fixedSeed(`${template.id}:${group?.id??region.id}:pencil-pressure`));
      ctx.save();ctx.translate(b.x+b.width/2,b.y+b.height/2);ctx.rotate((group?.direction??region.direction)*Math.PI/180);
      const extent=Math.hypot(b.width,b.height);ctx.lineCap='round';
      for(let i=0;i<90;i++){const x=(random()-.5)*extent,y=(random()-.5)*extent,length=25+random()*85;ctx.strokeStyle=dark(paint.color,.64+random()*.20);ctx.globalAlpha=.07+random()*.11;ctx.lineWidth=1.3+random()*2.8;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+length*.25,y-2,x+length*.70,y+3,x+length,y+1);ctx.stroke();}
      ctx.restore();
    }
    const image = paint.paintType === 'crayon' ? media.wax : media.pencil;
    const pattern = ctx.createPattern(image, 'repeat');
    if (pattern) {
      const scale = paint.paintType === 'crayon' ? 2.1 : 1.9;
      const angle=((group?.direction ?? region.direction)-35)*Math.PI/180;
      pattern.setTransform({a:scale*Math.cos(angle),b:scale*Math.sin(angle),c:-scale*Math.sin(angle),d:scale*Math.cos(angle),e:0,f:0});
      ctx.globalAlpha=1;
      ctx.fillStyle = pattern;ctx.fillRect(region.bounds.x - 2, region.bounds.y - 2, region.bounds.width + 4, region.bounds.height + 4);
      ctx.globalAlpha=1;
    }
    const paper = ctx.createPattern(media.paper, 'repeat');
    if (paper) {paper.setTransform({a:1.5,b:0,c:0,d:1.5,e:0,f:0});ctx.fillStyle = paper;ctx.fillRect(region.bounds.x - 2, region.bounds.y - 2, region.bounds.width + 4, region.bounds.height + 4);}
  }
  const level = paint.paintType === 'smooth' ? 1 : .65;
  const shade = ctx.createLinearGradient(b.x, b.y, b.x + b.width * .7, b.y + b.height);
  shade.addColorStop(0, 'rgba(26,22,42,0)');shade.addColorStop(.52, 'rgba(26,22,42,0)');shade.addColorStop(1, `rgba(26,22,42,${level * (region.material === 'skin' ? .10 : .17)})`);
  ctx.fillStyle = shade;ctx.fillRect(b.x,b.y,b.width,b.height);
  if (group?.shading) for(const curve of group.shading.curves) {
    for(const feather of [1,.65,.3]){
      ctx.strokeStyle=group.shading.kind==='hair'?`rgba(255,239,202,${.055*level})`:`rgba(40,22,59,${.027*level})`;
      ctx.lineWidth=b.width*(group.shading.kind==='hair'?.035:.055)*feather;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x+curve[0]*b.width,b.y+curve[1]*b.height);ctx.bezierCurveTo(b.x+curve[2]*b.width,b.y+curve[3]*b.height,b.x+curve[4]*b.width,b.y+curve[5]*b.height,b.x+curve[6]*b.width,b.y+curve[7]*b.height);ctx.stroke();
    }
  }
  if (region.material === 'hair') {
    // Continuous flow across the whole hair group; no separate bounding-box bands.
    const shine = ctx.createRadialGradient(b.x+b.width*.40,b.y+b.height*.28,0,b.x+b.width*.40,b.y+b.height*.28,b.width*.67);
    shine.addColorStop(0,`rgba(255,238,188,${.22*level})`);shine.addColorStop(.47,`rgba(255,238,188,${.08*level})`);shine.addColorStop(1,'rgba(255,238,188,0)');
    ctx.fillStyle=shine;ctx.fillRect(b.x,b.y,b.width,b.height);
    ctx.strokeStyle=`rgba(73,35,22,${.035*level})`;ctx.lineWidth=2.2;
    for(let i=0;i<12;i++){const x=b.x+b.width*(i+.5)/12;ctx.beginPath();ctx.moveTo(x,b.y);ctx.bezierCurveTo(x-b.width*.06,b.y+b.height*.3,x+b.width*.09,b.y+b.height*.62,x-b.width*.04,b.y+b.height);ctx.stroke();}
  } else if (region.material === 'fabric') {
    const folds=ctx.createLinearGradient(b.x,b.y,b.x+b.width,b.y+b.height*.08);
    folds.addColorStop(0,'rgba(48,22,66,.055)');folds.addColorStop(.20,'rgba(255,255,255,.025)');folds.addColorStop(.56,'rgba(48,22,66,.07)');folds.addColorStop(.82,'rgba(255,255,255,.03)');folds.addColorStop(1,'rgba(48,22,66,.045)');
    ctx.globalAlpha=level;ctx.fillStyle=folds;ctx.fillRect(b.x,b.y,b.width,b.height);
  } else if (['metal','glass','plastic'].includes(region.material)) {
    const sheen=ctx.createLinearGradient(b.x,b.y,b.x+b.width,b.y+b.height*.2);
    sheen.addColorStop(0,'rgba(255,255,255,0)');sheen.addColorStop(.25,`rgba(255,255,255,${.17*level})`);sheen.addColorStop(.44,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sheen;ctx.fillRect(b.x,b.y,b.width,b.height);
  }
  ctx.restore();
}
