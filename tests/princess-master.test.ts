import 'fake-indexeddb/auto';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D as NativePath,loadImage} from '@napi-rs/canvas';
import {beforeAll,describe,it,expect} from 'vitest';
import {ColoringEngine,paintTargets,validatePaintingProfile,type EngineCanvas,type MediumImages} from '../packages/coloring-engine/src/index';
import type {Template,RegionPaints,PaintType} from '../packages/shared-types/src/index';
import {createServices} from '../packages/persistence/src/index';
import {TestAuth,USER_A} from './sync.helpers';

const id='gen-princess-bunny-v6-master-v3';
let template:Template,media:MediumImages;
const makeCanvas=(w:number,h:number)=>createCanvas(w,h) as unknown as EngineCanvas;
const rgba=(c:EngineCanvas)=>Buffer.from(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data);
function harness(paints:RegionPaints={}){
  const canvas=makeCanvas(320,400),engine=new ColoringEngine(canvas,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  engine.loadTemplate(template,paints);engine.setMediumImages(media);engine.resize(320,400,1);return {engine,canvas};
}
beforeAll(async()=>{
  template=JSON.parse(await fs.readFile(`apps/web/public/content/templates/${id}.json`,'utf8'));
  media=Object.fromEntries(await Promise.all(Object.entries(template.paintingProfile!.mediumAssets).map(async([key,url])=>[key,await loadImage(`apps/web/public${url}`)]))) as unknown as MediumImages;
});

describe('one-princess master-derived coloring candidate',()=>{
  it('binds a private generated master to a registered achromatic map and unchanged authored regions',async()=>{
    const manifest=JSON.parse(await fs.readFile('content/princess-master/manifest.json','utf8'));
    expect(createHash('sha256').update(await fs.readFile(manifest.masterFile)).digest('hex')).toBe(template.paintingProfile!.formArtwork!.masterSha256);
    expect(manifest.normalization.offset).toEqual([128,160]);expect(manifest.normalization.imageSize).toEqual([1344,1679]);
    const old:Template=JSON.parse(await fs.readFile('apps/web/public/content/templates/gen-princess-bunny-v6-storybook-v2.json','utf8'));
    expect(template.regions).toEqual(old.regions);expect(template.details).toEqual(old.details);expect(template.paintingProfile!.groups).toEqual(old.paintingProfile!.groups);
    expect(()=>validatePaintingProfile(template)).not.toThrow();
    const form=createCanvas(2048,2560),ctx=form.getContext('2d');ctx.drawImage(media.form as never,0,0);const pixels=ctx.getImageData(0,0,2048,2560).data;
    for(let p=0;p<pixels.length;p+=4*997){expect(pixels[p]).toBe(pixels[p+1]);expect(pixels[p]).toBe(pixels[p+2]);expect(pixels[p+3]).toBe(255);}
    expect(manifest.decodedBytes+3*512*512*4).toBeLessThan(32*1024*1024);expect(template.paintingProfile!.mediumAssets.iris).toBeUndefined();
    const publicFiles=await fs.readdir('apps/web/public/content/media');expect(publicFiles.some(f=>/finished|registered-master/.test(f))).toBe(false);
    const serialized=JSON.stringify(template);expect(serialized).not.toContain('originals/');expect(serialized).not.toContain('registered-master');form.width=form.height=1;
  });
  it('rejects missing form assets, incomplete group coverage, and missing blank eye artwork',()=>{
    for(const mutate of [(t:Template)=>{delete t.paintingProfile!.mediumAssets.form;},(t:Template)=>{t.paintingProfile!.formArtwork!.groups.pop();},(t:Template)=>{t.paintingProfile!.eyes[0].artwork!.blankGuide!.radius=0;},(t:Template)=>{delete t.paintingProfile!.eyes[0].artwork!.blankInkPath;}]){const copy=structuredClone(template);mutate(copy);expect(()=>validatePaintingProfile(copy)).toThrow();}
  });
  it('paints the entire authored hair in one update, supports a single part, and preserves neighboring skin',()=>{
    const {engine}=harness(),hair=template.paintingProfile!.groups.find(g=>g.id==='g1')!,before=engine.getMetrics();
    engine.paintMany(paintTargets(template,'r08','group'),{color:'#2598FF',paintType:'pencil'});
    expect(Object.keys(engine.getPaints())).toEqual(hair.regionIds);expect(engine.getMetrics().paints-before.paints).toBe(1);expect(engine.getMetrics().frames-before.frames).toBe(1);
    expect(engine.getPaints().r07).toBeUndefined();engine.paintMany(paintTargets(template,'r08','region'),null);expect(engine.getPaints().r08).toBeUndefined();expect(engine.getPaints().r06.color).toBe('#2598FF');engine.dispose();
  });
  it('gives pure white visible shadows and pure black visible highlights without original brown pigment',()=>{
    const {engine}=harness(),hair=template.paintingProfile!.groups.find(g=>g.id==='g1')!,paths=hair.regionIds.map(id=>new NativePath(template.regions.find(r=>r.id===id)!.path)),hit=createCanvas(1,1).getContext('2d');
    for(const color of ['#FFFFFF','#000000','#00AAFF']){
      engine.paintMany(hair.regionIds,{color,paintType:'smooth'});const shot=engine.renderSnapshot(1600),data=shot.getContext('2d')!.getImageData(0,0,1600,2000).data,values:number[]=[];
      for(let y=370;y<1050;y+=8)for(let x=270;x<1020;x+=8)if(paths.some(p=>[[0,0],[5,0],[-5,0],[0,5],[0,-5]].every(([dx,dy])=>hit.isPointInPath(p,x+dx,y+dy)))){const i=(y*1600+x)*4;values.push(data[i]);if(color!=='#00AAFF'){expect(data[i]).toBe(data[i+1]);expect(data[i]).toBe(data[i+2]);}else{expect(data[i+2]).toBeGreaterThan(data[i]);expect(data[i+1]).toBeGreaterThan(data[i]);}}
      values.sort((a,b)=>a-b);expect(values.length).toBeGreaterThan(1000);if(color==='#FFFFFF'){expect(values[Math.floor(values.length*.10)]).toBeLessThan(210);expect(values[Math.floor(values.length*.90)]).toBeGreaterThan(245);}if(color==='#000000'){expect(values[Math.floor(values.length*.10)]).toBeLessThan(15);expect(values[Math.floor(values.length*.90)]).toBeGreaterThan(35);}shot.width=shot.height=1;
    }
    engine.dispose();
  });
  it('uses the early white-pupil lineart, redirects highlights, and restores exact blank pixels on erase',async()=>{
    const svg=await fs.readFile(`apps/web/public/content/templates/${id}.svg`,'utf8');expect(svg.match(/data-eye-blank-ink=/g)).toHaveLength(4);expect(svg).not.toContain('<ellipse');expect(svg).not.toContain('<circle');
    const {engine}=harness(),blank=engine.renderSnapshot(400),before=rgba(blank),eye=template.paintingProfile!.eyes[0];
    const guide=eye.artwork!.blankGuide!;expect(engine.hitTest({x:guide.cx,y:guide.cy},false)).toBe(eye.regionId);
    engine.paintMany(paintTargets(template,eye.highlightId,'group'),{color:'#2598FF',paintType:'smooth'});expect(paintTargets(template,eye.regionId,'group')).toHaveLength(2);
    engine.paintMany(paintTargets(template,eye.regionId,'region'),null);expect(engine.getPaints()[template.paintingProfile!.eyes[1].regionId]).toBeDefined();
    engine.paintMany(paintTargets(template,eye.regionId,'group'),null);const erased=engine.renderSnapshot(400);expect(rgba(erased).equals(before)).toBe(true);blank.width=blank.height=erased.width=erased.height=1;engine.dispose();
  });
  it('does not retain the painted source eyelids as dark ghost lines above the new eyes',()=>{
    const {engine}=harness();engine.paintMany(['r07'],{color:'#F2D7BD',paintType:'smooth'});const shot=engine.renderSnapshot(1600),data=shot.getContext('2d')!.getImageData(632,503,40,13).data;
    // The original ghost-lid box now intersects an explicitly authored brow.
    // Keep the same brightness criterion everywhere outside that actual shape.
    const mask=createCanvas(1600,2000),ctx=mask.getContext('2d');
    for(const brow of template.paintingProfile!.smoothArtwork?.surfaceFields?.brows??[])ctx.fill(new NativePath(brow.path),'evenodd');
    const authored=ctx.getImageData(632,503,40,13).data;
    for(let p=0;p<data.length;p+=4)if(!authored[p+3])expect(data[p]).toBeGreaterThan(185);
    mask.width=mask.height=1;
    shot.width=shot.height=1;engine.dispose();
  });
  it('keeps each material deterministic across zoom and redraw, with distinguishable fit-size results',()=>{
    const {engine}=harness(),results:Buffer[]=[];
    for(const paintType of ['smooth','crayon','pencil'] as PaintType[]){
      engine.paintMany(template.paintingProfile!.groups.find(g=>g.id==='g4')!.regionIds,{color:'#FF6AA3',paintType});const a=engine.renderSnapshot(400);results.push(rgba(a));
      engine.setViewport({scale:4,x:-430.35,y:-840.2});engine.resize(320,400,3);engine.setViewport({scale:1,x:0,y:0});const b=engine.renderSnapshot(400);expect(rgba(b).equals(rgba(a))).toBe(true);expect(engine.getMetrics().cacheBytes).toBeLessThanOrEqual(32*1024*1024);a.width=a.height=b.width=b.height=1;
    }
    expect(results[0].equals(results[1])).toBe(false);expect(results[1].equals(results[2])).toBe(false);engine.dispose();
  });
  it('copies a saved v3 work to v4, keeps mixed paints and metadata, and leaves the original untouched',async()=>{
    const app=createServices({dbName:crypto.randomUUID(),authAdapter:new TestAuth(USER_A,true),online:()=>false});
    try{await app.ready;const original=await app.projects.create({templateId:'gen-princess-bunny-v6-storybook-v2',title:'以前の姫',metadata:{renderer:'storybook-v3',paintMode:'region'}});
      const saved=await app.projects.save({...original,status:'completed',regions:{r03:{color:'#2598FF',paintType:'crayon'},r07:{color:'#F2D7BD',paintType:'pencil'}}});
      const copy=await app.projects.duplicate(saved.id,{sourceTemplateId:saved.templateId,templateId:template.id,regionMap:template.paintingProfile!.upgradeSources![saved.templateId],backgroundMap:{},frameMap:{},renderer:'storybook-v4'});
      expect(copy.id).not.toBe(saved.id);expect(copy.regions).toEqual(saved.regions);expect(copy.metadata).toMatchObject({renderer:'storybook-v4',paintMode:'group',upgradedFrom:saved.id});expect(await app.projects.get(saved.id)).toEqual(saved);expect((await app.projects.get(copy.id))?.regions).toEqual(copy.regions);
    }finally{await app.dispose();}
  });
});
