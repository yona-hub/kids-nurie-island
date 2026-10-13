import type { Bounds, Point, Region, RegionPaint, RegionPaints, Template } from '../../shared-types/src/index';
import type { EngineMetrics, EngineOptions } from './engine';
import { canvasBlob, canvasImage, context2D, createBrowserCanvas, type EngineCanvas } from './canvas';
import { SurfaceCache, type RegionSurface } from './cache';
import { intersects } from './geometry';
import { validatePaintingProfile } from './painting';
import { drawStorybookFinish, drawStorybookEye, drawStorybookEyeContour, type MediumImages } from './storybook-texture';
import { drawScene, type SceneImage } from './storybook-scene';
import type { Viewport } from './geometry';
interface Item { region: Region; path: Path2D }
export interface StorySceneUpdate { regions?: RegionPaints; background?: SceneImage | null; frame?: SceneImage | null }
const TILE=512, BLEED=2;

/** Viewport-sized display; world-aligned tiles never magnify a fit-sized bitmap. */
export class StorybookEngine {
  private createCanvas;private createPath;private now;private cache: SurfaceCache;
  private context;private hitCanvas;private hitContext;private template: Template | null=null;
  private items: Item[]=[];private details: {path:Path2D;fill?:string;strokeWidth:number;eyeRegionId?:string}[]=[];
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
    const items=t.regions.filter(r=>!automatic.has(r.id)).map(region=>({region,path:this.createPath(region.path)}));
    const details=t.details.map(d=>({path:this.createPath(d.path),fill:d.fill,strokeWidth:d.strokeWidth??t.lineWidth,eyeRegionId:d.eyeRegionId}));
    const next=this.normalize(paints,t);this.cache.clear();this.template=t;this.items=items;this.details=details;this.paints=next;this.render();
  }
  private normalize(paints:RegionPaints,t=this.template):RegionPaints {
    const ids=new Set(t?.regions.map(r=>r.id));const next:RegionPaints={};
    for(const [id,p]of Object.entries(paints)){if(!ids.has(id)||!/^#[0-9a-f]{6}$/i.test(p.color)||!['smooth','crayon','pencil'].includes(p.paintType))throw new Error('塗り方のデータを読み込めませんでした。');next[id]={color:p.color.toUpperCase(),paintType:p.paintType};}return next;
  }
  setScene(u:StorySceneUpdate){this.assert();let changed=false;if(u.regions){const next=this.normalize(u.regions);changed=JSON.stringify(next)!==JSON.stringify(this.paints);this.paints=next;}if(u.background!==undefined&&u.background!==this.background){this.background=u.background;changed=true;}if(u.frame!==undefined&&u.frame!==this.frame){this.frame=u.frame;changed=true;}if(changed)this.render();}
  setMediumImages(media:MediumImages){this.assert();if(this.media?.paper===media.paper&&this.media.wax===media.wax&&this.media.pencil===media.pencil&&this.media.iris===media.iris)return;this.media=media;this.mediaRevision++;this.cache.clear();this.render();}
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
    const find=(p:Point)=>{for(let i=this.items.length-1;i>=0;i--){const item=this.items[i];if(intersects(item.region.bounds,{...p,width:0,height:0})&&this.hitContext.isPointInPath(item.path,p.x,p.y))return item.region.id;}return null;};
    const exact=find(point);if(exact||!assist)return exact;
    for(const r of [5,10,16,22])for(let i=0;i<16;i++){const hit=find({x:point.x+Math.cos(i*Math.PI/8)*r,y:point.y+Math.sin(i*Math.PI/8)*r});if(hit)return hit;}return null;
  }
  getRegionPoint(id:string):Point|null {
    const item=this.items.find(i=>i.region.id===id);if(!item)return null;const b=item.region.bounds;
    for(const n of [1,4,8,16])for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p={x:b.x+(x+.5)/n*b.width,y:b.y+(y+.5)/n*b.height};if(this.hitTest(p,false)===id)return p;}return null;
  }
  getPaints(){return Object.fromEntries(Object.entries(this.paints).map(([id,p])=>[id,{...p}]));}
  getMetrics():EngineMetrics{return {...this.counts,cacheBytes:this.cache.bytes,layerBytes:this.canvas.width*this.canvas.height*4,activeAnimations:0};}
  private drawPaint(ctx:CanvasRenderingContext2D,item:Item){ctx.fillStyle='#FFFFFF';ctx.fill(item.path);const p=this.paints[item.region.id];if(p&&this.template)drawStorybookFinish(ctx,item.region,item.path,p,this.template,this.media);else {const eye=this.template?.paintingProfile?.eyes.find(e=>e.regionId===item.region.id);if(eye)drawStorybookEye(ctx,item.region,item.path,undefined,undefined,eye);}}
  private drawDetails(ctx:CanvasRenderingContext2D){for(const d of this.details){if(d.eyeRegionId&&this.paints[d.eyeRegionId]){const item=this.items.find(i=>i.region.id===d.eyeRegionId),eye=this.template?.paintingProfile?.eyes.find(e=>e.regionId===d.eyeRegionId);if(item&&eye)drawStorybookEyeContour(ctx,item.region,item.path,eye);continue;}if(d.fill){ctx.fillStyle=d.fill;ctx.fill(d.path);}if(d.strokeWidth>0){ctx.strokeStyle='#000';ctx.lineWidth=d.strokeWidth;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(d.path);}}}
  private tile(s:number,x:number,y:number,ink:boolean):{surface:RegionSurface;cached:boolean}{
    const b:Bounds={x:(x*TILE-BLEED)/s,y:(y*TILE-BLEED)/s,width:(TILE+BLEED*2)/s,height:(TILE+BLEED*2)/s};
    const relevant=this.items.filter(i=>intersects(i.region.bounds,b));
    const key=`${ink?'ink':'paint'}:${s.toFixed(8)}:${x}:${y}:${ink?this.template?.paintingProfile?.eyes.map(e=>`${e.regionId}:${Boolean(this.paints[e.regionId])}`).join(';'):`${this.mediaRevision}:`+relevant.map(i=>`${i.region.id}=${this.paints[i.region.id]?.color??''}/${this.paints[i.region.id]?.paintType??''}`).join(';')}`;
    const old=this.cache.get(key);if(old){this.counts.cacheHits++;return {surface:old,cached:true};}
    this.counts.cacheMisses++;const c=this.createCanvas(TILE+BLEED*2,TILE+BLEED*2),ctx=context2D(c);ctx.setTransform(s,0,0,s,-x*TILE+BLEED,-y*TILE+BLEED);
    if(ink)this.drawDetails(ctx);else{for(const i of relevant)this.drawPaint(ctx,i);this.counts.textureBuilds++;}
    const surface={canvas:c,bounds:b,bytes:c.width*c.height*4};return {surface,cached:this.cache.set(key,surface)};
  }
  private render(){
    if(!this.template)return;const start=this.now(),ctx=this.context;
    const fit=Math.min(this.cssWidth/1600,this.cssHeight/2000),s=fit*this.ratio*this.view.scale;
    const ox=this.view.x*this.ratio,oy=this.view.y*this.ratio;
    ctx.resetTransform();ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.setTransform(s,0,0,s,ox,oy);if(this.background)drawScene(ctx,this.background);ctx.resetTransform();
    const x0=Math.floor(-ox/TILE),y0=Math.floor(-oy/TILE),x1=Math.floor((this.canvas.width-ox)/TILE),y1=Math.floor((this.canvas.height-oy)/TILE);
    for(const ink of [false,true])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const {surface,cached}=this.tile(s,x,y,ink);
      // Only copy each tile's interior; the overlap controls rasterization, not opacity.
      ctx.drawImage(canvasImage(surface.canvas),BLEED,BLEED,TILE,TILE,x*TILE+ox,y*TILE+oy,TILE,TILE);
      if(!cached){surface.canvas.width=1;surface.canvas.height=1;}
    }
    ctx.setTransform(s,0,0,s,ox,oy);if(this.frame)drawScene(ctx,this.frame);ctx.resetTransform();
    this.counts.frames++;this.counts.lastFrameMs=this.now()-start;this.counts.maxFrameMs=Math.max(this.counts.maxFrameMs,this.counts.lastFrameMs);
  }
  renderSnapshot(width=2048):EngineCanvas{
    this.assert();if(!this.template)throw new Error('ぬりえを開いてから保存してください。');if(!Number.isInteger(width)||width<4||width>4096||width%4)throw new Error('画像サイズが正しくありません。');
    const c=this.createCanvas(width,width*5/4),ctx=context2D(c);ctx.setTransform(width/1600,0,0,width/1600,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,2000);
    if(this.background)drawScene(ctx,this.background);for(const item of this.items)this.drawPaint(ctx,item);this.drawDetails(ctx);if(this.frame)drawScene(ctx,this.frame);return c;
  }
  async exportPng(){const c=this.renderSnapshot();try{return await canvasBlob(c,'image/png');}finally{c.width=1;c.height=1;}}
  async exportThumbnail(width=320){const c=this.renderSnapshot(width);try{return await canvasBlob(c,'image/webp',.86);}finally{c.width=1;c.height=1;}}
  dispose(){if(!this.alive)return;this.cache.clear();this.hitCanvas.width=1;this.hitCanvas.height=1;this.items=[];this.details=[];this.template=null;this.media=undefined;this.background=null;this.frame=null;this.alive=false;this.context.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
