import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D as NativePath} from '@napi-rs/canvas';
import {it,expect} from 'vitest';
import {ColoringEngine,constrainViewport,screenToLogical,type EngineCanvas} from '../packages/coloring-engine/src/index';
import type {Template} from '../packages/shared-types/src/index';
it('measures the NEW faceless source narrow parts at 4x without transferring any old width exception',async()=>{
 const dir='content/vector-generated/faceless-source',bytes=await fs.readFile(`${dir}/template.json`),template=JSON.parse(bytes.toString()) as Template,qa=JSON.parse(await fs.readFile(`${dir}/qa.json`,'utf8'));
 const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
 const native=(w:number,h:number)=>createCanvas(w,h) as unknown as EngineCanvas,c=native(688,860),engine=new ColoringEngine(c,{createCanvas:native,createPath:p=>new NativePath(p) as unknown as Path2D});
 // A test-only copy does not approve the source or publish it.
 engine.loadTemplate({...template,approved:true});engine.resize(344,430,2);
 const regions=[];
 for(const metric of qa.regions.filter((r:{usableDiameter:number})=>r.usableDiameter<24)){
  const r=template.regions.find(r=>r.id===metric.id)!,p={x:metric.labelPoint[0],y:metric.labelPoint[1]},size={width:344,height:430};
  const viewport=constrainViewport({scale:4,x:172-p.x*344/1600*4,y:215-p.y*430/2000*4},size);engine.setViewport(viewport);
  const screen={x:Math.round(p.x*344/1600*4+viewport.x),y:Math.round(p.y*430/2000*4+viewport.y)},actual=screenToLogical(screen,viewport,size);
  const hitAtZoom4=engine.hitTest(actual,false)===r.id&&engine.hitTest(actual,true)===r.id;
  // Legacy source QA uses a fit-sized backing Canvas with external CSS zoom.
  // Its display pixel is at the logical point, not at the viewport center.
  const pixel=()=>[...c.getContext('2d')!.getImageData(Math.floor(p.x*c.width/1600),Math.floor(p.y*c.height/2000),1,1).data],blank=pixel();
  engine.paint(r.id,{color:'#DE246D',paintType:'smooth'},actual,true);const color=pixel(),painted=engine.getPaints()[r.id]?.color==='#DE246D'&&color[0]>color[1]+55&&color[2]>color[1]+25;
  engine.paint(r.id,null,actual,true);const erased=engine.getPaints()[r.id]===undefined&&JSON.stringify(pixel())===JSON.stringify(blank);
  regions.push({id:r.id,pathSha256:hash(r.path),usableDiameter:metric.usableDiameter,screenDiameterAtZoom4:metric.usableDiameter*344/1600*4,screen,actual,hitAtZoom4,painted,erased,blank,paintedPixel:color});
 }
 const evidence={measuredAt:new Date().toISOString(),templateId:template.id,originalSha256:qa.originalSha256,templateSha256:hash(bytes),method:'New raster-source geometry only; real legacy ColoringEngine with fit-sized backing Canvas/external CSS zoom. Constrained 4x pointer transform, integer CSS tap round-trip, direct/assisted hit, logical backing Canvas color and exact erase comparison. The NEW v3 viewport renderer is checked separately. Automated narrow-target reachability, not physical-device or child usability evidence.',regions,pass:regions.every(r=>r.hitAtZoom4&&r.painted&&r.erased)};
 await fs.writeFile(`content/generated-lineart/interaction/${template.id}.json`,JSON.stringify(evidence,null,2)+'\n');
 expect(regions).toHaveLength(5);expect(evidence.pass).toBe(true);expect(hash(await fs.readFile(`${dir}/template.json`))).toBe(qa.templateSha256);engine.dispose();
});
