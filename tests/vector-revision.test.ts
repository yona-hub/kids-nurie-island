import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Path2D as NativePath,createCanvas,loadImage} from '@napi-rs/canvas';
import {describe,it,expect} from 'vitest';
import {ColoringEngine,type EngineCanvas} from '../packages/coloring-engine/src/index';
import type {Template,TemplateSummary} from '../packages/shared-types/src/index';
// @ts-expect-error Production fitting is an executable ESM asset tool.
import {fitPolygonPath,polygonContours} from '../tools/asset-pipeline/vector-curves.mjs';
const read=async<T>(p:string)=>JSON.parse(await fs.readFile(p,'utf8')) as T;
const native=(w:number,h:number)=>createCanvas(w,h) as unknown as EngineCanvas;
async function originalCurveRevision(t:Template){let old=t;while(old.paintingProfile?.smoothArtwork?.ink==='surface-v1'||old.paintingProfile?.version===4)old=await read<Template>(`apps/web/public/content/templates/${old.paintingProfile!.upgradeFrom}.json`);return old;}
describe('v3 curves, eye anatomy, coverage and retained v2',()=>{
 it('preserves the hood-to-headlight ink gap and paints the former fixed-white pinholes as body',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json'),item=catalog.find(t=>t.themeId==='vehicles')!,t=await read<Template>(`apps/web/public${item.assetUrl}`);
  expect((t.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' ')+t.paintingProfile!.opaquePath).match(/C/g)?.length??0,'compact foreground and ink must not retain thousands of antialias holes').toBeLessThan(5000);
  const curve=await originalCurveRevision(t),source=await fs.readFile(`content/vector-generated/compiled/ink/${curve.id}/source-ink.png`);
  expect(createHash('sha256').update(source).digest('hex')).toBe('5cf1b9eacc6e4be1658dc135316323125413e5d7af586cb97710eecc285523e3');
  // VV-07 independent source crop: 1280..1380 × 935..1095 page units.
  const original=createCanvas(200,320),fitted=createCanvas(200,320);
  original.getContext('2d').drawImage(await loadImage(source),-2560,-1870);
  const ctx=fitted.getContext('2d');ctx.scale(2,2);ctx.translate(-1280,-935);ctx.fill(new NativePath(t.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' ')));
  const holes=(canvas:typeof original)=>{
   const data=canvas.getContext('2d').getImageData(0,0,200,320).data,seen=new Uint8Array(200*320);let count=0;
   for(let seed=0;seed<seen.length;seed++)if(!seen[seed]&&data[seed*4+3]<128){
    const stack=[seed];seen[seed]=1;let size=0,touchesEdge=false;
    while(stack.length){const index=stack.pop()!,x=index%200,y=Math.floor(index/200);size++;if(x===0||x===199||y===0||y===319)touchesEdge=true;
     for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy,n=ny*200+nx;if(nx>=0&&nx<200&&ny>=0&&ny<320&&!seen[n]&&data[n*4+3]<128){seen[n]=1;stack.push(n);}}
    }
    if(!touchesEdge&&size>=4)count++;
   }
   return count;
  };
  expect(holes(original),'original continuous gap').toBe(0);expect(holes(fitted),'fitted gap must remain connected to the exterior').toBe(0);
  const whiteDetails=t.details.filter(d=>d.fill?.toLowerCase()==='#ffffff');expect(whiteDetails).toHaveLength(3);
  // These are the independently observed white squares, not a sample chosen
  // from implementation output. The new body covers them; fixed details must
  // not paint white on top. Real tire glints elsewhere remain in this template.
  const c=native(320,400),engine=new ColoringEngine(c,{createCanvas:native,createPath:p=>new NativePath(p) as unknown as Path2D});engine.loadTemplate(t);engine.paint('r10',{color:'#CC1111',paintType:'smooth'});
  const shot=engine.renderSnapshot(1600),painted=shot.getContext('2d')!;
  for(const [x,y]of [[1305,983],[1304,992]]){const rgba=painted.getImageData(x,y,1,1).data;expect(rgba[0]).toBeGreaterThan(100);expect(rgba[1]).toBeLessThan(60);expect(rgba[2]).toBeLessThan(60);expect(rgba[3]).toBe(255);}
  engine.dispose();
 });
 it('fits a smooth circle compactly and preserves corners and a real hole',()=>{
  const circle='M'+Array.from({length:360},(_,i)=>[100+70*Math.cos(i*Math.PI/180),100+70*Math.sin(i*Math.PI/180)].join(' ')).join('L')+'Z';
  const fitted=fitPolygonPath(circle);expect(fitted.segments).toBeLessThan(20);expect(fitted.path).toContain('C');
  const p='M0 0L100 0L100 100L0 100Z M30 30L30 70L70 70L70 30Z',r=fitPolygonPath(p),ctx=createCanvas(1,1).getContext('2d'),shape=new NativePath(r.path);
  expect(r.contours).toBe(2);expect(polygonContours(p)).toHaveLength(2);expect(ctx.isPointInPath(shape,50,50)).toBe(false);expect(ctx.isPointInPath(shape,20,20)).toBe(true);
  const bounds=shape.computeTightBounds();expect(bounds[0]).toBeGreaterThan(-1);expect(bounds[2]).toBeLessThan(101);
 });
 it('has authored lids/reflections, no boy or animal lashes, and no vehicle face or retired paint correspondence',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json');let count=0;
  for(const item of catalog){const t=await read<Template>(`apps/web/public${item.assetUrl}`),profile=t.paintingProfile!;for(const e of profile.eyes){const a=e.artwork!;expect(a.reflections).toHaveLength(2);expect(a.upperWidth).toBeGreaterThan(0);if(e.owner!=='princess')expect(a.lashes).toEqual([]);if(e.owner==='dinosaur'){expect(a.kind).toBe('dinosaur');expect(a.iris.height).toBeGreaterThan(a.iris.width);}count++;}
   if(['construction','vehicles'].includes(t.themeId)){expect(profile.eyes).toEqual([]);expect(t.regions.some(r=>/瞳|ハイライト|眉|口/.test(r.name)&&!/通風口/.test(r.name))).toBe(false);}
   if(t.themeId==='construction')for(const map of Object.values(profile.upgradeSources!))for(const id of ['r24','r25','r27','r28','r32'])expect(Object.hasOwn(map,id)).toBe(false);
  }
  expect(count).toBe(20);
 });
 it('does not erase a painted neighbor when another region is unpainted; smooth covers the boundary under ink',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json'),entry=catalog.find(t=>t.themeId==='magic')!,t=await read<Template>(`apps/web/public${entry.assetUrl}`);
  const c=native(320,400),engine=new ColoringEngine(c,{createCanvas:native,createPath:p=>new NativePath(p) as unknown as Path2D});engine.loadTemplate(t);engine.resize(320,400,1);
  const region=t.regions.find(r=>r.id==='r06')!;engine.paint('r06',{color:'#FF0000',paintType:'smooth'});const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!,ink=new NativePath(t.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' ')),path=new NativePath(region.path);
  let interior=0,white=0;for(let y=Math.ceil(region.bounds.y);y<region.bounds.y+region.bounds.height;y++)for(let x=Math.ceil(region.bounds.x);x<region.bounds.x+region.bounds.width;x++)if(ctx.isPointInPath(path as unknown as Path2D,x+.5,y+.5,region.fillRule??'nonzero')&&!ctx.isPointInPath(ink as unknown as Path2D,x+.5,y+.5)&&!t.paintingProfile!.eyes.some(e=>ctx.isPointInPath(new NativePath(e.artwork!.opening) as unknown as Path2D,x+.5,y+.5))){const rgb=ctx.getImageData(x,y,1,1).data;if(rgb[0]>245&&rgb[1]>245&&rgb[2]>245)white++;interior++;}
  expect(interior).toBeGreaterThan(1000);expect(white).toBe(0);engine.dispose();
 });
 it('preserves authored face and coverage hole rules and reclaims the former eye ink into painted skin',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json');
  for(const theme of ['princess','magic','dinosaurs']){
   const entry=catalog.find(t=>t.themeId===theme)!,t=await read<Template>(`apps/web/public${entry.assetUrl}`),curve=await originalCurveRevision(t),original=curve.paintingProfile?await read<Template>(`apps/web/public/content/templates/${curve.paintingProfile.upgradeFrom}.json`):curve;
   const c=native(320,400),engine=new ColoringEngine(c,{createCanvas:native,createPath:p=>new NativePath(p) as unknown as Path2D});engine.loadTemplate(t);engine.resize(320,400,1);
   for(const e of t.paintingProfile!.eyes)engine.paint(e.parentRegionId!,{color:'#FF8800',paintType:'smooth'});
   const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!,data=ctx.getImageData(0,0,1600,2000).data;
   const mask=(path:string,rule:CanvasFillRule='nonzero')=>{const canvas=createCanvas(1600,2000),context=canvas.getContext('2d');context.fill(new NativePath(path),rule);return context.getImageData(0,0,1600,2000).data;};
   const originalInk=mask(original.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' ')),newInk=mask(t.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' '));
   for(const e of t.paintingProfile!.eyes){
    const parent=t.regions.find(r=>r.id===e.parentRegionId)!,p=new NativePath(parent.path),coverage=new NativePath(parent.coveragePath!),opening=new NativePath(e.artwork!.opening),g=e.geometry!;
    expect(ctx.isPointInPath(p as unknown as Path2D,g.cx,g.cy,parent.fillRule??'nonzero'),`${theme}: face excludes eye hole`).toBe(false);
    expect(ctx.isPointInPath(coverage as unknown as Path2D,g.cx,g.cy,parent.coverageFillRule??'nonzero'),`${theme}: coverage excludes eye hole`).toBe(false);
    let reclaimed=0;const parentMask=mask(parent.path,parent.fillRule??'nonzero');
    // I18/I20/I22 keep the early white pupil independent of the finished
    // opening. Its intentionally white interior may extend outside that globe.
    // This exception uses authored early contours, never the rendered result.
    const blankContours=e.artwork!.blankInkPath?.match(/M[^M]*/gi)??[],blankWhite=blankContours.length?createCanvas(1600,2000):undefined;
    if(blankWhite)for(const contour of blankContours)blankWhite.getContext('2d').fill(new NativePath(contour));
    const blankMask=blankWhite?.getContext('2d').getImageData(0,0,1600,2000).data;
    for(let y=Math.floor(g.cy-g.height*.75);y<g.cy+g.height*.75;y++)for(let x=Math.floor(g.cx-g.width*.75);x<g.cx+g.width*.75;x++){
     const i=(y*1600+x)*4;
     if(originalInk[i+3]<250||newInk[i+3]>10||parentMask[i+3]<250||ctx.isPointInPath(opening as unknown as Path2D,x+.5,y+.5)||(blankMask?.[i+3]??0)>10)continue;
     expect(data[i+2],`${theme}/${e.regionId}: deleted rim at ${x},${y} is painted`).toBeLessThan(230);reclaimed++;
    }
    expect(reclaimed,`${theme}/${e.regionId}: former ink reclaimed`).toBeGreaterThan(10);
    if(blankWhite)blankWhite.width=blankWhite.height=1;
   }
   engine.dispose();
  }
 });
 it('retains every adopted and shipped-v2 template byte and dispatches v2 without authored eye data',async()=>{
  const adoption=await read<{templates:{id:string;originalFile:string;originalSha256:string}[]}>('content/generated-lineart/user-adoption.json');
  for(const item of adoption.templates){expect(createHash('sha256').update(await fs.readFile(item.originalFile)).digest('hex')).toBe(item.originalSha256);const old=await read<Template>(`apps/web/public/content/templates/${item.id}-storybook-v1.json`);expect(old.paintingProfile!.version).toBe(2);expect(old.paintingProfile!.eyes.some(e=>e.artwork)).toBe(false);const c=native(320,400),engine=new ColoringEngine(c,{createCanvas:native,createPath:p=>new NativePath(p) as unknown as Path2D});expect(()=>engine.loadTemplate(old)).not.toThrow();engine.dispose();}
 });
 it('replacing eyes preserves the nearby dog nose, dog mouth and turtle mouth ink',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json');
  // Independent visual audit VV-05 coordinates, converted from 640×800 to the
  // 1600×2000 page. These features are not part of any eye replacement.
  for(const [theme,boxes]of [['animals',[[645,1082,48,51],[590,1152,133,76]]],['ocean',[[707,1007,131,69]]]] as const){
   const entry=catalog.find(t=>t.themeId===theme)!,t=await read<Template>(`apps/web/public${entry.assetUrl}`),old=await read<Template>(`apps/web/public/content/templates/${t.paintingProfile!.upgradeFrom}.json`);
   for(const [x,y,w,h]of boxes){
    const ink=(template:Template)=>{const c=createCanvas(w,h),ctx=c.getContext('2d');ctx.translate(-x,-y);ctx.fill(new NativePath(template.details.filter(d=>d.fill==='#000000').map(d=>d.path).join(' ')));return ctx.getImageData(0,0,w,h).data;};
    const before=ink(old),after=ink(t);let original=0,retained=0;
    for(let i=3;i<before.length;i+=4)if(before[i]>250){original++;if(after[i]>200)retained++;}
    expect(original).toBeGreaterThan(50);expect(retained/original,`${theme}: protected mouth/nose ink`).toBeGreaterThan(.8);
   }
  }
 });
});
