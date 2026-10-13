import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createCanvas,Path2D as NativePath,loadImage} from '@napi-rs/canvas';
import {describe,it,expect} from 'vitest';
import {ColoringEngine,validatePaintingProfile,type EngineCanvas} from '../packages/coloring-engine/src/index';
import {drawStorybookFinish,type MediumImages} from '../packages/coloring-engine/src/storybook-texture';
import {drawPigmentInk,drawSurfaceInk} from '../packages/coloring-engine/src/smooth-finish';
import type {Template,PaintType,Region} from '../packages/shared-types/src/index';
import {artworkRevision} from '../apps/web/src/artwork-source';
import {makeProject} from './sync.helpers';

const root='test-results/smooth-home-i34/revision-1';
const read=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));
const catalog=await read('apps/web/public/content/catalog.json') as {id:string;themeId:string;assetUrl:string}[];
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const makeCanvas=(w:number,h:number)=>createCanvas(w,h) as unknown as EngineCanvas;
const pixels=(c:EngineCanvas)=>Buffer.from(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data);

describe('I34 per-drawing smooth finish',()=>{
 it('keeps the reported princess cheek boundary continuous without a white fringe',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='princess')!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  const reference=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='princess');
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:reference.palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(3200),roi=shot.getContext('2d')!.getImageData(1590,1300,57,61).data,edges:number[]=[];
  // Independent R61S-1: the visible skin/hair edge jumped at world (812,668).
  // Locate the rendered color transition rather than inspecting its path data.
  for(let y=0;y<61;y++){
   const green=(x:number)=>roi[(y*57+x)*4+1];let total=0,weighted=0;
   for(let x=0;x<56;x++){const drop=Math.max(0,green(x)-green(x+1));total+=drop;weighted+=(x+1)*drop;}
   expect(total,'skin/hair transition must remain visible').toBeGreaterThan(80);
   expect(Math.max(...Array.from({length:57},(_,x)=>green(x)))-green(0),'new white fringe').toBeLessThanOrEqual(8);
   edges.push(weighted/total/2);
  }
  const steps=edges.slice(1).map((x,i)=>x-edges[i]),bends=steps.slice(1).map((dx,i)=>Math.abs(dx-steps[i]));
  expect(Math.max(...bends),'localized cheek notch').toBeLessThanOrEqual(.5);
  shot.width=shot.height=1;engine.dispose();
 });
 it('keeps the independently reported white eye bands painted as skin while the pupils remain unpainted',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('princess'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t);engine.setMediumImages(media);const blank=engine.renderSnapshot(320),before=pixels(blank);blank.width=blank.height=1;
  engine.paint('r07',{color:'#F2D7BD',paintType:'smooth'});const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!;
  // Independent revision-58 visual FAIL: white bands outside the early lids.
  for(const [x,y]of [[650,525],[620,558],[788,561],[759,587]])expect(ctx.getImageData(x,y,1,1).data[2],`external white band at ${x},${y}`).toBeLessThan(240);
  expect(ctx.getImageData(651,521,1,1).data[2],'former rim must remain painted skin').toBeLessThan(230);
  // Independent revision-59 R59-1: an old cutout sampled the source's dark iris.
  for(const [x,y]of [[799,596],[799,600],[801,600]])expect(ctx.getImageData(x,y,1,1).data[1],`retired iris must inherit skin at ${x},${y}`).toBeGreaterThan(150);
  expect(t.paintingProfile!.eyes.every(e=>engine.getPaints()[e.regionId]===undefined)).toBe(true);
  engine.paint('r07',null);const erased=engine.renderSnapshot(320);expect(pixels(erased).equals(before)).toBe(true);shot.width=shot.height=erased.width=erased.height=1;engine.dispose();
 });
 it.each(catalog.map(e=>[e.id,e.assetUrl]))('%s binds a private master and gray lighting to unchanged paint/hit/line/eye geometry',async(id,url)=>{
  const current:Template=await read('apps/web/public'+url),before:Template=await read(`${root}/before-files/${current.paintingProfile!.upgradeFrom}.json`);
  expect(current.id).not.toBe(before.id);expect(current.regions).toEqual(before.regions);expect(current.details).toEqual(before.details);
  for(const key of ['opaquePath','eyes','groups','formArtwork'] as const)expect(current.paintingProfile![key]).toEqual(before.paintingProfile![key]);
  expect(current.paintingProfile!.upgradeSources?.[before.id]).toEqual(Object.fromEntries(before.regions.map(r=>[r.id,r.id])));
  for(const [id,map]of Object.entries(before.paintingProfile!.upgradeSources??{}))expect(current.paintingProfile!.upgradeSources?.[id]).toEqual(map);
  const upgrades=await read('apps/web/public/content/upgrade-index.json');
  for(const sourceId of [before.id,...Object.keys(before.paintingProfile!.upgradeSources??{})])expect(upgrades[sourceId]).toBe(current.id);
  expect(()=>validatePaintingProfile(current)).not.toThrow();
  const m=(await read(`content/smooth-finish-${current.paintingProfile!.smoothArtwork!.ink==='surface-v1'?'i34':'i33'}/manifest.json`)).templates.find((m:{templateId:string})=>m.templateId===id);
  expect(sha(await fs.readFile(m.masterFile))).toBe(current.paintingProfile!.smoothArtwork!.masterSha256);
  const map=await fs.readFile('apps/web/public'+current.paintingProfile!.mediumAssets.smooth);
  expect(sha(map)).toBe(m.mapSha256);expect(url).toContain(sha(await fs.readFile('apps/web/public'+url)));
  const {data,info}=await sharp(map).removeAlpha().raw().toBuffer({resolveWithObject:true});expect([info.width,info.height]).toEqual([2048,2560]);
  let gray=true,min=255,max=0;for(let p=0;p<data.length;p+=info.channels){if(info.channels>=3&&(data[p]!==data[p+1]||data[p]!==data[p+2]))gray=false;min=Math.min(min,data[p]);max=Math.max(max,data[p]);}
  expect(gray).toBe(current.paintingProfile!.smoothArtwork!.encoding==='relative-light-v1');expect(min).toBeLessThan(100);expect(max).toBeGreaterThan(170);
  if(!gray)expect(current.paintingProfile!.smoothArtwork!.chromaticRegionIds!.length).toBeGreaterThan(0);
  expect(JSON.stringify(current)).not.toMatch(/originals\/|finished-v1|registered\.png/);
  if(['construction','vehicles'].includes(current.themeId))expect(current.paintingProfile!.eyes).toEqual([]);
 });

 it('rejects unbound maps, incomplete group correspondence and unsupported encoding',async()=>{
  const t:Template=await read('apps/web/public'+catalog[0].assetUrl);
  for(const mutate of [(c:Template)=>{delete c.paintingProfile!.mediumAssets.smooth;},(c:Template)=>{c.paintingProfile!.smoothArtwork!.groups.pop();},(c:Template)=>{c.paintingProfile!.smoothArtwork!.width=100;},(c:Template)=>{delete c.paintingProfile!.smoothArtwork;}]){
   const copy=structuredClone(t);mutate(copy);expect(()=>validatePaintingProfile(copy)).toThrow();
  }
  const face:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('princess'))!.assetUrl);
  for(const mutate of [(c:Template)=>{c.paintingProfile!.smoothArtwork!.eyes!.pop();},(c:Template)=>{c.paintingProfile!.smoothArtwork!.surfaceFields!.whiteDetails=[{detailIndex:999,regionId:c.regions[0].id}];},(c:Template)=>{c.paintingProfile!.smoothArtwork!.surfaceFields!.mouths=[{regionId:c.regions[0].id}];}]){const copy=structuredClone(face);mutate(copy);expect(()=>validatePaintingProfile(copy)).toThrow();}
  for(const mutate of [(c:Template)=>{delete c.paintingProfile!.mediumAssets.skin;},(c:Template)=>{c.paintingProfile!.smoothArtwork!.skinLight!.parts[0].source.x=9999;},(c:Template)=>{c.paintingProfile!.smoothArtwork!.eyes![0].upperCreasePath='';},(c:Template)=>{delete c.paintingProfile!.mediumAssets.surface;},(c:Template)=>{c.paintingProfile!.smoothArtwork!.surfaceLight!.parts.pop();},(c:Template)=>{c.paintingProfile!.smoothArtwork!.surfaceLight!.parts[0].source.x=9999;}]){const copy=structuredClone(face);mutate(copy);expect(()=>validatePaintingProfile(copy)).toThrow();}
 });

 it('a skin-only media update invalidates the displayed smooth face and leaves crayon unchanged',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('princess'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  const skin=t.paintingProfile!.smoothArtwork!.skinLight!,neutral=createCanvas(skin.width,skin.height);neutral.getContext('2d').fillStyle='#808080';neutral.getContext('2d').fillRect(0,0,skin.width,skin.height);
  engine.loadTemplate(t);engine.setMediumImages(media);engine.resize(320,400,1);engine.paint('r07',{color:'#F2D7BD',paintType:'smooth'});const smooth=pixels(c);
  engine.setMediumImages({...media,skin:neutral as unknown as CanvasImageSource});expect(pixels(c).equals(smooth)).toBe(false);
  engine.paint('r07',{color:'#F2D7BD',paintType:'crayon'});const crayon=pixels(c);engine.setMediumImages(media);expect(pixels(c).equals(crayon)).toBe(true);engine.dispose();neutral.width=neutral.height=1;
 });

 it('the astronaut chin has continuous shading rather than the reported alternating gray bars',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('rocket'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  const old=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='space');
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:old.palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(1600),data=shot.getContext('2d')!.getImageData(0,0,1600,2000).data,face=new NativePath(t.regions.find(r=>r.id==='r14')!.path),mask=createCanvas(1600,2000).getContext('2d'),samples:number[][]=[];
  for(let x=921;x<=1003;x++){let bottom=1055;for(let y=1055;y<1110;y+=.5)if(mask.isPointInPath(face,x+.5,y))bottom=y;const p=(Math.floor(bottom-2)*1600+x)*4;samples.push([...data.slice(p,p+3)]);}
  const jumps=samples.slice(1).map((rgb,i)=>Math.max(...rgb.map((v,c)=>Math.abs(v-samples[i][c])))).sort((a,b)=>a-b);
  expect(jumps[Math.floor(jumps.length*.95)]).toBeLessThanOrEqual(6);expect(jumps.at(-1)).toBeLessThanOrEqual(9);shot.width=shot.height=mask.canvas.width=mask.canvas.height=1;engine.dispose();
 });

 it('a smooth body retains the original mouth ink while its opening is blank or crayon',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('ocean'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D}),mouth=t.paintingProfile!.smoothArtwork!.surfaceFields!.mouths!.find(m=>m.regionId==='r06')!;
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.filter(id=>id!==mouth.regionId).map(id=>[id,{color:'#2598FF',paintType:'smooth'}]))));engine.setMediumImages(media);
  const mask=createCanvas(1600,2000),m=mask.getContext('2d');m.fill(new NativePath(mouth.blankInkPath!));const ink=m.getImageData(1020,600,96,96).data;
  for(const type of [undefined,'crayon'] as const){if(type)engine.paint(mouth.regionId,{color:'#E74A91',paintType:type});const shot=engine.renderSnapshot(1600),data=shot.getContext('2d')!.getImageData(1020,600,96,96).data;let sampled=0;
   for(let p=0;p<ink.length;p+=4)if(ink[p+3]===255){expect([...data.slice(p,p+3)]).toEqual([0,0,0]);sampled++;}expect(sampled).toBeGreaterThan(30);shot.width=shot.height=1;
  }engine.dispose();mask.width=mask.height=1;
 });

 it.each([
  ['princess',[[1051,1425],[1077,1435]]],
  ['animals',[[679,1155],[671,1170]]],
  ['ocean',[[797,1030],[796,1030]]],
 ] as const)('%s keeps the mouth cavity connected at the independently reported smile gaps',async(theme,points)=>{
  const entry=catalog.find(e=>e.themeId===theme)!,t:Template=await read('apps/web/public'+entry.assetUrl),old=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme===theme);
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:old.palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!;
  for(const [x,y]of points){const rgb=[...ctx.getImageData(x,y,1,1).data.slice(0,3)];expect(rgb.reduce((sum,v)=>sum+v,0),`${theme} at ${x},${y}`).toBeLessThan(400);}
  shot.width=shot.height=1;engine.dispose();
 });

 it.each([['vehicles','r10',440,1010],['magic','r18',720,800],['space','r12',1200,1105],['construction','r10',861,510],['robots','r25',1119,1120]] as const)('%s fills the independently observed enclosed white gap only when its part is smooth',async(theme,id,x,y)=>{
  const entry=(catalog as {id:string;assetUrl:string}[]).find(e=>e.id.includes(theme==='vehicles'?'sports-car':theme==='magic'?'wizard':theme==='construction'?'excavator':theme==='robots'?'robot':'rocket'))!,t:Template=await read('apps/web/public'+entry.assetUrl);
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});engine.loadTemplate(t);
  const sample=()=>{const s=engine.renderSnapshot(1600),rgb=[...s.getContext('2d')!.getImageData(x,y,1,1).data.slice(0,3)];s.width=s.height=1;return rgb;};
  const blank=sample();expect(blank).toEqual([255,255,255]);engine.paint(id,{color:'#2598FF',paintType:'smooth'});const rgb=sample();expect(rgb[2]).toBeGreaterThan(rgb[0]);expect(rgb[0]).toBeLessThan(180);engine.paint(id,null);expect(sample()).toEqual(blank);engine.dispose();
 });

 it('the improved princess has no old ghost lid outside the newly authored brow',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('princess'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t);engine.setMediumImages(media);engine.paint('r07',{color:'#F2D7BD',paintType:'smooth'});
  const s=engine.renderSnapshot(1600),data=s.getContext('2d')!.getImageData(632,503,40,13).data,mask=createCanvas(1600,2000),ctx=mask.getContext('2d');
  for(const b of t.paintingProfile!.smoothArtwork!.surfaceFields!.brows)ctx.fill(new NativePath(b.path),'evenodd');const brow=ctx.getImageData(632,503,40,13).data;
  for(let p=0;p<data.length;p+=4)if(!brow[p+3])expect(data[p]).toBeGreaterThan(185);s.width=s.height=mask.width=mask.height=1;engine.dispose();
 });

 it('the princess lash roots do not leave the independently reported white cuts',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='princess')!.assetUrl),old=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='princess');
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:old.palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!;
  for(const [x,y]of [[831,585],[831,588],[829,599],[830,600]])expect(Math.max(...ctx.getImageData(x,y,1,1).data.slice(0,3)),`lash root at ${x},${y}`).toBeLessThan(180);
  shot.width=shot.height=1;engine.dispose();
 });

 it('a skin island isolated by a retired lid inherits skin lighting, rather than turning into a black block',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('princess'))!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const old=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='princess');
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:old.palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(1600),rgb=[...shot.getContext('2d')!.getImageData(824,621,1,1).data.slice(0,3)];
  expect(rgb[0]).toBeGreaterThan(185);expect(rgb[1]).toBeGreaterThan(130);shot.width=shot.height=1;engine.dispose();
 });

 function swatch(t:Template,color:string,type:PaintType,light:number){
  const copy=structuredClone(t),region={...copy.regions[0],id:'sample',material:'standard' as const,bounds:{x:0,y:0,width:1600,height:2000},path:'M0 0H1600V2000H0Z',direction:35};
  copy.paintingProfile!.groups=[{id:'sample',name:'sample',regionIds:['sample'],bounds:region.bounds,direction:35}];copy.paintingProfile!.eyes=[];
  copy.paintingProfile!.smoothArtwork!.width=64;copy.paintingProfile!.smoothArtwork!.height=80;
  const smooth=createCanvas(64,80),s=smooth.getContext('2d');s.fillStyle=`rgb(${light},${light},${light})`;s.fillRect(0,0,64,80);
  const tooth=createCanvas(16,16);tooth.getContext('2d').fillStyle='#fff8';tooth.getContext('2d').fillRect(2,3,2,3);
  const c=makeCanvas(160,200),ctx=c.getContext('2d')!;ctx.scale(.1,.1);
  drawStorybookFinish(ctx,region,new NativePath(region.path) as unknown as Path2D,{color,paintType:type},copy,{smooth,paper:tooth,wax:tooth,pencil:tooth} as unknown as MediumImages);
  return pixels(c);
 }
 it('new maps affect only smooth, retaining white shadows, black reflections and chosen blue/pink hue',async()=>{
  const t:Template=await read('apps/web/public'+catalog[0].assetUrl);
  for(const type of ['crayon','pencil'] as const)expect(swatch(t,'#2598FF',type,80).equals(swatch(t,'#2598FF',type,190))).toBe(true);
  const sample=(color:string,light:number)=>[...swatch(t,color,'smooth',light).subarray(4*800,4*800+3)];
  expect(sample('#FFFFFF',80)[0]).toBeLessThan(200);expect(sample('#000000',190)[0]).toBeGreaterThan(80);
  for(const light of [80,190]){const blue=sample('#2598FF',light),pink=sample('#FF4FA3',light);expect(blue[2]).toBeGreaterThan(blue[0]);expect(blue[1]).toBeGreaterThan(blue[0]);expect(pink[0]).toBeGreaterThan(pink[2]);expect(pink[2]).toBeGreaterThan(pink[1]);}
 });
 it('tints only existing ink and resolves a shared edge independent of paint order',()=>{
  const region={id:'a',material:'fabric',fillRule:'nonzero'} as Region;
  const draw=(reverse=false)=>{const c=makeCanvas(100,100),ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,100,100);const ink=new NativePath('M45 10H55V90H45Z') as unknown as Path2D;ctx.fillStyle='#000';ctx.fill(ink);
   const parts=[{region,path:new NativePath('M0 0H50V100H0Z') as unknown as Path2D,paint:{color:'#FFD42A',paintType:'smooth' as const}},{region:{...region,id:'b'},path:new NativePath('M50 0H100V100H50Z') as unknown as Path2D,paint:{color:'#2598FF',paintType:'smooth' as const}}];
   drawPigmentInk(ctx,ink,reverse?parts.reverse():parts);return pixels(c);};
  const a=draw();expect(a.equals(draw(true))).toBe(true);expect([...a.subarray((50*100+50)*4,(50*100+50)*4+3)]).not.toEqual([0,0,0]);
  expect([...a.subarray((50*100+20)*4,(50*100+20)*4+3)]).toEqual([255,255,255]);
 });
 it.each(catalog.map(e=>[e.id,e.assetUrl]))('%s surface ink keeps the original alpha exactly, without tinted pixels outside its contour',async(id,url)=>{
  const t:Template=await read('apps/web/public'+url),art=t.paintingProfile!.smoothArtwork!,fields=art.surfaceFields!;
  expect(art.ink).toBe('surface-v1');
  const ink=new NativePath();for(const d of t.details.filter(d=>d.fill==='#000000'))ink.addPath(new NativePath(d.path));
  const parts=fields.parts.map((p,i)=>{const region=t.regions.find(r=>r.id===p.regionId)!;return{region,path:new NativePath(region.path) as unknown as Path2D,field:new NativePath(p.path) as unknown as Path2D,paint:i%3?{color:i%2?'#2598FF':'#FF4FA3',paintType:'smooth' as const}:undefined};});
  for(const {scale,x,y,tile}of [...[.2,.5,1.2].map(scale=>({scale,x:320-800*scale+.37,y:400-1000*scale+.23,tile:false})),{scale:.4,x:2,y:-510,tile:true}]){
   const make=()=>{const c=makeCanvas(tile?516:640,tile?516:800);c.getContext('2d')!.setTransform(scale,0,0,scale,x,y);return c;};
   const reference=make(),actual=make();reference.getContext('2d')!.fill(ink as unknown as Path2D);
   drawSurfaceInk(actual.getContext('2d')!,ink as unknown as Path2D,parts,t,undefined,makeCanvas);
   const a=pixels(actual),b=pixels(reference);let mismatches=0,outside=0;
   for(let p=3;p<a.length;p+=4){if(a[p]!==b[p])mismatches++;if(!b[p]&&a[p])outside++;}
   expect(outside,`${id} at ${scale}`).toBe(0);expect(mismatches,`${id} at ${scale}`).toBe(0);
  }
 });
 it('invalidates cached ink on recolor, erases to the exact blank, and redraws after only the material-owned image changes',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.id.includes('sports-car'))!.assetUrl);
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t);engine.setMediumImages(media);engine.resize(320,400,1);const blank=pixels(c),id=t.paintingProfile!.groups[0].regionIds[0];
  engine.paint(id,{color:'#FF4FA3',paintType:'smooth'});const pink=pixels(c);engine.paint(id,{color:'#2598FF',paintType:'smooth'});expect(pixels(c).equals(pink)).toBe(false);
  const blue=pixels(c),surface=t.paintingProfile!.smoothArtwork!.surfaceLight!,neutral=createCanvas(surface.width,surface.height);neutral.getContext('2d').fillStyle='#808080';neutral.getContext('2d').fillRect(0,0,neutral.width,neutral.height);
  engine.setMediumImages({...media,surface:neutral as unknown as CanvasImageSource});expect(pixels(c).equals(blue)).toBe(false);
  engine.paint(id,null);expect(pixels(c).equals(blank)).toBe(true);engine.dispose();
 });
 it('uniformly painted neighboring surfaces do not expose white seams through the original antialiased ink',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='princess')!.assetUrl),c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const neutral=createCanvas(1,1);neutral.getContext('2d').fillStyle='#808080';neutral.getContext('2d').fillRect(0,0,1,1);
  const art=t.paintingProfile!.smoothArtwork!,media={paper:neutral,wax:neutral,pencil:neutral,smooth:neutral,surface:neutral,skin:neutral} as unknown as MediumImages;
  // Keep atlas coordinates valid while using a constant, neutral light field.
  for(const atlas of [art.surfaceLight!,art.skinLight!])for(const part of atlas.parts)part.source={x:0,y:0,width:1,height:1};
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:'#804020',paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(3200),ctx=shot.getContext('2d')!;
  for(const [x,y,w,h]of [[579,646,15,82],[814,654,21,57],[522,519,24,8]]){
   const rgba=ctx.getImageData(x*2,y*2,w*2,h*2).data;
   for(let p=0;p<rgba.length;p+=4)expect(Math.max(...rgba.slice(p,p+3)),`no light-colored seam near ${x},${y}`).toBeLessThanOrEqual(132);
  }
  shot.width=shot.height=neutral.width=neutral.height=1;engine.dispose();
 });
 it('a rubber joint sharing the body paint does not transfer its lighting into adjacent metal',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='robots')!.assetUrl),palette=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='robots').palette;
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const sample=()=>{const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!,result=[[825,842],[825,900]].map(([x,y])=>[...ctx.getImageData(x,y,1,1).data]);shot.width=shot.height=1;return result;};
  const before=sample(),atlas=t.paintingProfile!.smoothArtwork!.surfaceLight!,changed=makeCanvas(atlas.width,atlas.height),ctx=changed.getContext('2d')!,source=atlas.parts.find(p=>p.regionId==='r19')!.source;
  ctx.drawImage(media.surface!,0,0);ctx.fillStyle='#eeeeee';ctx.fillRect(source.x,source.y,source.width,source.height);
  engine.setMediumImages({...media,surface:changed as unknown as CanvasImageSource});const after=sample();
  expect(after[0]).not.toEqual(before[0]);expect(after[1]).toEqual(before[1]);engine.dispose();changed.width=changed.height=1;
 });
 it('an isolated tyre or fender keeps neighboring paper white at the independently reported leak positions',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='vehicles')!.assetUrl),engine=new ColoringEngine(makeCanvas(320,400),{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t);engine.setMediumImages(media);
  for(const[id,points]of [['r19',[[367,1180],[369,1180]]],['r10',[[270,850],[272,850],[260,920],[263,920]]]] as const){
   engine.setScene({regions:{[id]:{color:'#2598FF',paintType:'smooth'}}});const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!;
   for(const[x,y]of points)expect([...ctx.getImageData(x,y,1,1).data.slice(0,3)],`${id}: untouched paper at ${x},${y}`).toEqual([255,255,255]);shot.width=shot.height=1;
  }engine.dispose();
 });

 it('local tyre smoothing retains the front window material and a fully painted bonnet',async()=>{
  const t:Template=await read('apps/web/public'+catalog.find(e=>e.themeId==='vehicles')!.assetUrl),engine=new ColoringEngine(makeCanvas(320,400),{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D}),palette=(await read(`${root}/before/evidence.json`)).find((e:{theme:string})=>e.theme==='vehicles').palette;
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile!.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)]))) as unknown as MediumImages;
  engine.loadTemplate(t,Object.fromEntries(t.paintingProfile!.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:palette[g.id],paintType:'smooth'}]))));engine.setMediumImages(media);
  const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d')!,window=[...ctx.getImageData(970,700,1,1).data.slice(0,3)],bonnet=[...ctx.getImageData(1225,950,1,1).data.slice(0,3)];
  expect(window[2]).toBeGreaterThan(window[0]);expect(bonnet[0]).toBeGreaterThan(bonnet[2]+30);expect(Math.min(...bonnet)).toBeLessThan(230);shot.width=shot.height=1;engine.dispose();
 });

 it('new content fingerprints reject stale thumbnails without modifying saved arbitrary or mixed paints',async()=>{
  const current:Template=await read('apps/web/public'+catalog[0].assetUrl),old:Template=await read(`${root}/before-files/${current.paintingProfile!.upgradeFrom}.json`);
  const p=makeProject(undefined,{templateId:old.id,regions:{r01:{color:'#12ABCE',paintType:'smooth'},r02:{color:'#C4927A',paintType:'crayon'},r03:{color:'#F2D7BD',paintType:'pencil'}}}),saved=structuredClone(p);
  expect(await artworkRevision(p,{template:old,backgrounds:[],frames:[]})).not.toBe(await artworkRevision(p,{template:current,backgrounds:[],frames:[]}));expect(p).toEqual(saved);
 });
});
