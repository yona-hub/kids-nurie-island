import type {EyeFinish,SmoothEyeFinish} from '../../shared-types/src/index';
import type {AuthoredEyePaths} from './authored-eye';

const tone=(hex:string,factor:number,white=0,alpha=1)=>{
  const n=parseInt(hex.slice(1),16),channels=[n>>>16,(n>>>8)&255,n&255].map(c=>Math.round(Math.min(255,c*factor)*(1-white)+255*white));
  return `rgba(${channels.join(',')},${alpha})`;
};
const skinContactTone=(hex:string,alpha:number)=>{
  const n=parseInt(hex.slice(1),16),rgb=[n>>>16,(n>>>8)&255,n&255],high=Math.max(1,...rgb);
  // Skin's translucent crease has richer local colour than a neutral black
  // drop shadow. Increase its own chroma, including arbitrary blue/pink skin.
  return `rgba(${rgb.map(c=>Math.round(c*.55*(c/high)**2.2)).join(',')},${alpha})`;
};
const ellipse=(ctx:CanvasRenderingContext2D,g:{cx:number;cy:number;width:number;height:number;rotation:number},inset=1)=>{
  ctx.beginPath();ctx.ellipse(g.cx,g.cy,g.width*inset/2,g.height*inset/2,g.rotation,0,Math.PI*2);
};
/** A feathered contact on the native curve, without the hard source stroke
 * that Canvas shadow also paints beneath its blur. */
function softContact(ctx:CanvasRenderingContext2D,path:Path2D,sigma:number,peak:number,color:(alpha:number)=>string){
  let previous=0;
  for(let i=24;i>=1;i--){const radius=sigma*3*i/24,alpha=peak*Math.exp(-radius*radius/(2*sigma*sigma));ctx.lineWidth=radius*2;ctx.strokeStyle=color((alpha-previous)/(1-previous));ctx.stroke(path);previous=alpha;}
}

/** A painted face keeps a small, friendly unpainted eye. The finished globe
 * must not leave a white band outside the independent early lineart. */
export function drawUnpaintedSurfaceEye(ctx:CanvasRenderingContext2D,eye:EyeFinish,paths:AuthoredEyePaths,blankInk?:Path2D):void{
  ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineJoin=ctx.lineCap='round';
  if(blankInk&&paths.blankSilhouette?.length){
    // Fill each original closed contour, including its pupil hole, before
    // restoring the original ink. Never use the larger finished opening.
    for(const contour of paths.blankSilhouette)ctx.fill(contour);
    ctx.fillStyle='#000';ctx.fill(blankInk,'evenodd');
  }else{
    const a=eye.artwork!,iris=a.iris;ellipse(ctx,iris);ctx.fill();ctx.lineWidth=Math.max(1.6,iris.width*.025);ctx.stroke();
    const reflection=paths.reflections[0];if(reflection){ctx.fillStyle='#fff';ctx.fill(reflection);ctx.lineWidth=Math.max(1.5,iris.width*.022);ctx.stroke(reflection);}
  }
  ctx.restore();
}

/** Native viewport vectors: the outer iris is never a textured raster mask. */
export function drawMasterEye(ctx:CanvasRenderingContext2D,eye:EyeFinish,paths:AuthoredEyePaths,color?:string,blankInk?:Path2D,polished=false,orbitalClip?:Path2D,finish?:SmoothEyeFinish,upperShade?:Path2D,skinColor?:string):void{
  const a=eye.artwork!,iris=polished&&finish?finish.iris:a.iris,pupil=polished&&finish?finish.pupil:a.pupil;
  if(!color&&blankInk){
    ctx.save();ctx.fillStyle='#fff';ctx.fill(paths.opening);ctx.fillStyle='#000';ctx.fill(blankInk,'evenodd');ctx.restore();return;
  }
  if(color&&polished&&orbitalClip&&a.kind!=='human'){
    const g=eye.geometry!,robot=a.kind==='robot';ctx.save();ctx.clip(orbitalClip);ctx.translate(g.cx,g.cy);ctx.rotate(g.rotation);ctx.scale(g.width*.72,g.height*.72);
    const halo=ctx.createRadialGradient(0,0,.45,0,0,1);halo.addColorStop(0,robot?tone(color,1,.15,.18):'rgba(0,0,0,.12)');halo.addColorStop(.78,robot?tone(color,1,.2,.08):'rgba(0,0,0,.055)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  if(color&&polished&&orbitalClip&&a.kind==='human'){
    // The soft outer contact belongs to the upper lid, not to a complete
    // drop-shadowed oval around the white globe.
    const g=eye.geometry!;
    ctx.save();ctx.clip(orbitalClip);ctx.lineCap='round';ctx.lineJoin='round';
    softContact(ctx,paths.upper,g.width*.060,skinColor?.38:.12,alpha=>skinContactTone(skinColor??'#C88F72',alpha));ctx.restore();
  }
  ctx.save();ctx.clip(paths.opening);ctx.fillStyle='#fff';ctx.fill(paths.opening);
  if(color&&polished&&a.kind==='human'){
    const g=eye.geometry!,white=ctx.createRadialGradient(g.cx-g.width*.18,g.cy-g.height*.16,g.width*.10,g.cx,g.cy,g.width*.65);
    white.addColorStop(0,'rgba(0,0,0,0)');white.addColorStop(.56,'rgba(0,0,0,0)');white.addColorStop(.86,'rgba(32,25,20,.08)');white.addColorStop(1,'rgba(32,25,20,.26)');ctx.fillStyle=white;ctx.fill(paths.opening);
    // Warm light from the lid reaches the white globe. Draw it before the
    // iris, so no skin pigment is mixed into the freely chosen iris colour.
    ctx.save();ctx.translate(0,g.height*.025);ctx.lineCap='round';ctx.lineJoin='round';
    softContact(ctx,paths.upper,g.width*.045,.80,alpha=>skinContactTone(skinColor??'#C88F72',alpha));ctx.restore();
  }
  if(color&&polished&&a.kind!=='human'){const g=eye.geometry!,shadow=ctx.createLinearGradient(g.cx,g.cy-g.height/2,g.cx,g.cy);shadow.addColorStop(0,'rgba(0,0,0,.16)');shadow.addColorStop(.55,'rgba(0,0,0,.035)');shadow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=shadow;ctx.fill(paths.opening);}
  if(color){
    if(polished&&a.kind==='human'){
      ctx.save();ctx.translate(iris.cx,iris.cy);ctx.rotate(iris.rotation);ctx.scale(iris.width/2,iris.height/2);
      const glow=ctx.createRadialGradient(-.20,.30,.06,0,0,1);
      for(const [stop,factor,white]of [[0,1.65,.13],[.35,1.22,.03],[.70,.70,0],[.90,.34,0],[1,.16,0]])glow.addColorStop(stop,tone(color,factor,white));
      ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();ctx.restore();
    }else{
      const glow=ctx.createLinearGradient(iris.cx,iris.cy-iris.height/2,iris.cx,iris.cy+iris.height/2);
      for(const [stop,factor,white]of polished?[[0,.18,0],[.28,.40,0],[.61,.95,0],[.84,1.65,.08],[1,.90,0]]:[[0,.23,0],[.28,.56,0],[.61,1,0],[.84,1,.20],[1,.72,0]])glow.addColorStop(stop,tone(color,factor,white));
      ellipse(ctx,iris);ctx.fillStyle=glow;ctx.fill();
    }
    // Fibres live safely inside the smooth rim. At small sizes their number
    // and contrast drop, rather than aliasing into a dotted outer boundary.
    const transform=ctx.getTransform(),pixels=iris.width*Math.hypot(transform.a,transform.b);
    if(pixels>=20){
      ctx.save();ellipse(ctx,iris,.91);ctx.clip();ctx.translate(iris.cx,iris.cy);ctx.rotate(iris.rotation);ctx.scale(iris.width/2,iris.height/2);
      const count=Math.min(144,Math.floor(pixels*1.6)),alpha=polished&&a.kind==='human'?(pixels<40?.07:.15):(pixels<40?.10:.19);
      for(let i=0;i<count;i++){
        const angle=i/count*Math.PI*2,start=.47+Math.sin(i*2.31)*.045,end=.88+Math.sin(i*4.17)*.025;
        ctx.beginPath();ctx.moveTo(Math.cos(angle)*start,Math.sin(angle)*start);ctx.quadraticCurveTo(Math.cos(angle+.018)*(start+end)/2,Math.sin(angle+.018)*(start+end)/2,Math.cos(angle)*end,Math.sin(angle)*end);
        ctx.lineWidth=.006;ctx.strokeStyle=i%3?tone(color,.35,0,alpha):tone(color,1,.30,alpha);ctx.stroke();
      }
      ctx.restore();
    }
    if(polished){
      ctx.save();ellipse(ctx,iris,.97);ctx.clip();
      const bounce=ctx.createRadialGradient(iris.cx-iris.width*.15,iris.cy+iris.height*.28,0,iris.cx-iris.width*.15,iris.cy+iris.height*.28,iris.width*.45);
      bounce.addColorStop(0,'rgba(255,255,255,.22)');bounce.addColorStop(.55,'rgba(255,255,255,.065)');bounce.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=bounce;ctx.fillRect(iris.cx-iris.width,iris.cy-iris.height,iris.width*2,iris.height*2);ctx.restore();
      ctx.save();ellipse(ctx,iris);ctx.clip();ctx.translate(iris.cx,iris.cy);ctx.rotate(iris.rotation);ctx.scale(iris.width/2,iris.height/2);
      const rim=ctx.createRadialGradient(0,0,.85,0,0,1);rim.addColorStop(0,tone(color,.17,0,0));rim.addColorStop(.75,tone(color,.17,0,a.kind==='human'?.06:.15));rim.addColorStop(1,tone(color,.17,0,a.kind==='human'?.24:.55));ctx.fillStyle=rim;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    ctx.save();ctx.translate(pupil.cx,pupil.cy);ctx.rotate(pupil.rotation);ctx.scale(1,pupil.height/pupil.width);
    const dark=ctx.createRadialGradient(0,0,0,0,0,pupil.width*.56);
    dark.addColorStop(0,tone(color,.022));dark.addColorStop(.80,tone(color,.035));dark.addColorStop(.94,tone(color,.06,0,.98));dark.addColorStop(1,tone(color,.10,0,0));
    ctx.fillStyle=dark;ctx.fillRect(-pupil.width,-pupil.width,pupil.width*2,pupil.width*2);ctx.restore();
    if(polished&&a.kind==='human'){
      // The lid casts onto the globe along its actual curve, not as a
      // horizontal gray band. Keep the shadow inside the existing opening.
      const g=eye.geometry!;
      ctx.save();ellipse(ctx,iris);ctx.clip();ctx.translate(0,g.height*.025);ctx.lineCap='round';ctx.lineJoin='round';
      softContact(ctx,paths.upper,g.width*.045,.80,alpha=>`rgba(0,0,0,${alpha})`);ctx.restore();
      ctx.save();ellipse(ctx,iris);ctx.clip();const shine=ctx.createRadialGradient(iris.cx-iris.width*.22,iris.cy+iris.height*.28,0,iris.cx-iris.width*.22,iris.cy+iris.height*.28,iris.width*.15);
      shine.addColorStop(0,'rgba(255,255,255,.22)');shine.addColorStop(.45,'rgba(255,255,255,.065)');shine.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=shine;ctx.fillRect(iris.cx-iris.width,iris.cy-iris.height,iris.width*2,iris.height*2);ctx.restore();
      const reflected=finish?.reflectionCenters[0];if(reflected){ctx.save();ellipse(ctx,iris);ctx.clip();const glass=ctx.createRadialGradient(reflected.x,reflected.y,0,reflected.x,reflected.y,iris.width*.40);glass.addColorStop(0,'rgba(255,255,255,.075)');glass.addColorStop(.45,'rgba(255,255,255,.035)');glass.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glass;ctx.fillRect(iris.cx-iris.width,iris.cy-iris.height,iris.width*2,iris.height*2);ctx.restore();}
    }
    for(const [i,path]of paths.reflections.entries()){ctx.save();const center=polished?finish?.reflectionCenters[i]:undefined;ctx.fillStyle='#fff';ctx.globalAlpha=a.reflections[i].opacity;
      if(center&&i===0&&a.kind==='human'){const radius=iris.width*.105;ctx.beginPath();ctx.ellipse(center.x,center.y,radius*.92,radius*1.10,iris.rotation,0,Math.PI*2);ctx.fill();}
      else if(center&&a.kind==='human'){ctx.beginPath();ctx.ellipse(center.x,center.y,iris.width*.023,iris.height*.018,iris.rotation,0,Math.PI*2);ctx.fill();}
      else{if(center){const scale=i===0?finish!.reflectionScale:1.6;ctx.translate(center.x,center.y);ctx.scale(scale,scale);ctx.translate(-center.x,-center.y);}ctx.fill(path);}ctx.restore();}ctx.globalAlpha=1;
  }else{
    const guide=a.blankGuide!;
    ctx.beginPath();ctx.arc(guide.cx,guide.cy,guide.radius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=guide.strokeWidth;ctx.stroke();
  }
  ctx.restore();
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color?(polished?tone(color,.10):'#211c1d'):'#000';ctx.lineWidth=a.upperWidth*(polished?.45:1);if(polished&&upperShade&&color){const g=eye.geometry!,shade=ctx.createLinearGradient(g.cx,g.cy-g.height*.6,g.cx,g.cy+g.height*.4);shade.addColorStop(0,'rgba(51,30,25,.96)');shade.addColorStop(.55,'rgba(51,30,25,.88)');shade.addColorStop(1,'rgba(51,30,25,.25)');ctx.fillStyle=shade;ctx.fill(upperShade);}else if(!polished||a.kind==='human')ctx.stroke(paths.upper);
  ctx.strokeStyle=color?'rgba(33,28,29,.45)':'#000';ctx.lineWidth=a.lowerWidth;if(!polished)ctx.stroke(paths.lower);
  ctx.strokeStyle=color?'#211c1d':'#000';ctx.lineWidth=a.lashWidth*(polished?.8:1);if(!polished||eye.owner!=='princess')for(const lash of paths.lashes)ctx.stroke(lash);
  ctx.restore();
}
