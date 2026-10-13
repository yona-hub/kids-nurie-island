import type { Bounds, Point, Region, RegionPaint, RegionPaints, Template } from '../../shared-types/src/index';
import type { EngineMetrics, EngineOptions } from './engine';
import { canvasBlob, canvasImage, context2D, createBrowserCanvas, createStableSurfaceCanvas, type EngineCanvas } from './canvas';
import { SurfaceCache, type RegionSurface } from './cache';
import { intersects } from './geometry';
import { validatePaintingProfile } from './painting';
import { drawStorybookFinish, type MediumImages } from './storybook-texture';
import {drawAuthoredEye,makeEyePaths,type AuthoredEyePaths} from './authored-eye';
import {drawMasterEye,drawUnpaintedSurfaceEye} from './master-eye';
import {drawPigmentInk,drawSurfaceInk,drawSurfacePaint} from './smooth-finish';
import { drawScene, frameBehindArtwork, type SceneImage } from './storybook-scene';
import type { Viewport } from './geometry';
interface Item { region: Region; path: Path2D; coverage:Path2D; field?:Path2D; fieldPaint?:boolean; fieldBounds?:Bounds; smoothCoverage?:Path2D; smoothBounds?:Bounds }
export interface StorySceneUpdate { regions?: RegionPaints; background?: SceneImage | null; frame?: SceneImage | null }
const TILE=512, BLEED=2;

/** Viewport-sized display; world-aligned tiles never magnify a fit-sized bitmap. */
export class StorybookEngine {
  private createCanvas;private createPath;private now;private cache: SurfaceCache;
  private context;private hitCanvas;private hitContext;private template: Template | null=null;
  private items: Item[]=[];private details: {path:Path2D;fill?:string;strokeWidth:number;eyeRegionId?:string}[]=[];
  private opaque:Path2D|null=null;private eyePaths=new Map<string,AuthoredEyePaths>();private blankEyes=new Map<string,Path2D>();
  private brows:{parent:string;color:string;path:Path2D;clip?:Path2D;bounds:Bounds}[]=[];
  private faceDetails:{parent:string;color:string;kind:string;path:Path2D}[]=[];
  private mouths:{regionId:string;teeth?:Path2D;blankInk?:Path2D}[]=[];
  private repairShape:Path2D|null=null;
  private paintSurface:Path2D|null=null;
  private insets:{regionId:string;path:Path2D;light:boolean}[]=[];
  private upperShades=new Map<string,Path2D>();
  private paints: RegionPaints={};private background: SceneImage | null=null;private frame: SceneImage | null=null;
  private media?: MediumImages;private mediaRevision=0;private view: Viewport={scale:1,x:0,y:0};
  private cssWidth=800;private cssHeight=1000;private ratio=1;private alive=true;
  private counts={paints:0,textureBuilds:0,cacheHits:0,cacheMisses:0,frames:0,lastPaintMs:0,maxPaintMs:0,lastFrameMs:0,maxFrameMs:0};
  constructor(readonly canvas: EngineCanvas, private options: EngineOptions={}) {
    this.createCanvas=options.createCanvas??createBrowserCanvas;this.createPath=options.createPath??(p=>new Path2D(p));this.now=options.now??(()=>performance.now());
    this.cache=new SurfaceCache(Math.min(32*1024*1024,Math.max(0,options.maxCacheBytes??32*1024*1024)));
    this.context=context2D(canvas);this.hitCanvas=this.createCanvas(1,1);this.hitContext=context2D(this.hitCanvas);
    canvas.width=800;canvas.height=1000;
  }
  private assert(){if(!this.alive)throw new Error('ぬりえの表示は終了しています。');}
  loadTemplate(t:Template, paints:RegionPaints={}) {
    this.assert();validatePaintingProfile(t);if(!t.approved||t.width!==1600||t.height!==2000)throw new Error('このぬりえはまだ使えません。');
    const automatic=new Set(t.paintingProfile?.eyes.map(e=>e.highlightId));
    if(![3,4].includes(t.paintingProfile?.version??0))throw new Error('この作品の描画方式が正しくありません。');
    this.createCanvas=this.options.createCanvas??(t.paintingProfile?.smoothArtwork?.surfaceLight?createStableSurfaceCanvas:createBrowserCanvas);
    const surface=t.paintingProfile?.smoothArtwork?.surfaceFields;
    const items=t.regions.filter(r=>!automatic.has(r.id)).map(region=>{const p=surface?.parts.find(p=>p.regionId===region.id);return {region,path:this.createPath(region.path),coverage:this.createPath(region.coveragePath??region.path),field:p?this.createPath(p.path):undefined,fieldPaint:p?.paintedByField,fieldBounds:p?.bounds,smoothCoverage:p?.coveragePath?this.createPath(p.coveragePath):undefined,smoothBounds:p?.paintBounds};});
    const details=t.details.map(d=>({path:this.createPath(d.path),fill:d.fill,strokeWidth:d.strokeWidth??t.lineWidth,eyeRegionId:d.eyeRegionId}));
    const next=this.normalize(paints,t);this.cache.clear();this.template=t;this.items=items;this.details=details;this.paints=next;
    this.brows=surface?.brows.map(b=>({parent:b.parentRegionId,color:b.colorRegionId,path:this.createPath(b.path),clip:b.clipPath?this.createPath(b.clipPath):undefined,bounds:b.bounds}))??[];
    this.faceDetails=surface?.faces?.map(f=>({parent:f.parentRegionId,color:f.colorRegionId,kind:f.kind,path:this.createPath(f.path)}))??[];
    this.mouths=surface?.mouths?.map(m=>({regionId:m.regionId,teeth:m.teethPath?this.createPath(m.teethPath):undefined,blankInk:m.blankInkPath?this.createPath(m.blankInkPath):undefined}))??[];
    this.repairShape=surface?.repairSilhouettePath?this.createPath(surface.repairSilhouettePath):null;
    this.paintSurface=surface?.paintSurfacePath?this.createPath(surface.paintSurfacePath):null;
    this.insets=surface?.insets?.map(i=>({regionId:i.regionId,path:this.createPath(i.path),light:i.tone==='light'}))??[];
    this.upperShades=new Map(t.paintingProfile?.smoothArtwork?.eyes?.filter(e=>e.upperShadePath).map(e=>[e.regionId,this.createPath(e.upperShadePath!)])??[]);
    this.opaque=this.createPath(t.paintingProfile!.opaquePath!);this.eyePaths=new Map(t.paintingProfile!.eyes.map(e=>[e.regionId,makeEyePaths(e,this.createPath)]));
    this.blankEyes=new Map(t.paintingProfile!.eyes.filter(e=>e.artwork?.blankInkPath).map(e=>[e.regionId,this.createPath(e.artwork!.blankInkPath!)]));this.render();
  }
  private normalize(paints:RegionPaints,t=this.template):RegionPaints {
    const ids=new Set(t?.regions.map(r=>r.id));const next:RegionPaints={};
    for(const [id,p]of Object.entries(paints)){if(!ids.has(id)||!/^#[0-9a-f]{6}$/i.test(p.color)||!['smooth','crayon','pencil'].includes(p.paintType))throw new Error('塗り方のデータを読み込めませんでした。');next[id]={color:p.color.toUpperCase(),paintType:p.paintType};}return next;
  }
  setScene(u:StorySceneUpdate){this.assert();let changed=false;if(u.regions){const next=this.normalize(u.regions);changed=JSON.stringify(next)!==JSON.stringify(this.paints);this.paints=next;}if(u.background!==undefined&&u.background!==this.background){this.background=u.background;changed=true;}if(u.frame!==undefined&&u.frame!==this.frame){this.frame=u.frame;changed=true;}if(changed)this.render();}
  setMediumImages(media:MediumImages){this.assert();if(this.media?.paper===media.paper&&this.media.wax===media.wax&&this.media.pencil===media.pencil&&this.media.iris===media.iris&&this.media.form===media.form&&this.media.smooth===media.smooth&&this.media.skin===media.skin&&this.media.surface===media.surface)return;this.media=media;this.mediaRevision++;this.cache.clear();this.render();}
  setViewport(view:Viewport){this.assert();this.view={...view};this.render();}
  resize(w:number,h:number,dpr=typeof devicePixelRatio==='number'?devicePixelRatio:1){
    this.assert();if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return;
    const ratio=Math.min(3,Math.max(1,Number.isFinite(dpr)?dpr:1),Math.sqrt((this.options.maxCanvasPixels??8_000_000)/(w*h)));
    const width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio));
    this.cssWidth=w;this.cssHeight=h;this.ratio=ratio;if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}this.render();
  }
  paint(id:string,p:RegionPaint|null,_point?:Point,_reducedMotion=false){this.paintMany([id],p);}
  paintMany(ids:readonly string[],p:RegionPaint|null){
    this.assert();const start=this.now();if(ids.some(id=>!this.items.some(i=>i.region.id===id)))throw new Error('ぬる場所が見つかりませんでした。');
    const next={...this.paints};for(const id of ids){if(p)next[id]={...p};else delete next[id];}this.paints=this.normalize(next);this.render();
    this.counts.paints++;this.counts.lastPaintMs=this.now()-start;this.counts.maxPaintMs=Math.max(this.counts.maxPaintMs,this.counts.lastPaintMs);
  }
  hitTest(point:Point,assist=true):string|null {
    this.assert();if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.y<0||point.x>1600||point.y>2000)return null;
    const find=(p:Point)=>{for(let i=this.items.length-1;i>=0;i--){const item=this.items[i];if(intersects(item.region.bounds,{...p,width:0,height:0})&&this.hitContext.isPointInPath(item.path,p.x,p.y,item.region.fillRule??'nonzero'))return item.region.id;}return null;};
    const exact=find(point);if(exact||!assist)return exact;
    for(const r of [5,10,16,22])for(let i=0;i<16;i++){const hit=find({x:point.x+Math.cos(i*Math.PI/8)*r,y:point.y+Math.sin(i*Math.PI/8)*r});if(hit)return hit;}return null;
  }
  getRegionPoint(id:string):Point|null {
    const item=this.items.find(i=>i.region.id===id);if(!item)return null;const b=item.region.bounds;
    for(const n of [1,4,8,16])for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p={x:b.x+(x+.5)/n*b.width,y:b.y+(y+.5)/n*b.height};if(this.hitTest(p,false)===id)return p;}return null;
  }
  getPaints(){return Object.fromEntries(Object.entries(this.paints).map(([id,p])=>[id,{...p}]));}
  getMetrics():EngineMetrics{return {...this.counts,cacheBytes:this.cache.bytes,layerBytes:this.canvas.width*this.canvas.height*4,activeAnimations:0};}
  private drawBase(ctx:CanvasRenderingContext2D,items=this.items){
    if(this.opaque){ctx.fillStyle='#fff';ctx.fill(this.opaque);}
    if(this.smoothSurface()&&this.template?.paintingProfile?.smoothArtwork?.surfaceLight){
      drawSurfacePaint(ctx,items.filter(i=>i.field).map(i=>({region:i.region,path:i.path,field:i.field!,paint:this.paints[i.region.id]})),this.template,this.media,this.createCanvas);
      // Curved fields overlap beneath the ink. An unpainted or dry-medium
      // face keeps its white paper, including its antialiased inner edge.
      ctx.save();ctx.fillStyle=ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.lineJoin=ctx.lineCap='round';
      for(const i of items)if(i.field&&this.paints[i.region.id]?.paintType!=='smooth'){ctx.fill(i.path,i.region.fillRule??'nonzero');ctx.stroke(i.path);}ctx.restore();
    }
  }
  private smoothSurface(){return this.template?.paintingProfile?.smoothArtwork?.ink==='surface-v1'&&Object.values(this.paints).some(p=>p.paintType==='smooth');}
  /** Rasterize the retained contour at the final device transform. Clipping a
   * nearby coverage curve alone can leave a subpixel outside the ink mask. */
  private clipPaintSurface(ctx:CanvasRenderingContext2D){
    if(!this.smoothSurface())return;
    const mask=this.createCanvas(ctx.canvas.width,ctx.canvas.height),m=context2D(mask);m.setTransform(ctx.getTransform());m.fillStyle='#000';
    // Preserve the authored raster support: Boolean curve operations can move
    // a fractional outer edge. Additive coverage closes internal joins rather
    // than making overlapping antialiased masks translucent with source-over.
    if(this.paintSurface)m.globalCompositeOperation='lighter';
    if(this.opaque)m.fill(this.opaque);for(const item of this.items)m.fill(item.path,item.region.fillRule??'nonzero');for(const d of this.details)if(d.fill==='#000000')m.fill(d.path);if(this.repairShape)m.fill(this.repairShape,'evenodd');
    if(this.paintSurface){
      // Saturate the interior before the single vector outline supplies its
      // smooth edge. Zero coverage outside the original paths remains zero.
      if(this.opaque)m.fill(this.opaque);for(const item of this.items)m.fill(item.path,item.region.fillRule??'nonzero');for(const d of this.details)if(d.fill==='#000000')m.fill(d.path);if(this.repairShape)m.fill(this.repairShape,'evenodd');
      const outline=this.createCanvas(mask.width,mask.height),o=context2D(outline);o.setTransform(ctx.getTransform());o.fill(this.paintSurface,'evenodd');
      // A separate bitmap mask is consistent for complex paths in browser and
      // native backends; source-in path filling can discard a compound shape.
      m.resetTransform();m.globalCompositeOperation='destination-in';m.drawImage(canvasImage(outline),0,0);outline.width=outline.height=1;
      // Keep the retained paper silhouette opaque against background/frame
      // artwork even at numerical differences in the Boolean path's interior.
      m.setTransform(ctx.getTransform());m.globalCompositeOperation='source-over';if(this.opaque)m.fill(this.opaque);
    }
    ctx.save();ctx.resetTransform();ctx.globalCompositeOperation='destination-in';ctx.drawImage(canvasImage(mask),0,0);ctx.restore();mask.width=mask.height=1;
  }
  private drawPaint(ctx:CanvasRenderingContext2D,item:Item){const p=this.paints[item.region.id];if(p&&this.template&&!this.eyePaths.has(item.region.id)){if(p.paintType==='smooth'&&item.fieldPaint&&this.template.paintingProfile?.smoothArtwork?.surfaceLight)return;const repair=p.paintType==='smooth'&&item.smoothCoverage;drawStorybookFinish(ctx,repair?{...item.region,bounds:item.smoothBounds??item.region.bounds,coverageFillRule:'evenodd'}:item.region,repair||item.coverage,p,this.template,this.media);}}
  private drawEyes(ctx:CanvasRenderingContext2D){
    for(const eye of this.template?.paintingProfile?.eyes??[]){
      const skin=eye.parentRegionId?this.paints[eye.parentRegionId]:undefined;
      if(this.template?.paintingProfile?.smoothArtwork?.surfaceLight&&skin?.paintType==='smooth'&&!this.paints[eye.regionId]){drawUnpaintedSurfaceEye(ctx,eye,this.eyePaths.get(eye.regionId)!,this.blankEyes.get(eye.regionId));continue;}
      if(this.template?.paintingProfile?.version===4||(this.template?.paintingProfile?.smoothArtwork&&this.paints[eye.regionId]?.paintType==='smooth'))drawMasterEye(ctx,eye,this.eyePaths.get(eye.regionId)!,this.paints[eye.regionId]?.color,this.blankEyes.get(eye.regionId),this.template?.paintingProfile?.smoothArtwork?.ink==='surface-v1'&&this.paints[eye.regionId]?.paintType==='smooth',this.opaque??undefined,this.template?.paintingProfile?.smoothArtwork?.eyes?.find(f=>f.regionId===eye.regionId),this.upperShades.get(eye.regionId),skin?.paintType==='smooth'?skin.color:undefined);
      else drawAuthoredEye(ctx,eye,this.eyePaths.get(eye.regionId)!,this.paints[eye.regionId]?.color,this.media);
    }
  }
  private drawDetails(ctx:CanvasRenderingContext2D,eyes=true,items=this.items){
    const parts=this.template?.paintingProfile?.smoothArtwork?items.filter(i=>this.paints[i.region.id]?.paintType==='smooth'&&!this.eyePaths.has(i.region.id)).map(i=>({region:i.region,path:i.path,paint:this.paints[i.region.id]})):[];
    const surface=this.template?.paintingProfile?.smoothArtwork?.ink==='surface-v1'&&parts.length>0;
    for(const [index,d]of this.details.entries()){const repair=this.template?.paintingProfile?.smoothArtwork?.surfaceFields?.whiteDetails?.find(w=>w.detailIndex===index);if(repair&&this.paints[repair.regionId]?.paintType==='smooth')continue;if(d.fill){if(surface&&/^#0{3}(?:0{3})?$/i.test(d.fill))drawSurfaceInk(ctx,d.path,items.filter(i=>i.field).map(i=>({region:i.region,path:i.path,field:i.field!,paint:this.paints[i.region.id]})),this.template!,this.media,this.createCanvas);else{ctx.fillStyle=d.fill;ctx.fill(d.path);if(/^#0{3}(?:0{3})?$/i.test(d.fill))drawPigmentInk(ctx,d.path,parts);}}if(d.strokeWidth>0){ctx.strokeStyle='#000';ctx.lineWidth=d.strokeWidth;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(d.path);}}
    if(surface)for(const brow of this.brows){
      if(this.paints[brow.parent]?.paintType!=='smooth')continue;
      const item=this.items.find(i=>i.region.id===brow.parent);if(!item?.field)continue;
      const color=this.paints[brow.color]?.color??'#70452E',n=parseInt(color.slice(1),16),b=brow.bounds;
      const tone=(f:number)=>`rgb(${[n>>>16,(n>>>8)&255,n&255].map(c=>Math.round(5+c*f)).join(',')})`;
      const shade=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.height);shade.addColorStop(0,tone(.4));shade.addColorStop(1,tone(.7));
      ctx.save();ctx.clip(brow.clip??item.field,'evenodd');ctx.fillStyle=shade;ctx.fill(brow.path,'evenodd');ctx.restore();
    }
    if(surface)for(const feature of this.faceDetails){
      if(this.paints[feature.parent]?.paintType!=='smooth')continue;
      const color=this.paints[feature.color]?.color??this.paints[feature.parent]?.color??'#000000',n=parseInt(color.slice(1),16),robot=feature.kind==='robot';
      ctx.save();ctx.fillStyle=`rgb(${[n>>>16,(n>>>8)&255,n&255].map(c=>Math.round(robot?c*.8+30:c*.30)).join(',')})`;ctx.globalAlpha=robot?.9:feature.kind==='dinosaur'?.55:.7;
      for(const d of this.details)if(d.fill==='#000000'){ctx.save();ctx.clip(d.path);ctx.fill(feature.path,'evenodd');ctx.restore();}ctx.restore();
    }
    if(surface)for(const inset of this.insets){const paint=this.paints[inset.regionId],item=this.items.find(i=>i.region.id===inset.regionId);if(!item||paint?.paintType!=='smooth')continue;const n=parseInt(paint.color.slice(1),16);ctx.save();ctx.clip(item.path,item.region.fillRule??'nonzero');ctx.fillStyle=inset.light?'#fff':`rgb(${[n>>>16,(n>>>8)&255,n&255].map(c=>Math.round(c*.12)).join(',')})`;ctx.fill(inset.path);ctx.restore();}
    if(surface)for(const mouth of this.mouths){
      if(this.paints[mouth.regionId]?.paintType!=='smooth'){if(mouth.blankInk){ctx.fillStyle='#000';ctx.fill(mouth.blankInk);}continue;}
      if(!mouth.teeth)continue;const item=this.items.find(i=>i.region.id===mouth.regionId);if(!item)continue;ctx.save();ctx.clip(item.path,item.region.fillRule??'nonzero');ctx.fillStyle='#fff';ctx.fill(mouth.teeth);ctx.restore();
    }
    if(eyes)this.drawEyes(ctx);
  }
  private tile(s:number,x:number,y:number,ink:boolean,phaseX=0,phaseY=0):{surface:RegionSurface;cached:boolean}{
    const b:Bounds={x:(x*TILE-BLEED-phaseX)/s,y:(y*TILE-BLEED-phaseY)/s,width:(TILE+BLEED*2)/s,height:(TILE+BLEED*2)/s};
    const inkFinish=ink&&!!this.template?.paintingProfile?.smoothArtwork;
    const relevant=this.items.filter(i=>{const smooth=this.paints[i.region.id]?.paintType==='smooth',box=smooth?(i.smoothBounds??i.region.bounds):i.region.bounds;return intersects(inkFinish?(i.fieldBounds??box):box,inkFinish?{x:b.x-16,y:b.y-16,width:b.width+32,height:b.height+32}:b)||(!ink&&smooth&&!!this.template?.paintingProfile?.smoothArtwork?.surfaceLight&&!!i.fieldBounds&&intersects(i.fieldBounds,b));});
    const key=`${ink?'ink':'paint'}:${s.toFixed(8)}:${x}:${y}:${this.mediaRevision}:${phaseX.toFixed(8)}:${phaseY.toFixed(8)}:${ink?this.template?.paintingProfile?.eyes.map(e=>`${e.regionId}:${this.paints[e.regionId]?.color??''}/${inkFinish?this.paints[e.regionId]?.paintType??'':''}`).join(';'):''}:${!ink||inkFinish?relevant.map(i=>`${i.region.id}=${this.paints[i.region.id]?.color??''}/${this.paints[i.region.id]?.paintType??''}`).join(';'):''}:${inkFinish?[...this.brows,...this.faceDetails].map(b=>this.paints[b.color]?.color??'').join(';'):''}`;
    const old=this.cache.get(key);if(old){this.counts.cacheHits++;return {surface:old,cached:true};}
    this.counts.cacheMisses++;const c=this.createCanvas(TILE+BLEED*2,TILE+BLEED*2),ctx=context2D(c);ctx.setTransform(s,0,0,s,-x*TILE+BLEED+phaseX,-y*TILE+BLEED+phaseY);
    if(ink)this.drawDetails(ctx,!this.nativeEyes(),relevant);else{this.drawBase(ctx,relevant);for(const i of relevant)this.drawPaint(ctx,i);this.counts.textureBuilds++;}
    const surface={canvas:c,bounds:b,bytes:c.width*c.height*4};return {surface,cached:this.cache.set(key,surface)};
  }
  private nativeEyes(){return this.template?.paintingProfile?.version===4||!!(this.template?.paintingProfile?.smoothArtwork&&this.template.paintingProfile.eyes.some(e=>this.paints[e.regionId]?.paintType==='smooth'));}
  private render(){
    if(!this.template)return;const start=this.now(),ctx=this.context;
    const fit=Math.min(this.cssWidth/1600,this.cssHeight/2000),s=fit*this.ratio*this.view.scale;
    const ox=this.view.x*this.ratio,oy=this.view.y*this.ratio;
    const master=this.nativeEyes(),nativePhase=master||this.smoothSurface(),phaseX=nativePhase?ox-Math.floor(ox):0,phaseY=nativePhase?oy-Math.floor(oy):0;
    ctx.resetTransform();ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.setTransform(s,0,0,s,ox,oy);if(this.background)drawScene(ctx,this.background);if(this.frame&&frameBehindArtwork(this.frame))drawScene(ctx,this.frame);ctx.resetTransform();
    const layer=this.smoothSurface()?this.createCanvas(this.canvas.width,this.canvas.height):null,art=layer?context2D(layer):ctx;
    const x0=Math.floor(-ox/TILE),y0=Math.floor(-oy/TILE),x1=Math.floor((this.canvas.width-ox)/TILE),y1=Math.floor((this.canvas.height-oy)/TILE);
    for(const ink of [false,true])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const {surface,cached}=this.tile(s,x,y,ink,phaseX,phaseY);
      // Only copy each tile's interior; the overlap controls rasterization, not opacity.
      art.drawImage(canvasImage(surface.canvas),BLEED,BLEED,TILE,TILE,x*TILE+ox-phaseX,y*TILE+oy-phaseY,TILE,TILE);
      if(!cached){surface.canvas.width=1;surface.canvas.height=1;}
    }
    art.setTransform(s,0,0,s,ox,oy);if(master)this.drawEyes(art);
    if(layer){this.clipPaintSurface(art);ctx.drawImage(canvasImage(layer),0,0);layer.width=layer.height=1;}
    ctx.setTransform(s,0,0,s,ox,oy);if(this.frame&&!frameBehindArtwork(this.frame))drawScene(ctx,this.frame);ctx.resetTransform();
    this.counts.frames++;this.counts.lastFrameMs=this.now()-start;this.counts.maxFrameMs=Math.max(this.counts.maxFrameMs,this.counts.lastFrameMs);
  }
  renderSnapshot(width=2048):EngineCanvas{
    this.assert();if(!this.template)throw new Error('ぬりえを開いてから保存してください。');if(!Number.isInteger(width)||width<4||width>4096||width%4)throw new Error('画像サイズが正しくありません。');
    const c=this.createCanvas(width,width*5/4),ctx=context2D(c);ctx.setTransform(width/1600,0,0,width/1600,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,2000);
    if(this.background)drawScene(ctx,this.background);if(this.frame&&frameBehindArtwork(this.frame))drawScene(ctx,this.frame);
    if(this.smoothSurface()){const layer=this.createCanvas(c.width,c.height),paint=context2D(layer);paint.setTransform(ctx.getTransform());this.drawBase(paint);for(const item of this.items)this.drawPaint(paint,item);this.drawDetails(paint);this.clipPaintSurface(paint);ctx.save();ctx.resetTransform();ctx.drawImage(canvasImage(layer),0,0);ctx.restore();layer.width=layer.height=1;}
    else{this.drawBase(ctx);for(const item of this.items)this.drawPaint(ctx,item);this.drawDetails(ctx);}
    if(this.frame&&!frameBehindArtwork(this.frame))drawScene(ctx,this.frame);return c;
  }
  async exportPng(){const c=this.renderSnapshot();try{return await canvasBlob(c,'image/png');}finally{c.width=1;c.height=1;}}
  async exportThumbnail(width=320){const c=this.renderSnapshot(width);try{return await canvasBlob(c,'image/webp',.86);}finally{c.width=1;c.height=1;}}
  dispose(){if(!this.alive)return;this.cache.clear();this.hitCanvas.width=1;this.hitCanvas.height=1;this.items=[];this.details=[];this.brows=[];this.faceDetails=[];this.mouths=[];this.insets=[];this.repairShape=null;this.paintSurface=null;this.upperShades.clear();this.eyePaths.clear();this.blankEyes.clear();this.opaque=null;this.template=null;this.media=undefined;this.background=null;this.frame=null;this.alive=false;this.context.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
