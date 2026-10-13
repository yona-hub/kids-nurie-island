import fs from 'node:fs/promises';
import {createCanvas,Path2D as NativePath,loadImage,GlobalFonts,type Canvas} from '@napi-rs/canvas';
import {describe,it,expect,beforeAll} from 'vitest';
import {ColoringEngine,applyPaints,paintTargets,validatePaintingProfile,type EngineCanvas} from '../packages/coloring-engine/src/index';
import type {Template,RegionPaints,PaintType} from '../packages/shared-types/src/index';
import type {MediumImages} from '../packages/coloring-engine/src/storybook-texture';

const directory='test-results/princess-master/regression-native';
let templates:Template[],media:MediumImages;
const nativeCanvas=(w:number,h:number)=>{const c=createCanvas(w,h),convert=c.convertToBlob.bind(c);const engineCanvas=c as unknown as EngineCanvas;engineCanvas.convertToBlob=options=>convert({mime:options?.type,quality:options?.quality});return engineCanvas;};
function harness(t:Template,paints:RegionPaints={}){
 const c=nativeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:nativeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
 engine.loadTemplate(t,paints);engine.setMediumImages(media);engine.resize(320,400,1);return {engine,c};
}
beforeAll(async()=>{
 await fs.mkdir(directory,{recursive:true});GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');
 const catalog=JSON.parse(await fs.readFile('apps/web/public/content/catalog.json','utf8'));
 templates=await Promise.all(catalog.map((t:{assetUrl:string})=>fs.readFile(`apps/web/public${t.assetUrl}`,'utf8').then(x=>JSON.parse(x))));
 const urls=templates[0].paintingProfile!.mediumAssets;
 media=Object.fromEntries(await Promise.all(Object.entries(urls).map(async([key,url])=>[key,await loadImage(`apps/web/public${url}`)]))) as unknown as MediumImages;
});
const paintsFor=(t:Template,paintType:PaintType):RegionPaints=>Object.fromEntries(t.regions.filter(r=>!t.paintingProfile!.eyes.some(e=>e.highlightId===r.id)).map(r=>[r.id,{color:t.paintingProfile!.eyes.some(e=>e.regionId===r.id)?'#2598FF':({skin:'#F2D7BD',hair:'#A66134',fur:'#FFC7DE',fabric:'#8445D8',metal:'#FFC400',glass:'#7AC3FF',plastic:'#7AC3FF',wood:'#BA7A4B',rubber:'#59616D',stone:'#B9BEC6'} as Record<string,string>)[r.material]??'#FFC400',paintType}]));
describe('storybook semantic painting and generated physical media',()=>{
 it('validates all ten authored profiles, protects anatomy boundaries, redirects automatic highlights and erases atomically',()=>{
  for(const t of templates){expect(()=>validatePaintingProfile(t)).not.toThrow();const profile=t.paintingProfile!;const ids=profile.groups.flatMap(g=>g.regionIds);expect(new Set(ids).size).toBe(t.regions.length-profile.eyes.length);}
  const wizard=templates.find(t=>t.themeId==='magic')!,skin=wizard.paintingProfile!.groups.find(g=>g.name.includes('肌'))!;
  expect(skin.regionIds).toEqual(['r06','r09','r17','r20','r28','r33']);
  expect(paintTargets(wizard,'r06','group')).toEqual(skin.regionIds);expect(paintTargets(wizard,'r06','region')).toEqual(['r06']);
  const {engine}=harness(wizard),before=engine.getMetrics();engine.paintMany(paintTargets(wizard,'r06','group'),{color:'#F2D7BD',paintType:'pencil'});
  expect(Object.keys(engine.getPaints())).toEqual(skin.regionIds);expect(engine.getMetrics().paints-before.paints).toBe(1);expect(engine.getMetrics().frames-before.frames).toBe(1);
  const eye=wizard.paintingProfile!.eyes[0];expect(paintTargets(wizard,eye.highlightId,'group')).toHaveLength(2);expect(paintTargets(wizard,eye.highlightId,'region')).toEqual([eye.regionId]);
  const unchanged=engine.getPaints();expect(()=>engine.paintMany([...skin.regionIds,'missing'],null)).toThrow();expect(engine.getPaints()).toEqual(unchanged);
  engine.paintMany(skin.regionIds,null);expect(engine.getPaints()).toEqual({});expect(applyPaints(unchanged,skin.regionIds,null)).toEqual({});engine.dispose();
 });
 it('keeps generated texture stable across repeated draws, scales and PNG export; media are visibly distinct',async()=>{
  const sheet=createCanvas(1200,1150),ctx=sheet.getContext('2d');ctx.fillStyle='#eef5f6';ctx.fillRect(0,0,1200,1150);ctx.font='22px "Review Japanese"';
  const samples=[];
  for(const [row,theme]of ['princess','magic'].entries())for(const [column,paintType]of (['smooth','crayon','pencil'] as const).entries()){
   const t=templates.find(t=>t.themeId===theme)!,{engine}=harness(t,paintsFor(t,paintType));const a=engine.renderSnapshot(400),b=engine.renderSnapshot(400);
   const pixels=(canvas:EngineCanvas)=>Buffer.from(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data);
   expect(pixels(a).equals(pixels(b))).toBe(true);samples.push(pixels(a));
   ctx.drawImage(a as unknown as Canvas,column*400+10,row*560+45,380,475);ctx.fillStyle='#365865';ctx.fillText(['なめらか','クレヨン','いろえんぴつ'][column],column*400+50,row*560+30);
   await fs.writeFile(`${directory}/${theme}-${paintType}-2048.png`,Buffer.from(await (await engine.exportPng()).arrayBuffer()));
   a.width=b.width=1;a.height=b.height=1;engine.dispose();
  }
  expect(samples[0].equals(samples[1])).toBe(false);expect(samples[1].equals(samples[2])).toBe(false);
  await fs.writeFile(`${directory}/three-media-review.png`,sheet.toBuffer('image/png'));
 });
 it('draws all ten at 1/2/4x and DPR 1/2/3, without excess error at tile boundaries',async()=>{
  for(const t of templates){const {engine,c}=harness(t,paintsFor(t,'pencil'));
   for(const dpr of [1,2,3])for(const zoom of [1,2,4]){engine.resize(320,400,dpr);engine.setViewport({scale:zoom,x:0,y:0});expect(c.width).toBe(320*dpr);expect(engine.getMetrics().cacheBytes).toBeLessThanOrEqual(32*1024*1024);}
   engine.resize(640,800,1);engine.setViewport({scale:1,x:0,y:0});const direct=engine.renderSnapshot(640);
   const a=c.getContext('2d')!.getImageData(0,0,640,800).data,b=direct.getContext('2d')!.getImageData(0,0,640,800).data;
   let seamError=0,seamSamples=0,controlError=0,controlSamples=0,otherError=0,otherSamples=0;
   for(let y=0;y<800;y++)for(let x=0;x<640;x++)for(let channel=0;channel<3;channel++){const error=Math.abs(a[(y*640+x)*4+channel]-b[(y*640+x)*4+channel]);if(Math.abs(x-512)<2||Math.abs(y-512)<2){seamError+=error;seamSamples++;}else{otherError+=error;otherSamples++;}if([506,518].some(p=>Math.abs(x-p)<2||Math.abs(y-p)<2)){controlError+=error;controlSamples++;}}
   // Compare with nearby strips of the SAME artwork. A mostly-white whole page
   // suppresses the AA reference when a track's curved ink happens to sit on 512.
   // The original absolute full-image error ceiling is still enforced below.
   const evidence={templateId:t.id,seamAverage:seamError/seamSamples,adjacentAverage:controlError/controlSamples,otherAverage:otherError/otherSamples};
   await fs.writeFile(`${directory}/${t.themeId}-tile-equivalence.json`,JSON.stringify(evidence,null,2)+'\n');
   expect(evidence.seamAverage,`${t.id}: excess tile seam error`).toBeLessThan(Math.max(.4,evidence.adjacentAverage*2));
   expect(otherError/otherSamples,`${t.id}: render equivalence`).toBeLessThan(.5);
   await fs.writeFile(`${directory}/${t.themeId}-native-tiles.png`,Buffer.from(await (await c.convertToBlob!({type:'image/png'})).arrayBuffer()));
   direct.width=direct.height=1;engine.dispose();
  }
 });
 it('preserves automatic eye reflection for black, blue and pale colors, and clears it on erase',async()=>{
  const t=templates.find(t=>t.themeId==='princess')!,eye=t.paintingProfile!.eyes[0],region=t.regions.find(r=>r.id===eye.regionId)!;
  const sheet=createCanvas(900,310),ctx=sheet.getContext('2d');ctx.fillStyle='#eff6f7';ctx.fillRect(0,0,900,310);
  const {engine}=harness(t),blank=engine.renderSnapshot(400),blankPixels=Buffer.from(blank.getContext('2d')!.getImageData(0,0,400,500).data);
  const faceSheet=createCanvas(1440,780),face=faceSheet.getContext('2d');face.fillStyle='#eff6f7';face.fillRect(0,0,1440,780);face.font='18px "Review Japanese"';
  for(const [i,color]of [undefined,'#E74A91','#8F542E','#2598FF'].entries()){
   engine.setScene({regions:color?{...paintsFor(t,'smooth'),...Object.fromEntries(t.paintingProfile!.eyes.map(e=>[e.regionId,{color,paintType:'smooth'}]))}:{}});
   const full=engine.renderSnapshot(1600);face.drawImage(full as unknown as Canvas,i*360+10,40,340,425);face.drawImage(full as unknown as Canvas,470,350,420,370,i*360+20,490,310,273);face.fillStyle='#345762';face.fillText(color??'未着色',i*360+20,25);full.width=full.height=1;
  }
  await fs.writeFile(`${directory}/princess-eye-states.png`,faceSheet.toBuffer('image/png'));
  engine.setScene({regions:{}});
  for(const [i,color]of ['#000000','#2598FF','#FFF4BF'].entries()){
   engine.paintMany(paintTargets(t,eye.regionId,'group'),{color,paintType:'smooth'});const snapshot=engine.renderSnapshot(1600),b=region.bounds;
   ctx.drawImage(snapshot as unknown as Canvas,b.x-12,b.y-12,b.width+24,b.height+24,i*300+20,20,260,270);
   const b0=new NativePath(eye.artwork!.reflections[0].path).computeTightBounds(),point={x:(b0[0]+b0[2])/2,y:(b0[1]+b0[3])/2};
   const sample=snapshot.getContext('2d')!.getImageData(Math.round(point.x),Math.round(point.y),1,1).data;expect(sample[0]).toBeGreaterThan(240);
   const pupil=eye.artwork!.pupil,center=snapshot.getContext('2d')!.getImageData(Math.round(pupil.cx),Math.round(pupil.cy),1,1).data;
   expect(Math.max(...center.slice(0,3)),`${color}: near-black tinted pupil`).toBeLessThan(48);
   snapshot.width=snapshot.height=1;
  }
  engine.paintMany(paintTargets(t,eye.regionId,'group'),null);expect(engine.getPaints()).toEqual({});const erased=engine.renderSnapshot(400);expect(Buffer.from(erased.getContext('2d')!.getImageData(0,0,400,500).data).equals(blankPixels)).toBe(true);blank.width=blank.height=erased.width=erased.height=1;engine.dispose();await fs.writeFile(`${directory}/eye-review.png`,sheet.toBuffer('image/png'));
 });
 it('all 20 authored eyes enclose the old highlight location; every selectable region remains hittable and paintable',async()=>{
  const sheet=createCanvas(1500,20*135),ctx=sheet.getContext('2d');ctx.fillStyle='#eef5f6';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='13px "Review Japanese"';
  let row=0;
  for(const t of templates){const {engine}=harness(t);
   for(const r of t.regions.filter(r=>!t.paintingProfile!.eyes.some(e=>e.highlightId===r.id))){const point=engine.getRegionPoint(r.id);expect(point,`${t.id}/${r.id}: selectable`).not.toBeNull();expect(engine.hitTest(point!,false)).toBe(r.id);engine.paintMany([r.id],{color:'#4EAEFF',paintType:'pencil'});expect(engine.getPaints()[r.id].paintType).toBe('pencil');engine.paintMany([r.id],null);}
   const allEyes=t.paintingProfile!.eyes.map(e=>e.regionId);
   for(const eye of t.paintingProfile!.eyes){const highlight=t.regions.find(r=>r.id===eye.highlightId)!,p={x:highlight.bounds.x+highlight.bounds.width/2,y:highlight.bounds.y+highlight.bounds.height/2};expect(engine.hitTest(p,false),`${t.id}/${eye.regionId}: legacy highlight redirects`).toBe(eye.regionId);}
   for(const [column,color]of ['#000000','#8F542E','#2598FF','#E74A91','#FFF4BF'].entries()){
    engine.paintMany(allEyes,{color,paintType:'smooth'});const snapshot=engine.renderSnapshot(1600);
    for(const [index,eye]of t.paintingProfile!.eyes.entries()){const b=t.regions.find(r=>r.id===eye.regionId)!.bounds;ctx.drawImage(snapshot as unknown as Canvas,b.x-5,b.y-5,b.width+10,b.height+10,column*300+140,(row+index)*135+6,110,110);ctx.fillStyle='#345762';ctx.fillText(`${t.themeId}/${eye.regionId}`,column*300+8,(row+index)*135+27);ctx.fillText(color,column*300+8,(row+index)*135+50);}
    snapshot.width=snapshot.height=1;
   }
   row+=allEyes.length;engine.dispose();
  }
  expect(row).toBe(20);await fs.writeFile(`${directory}/all-eyes-review.png`,sheet.toBuffer('image/png'));
 });
});
