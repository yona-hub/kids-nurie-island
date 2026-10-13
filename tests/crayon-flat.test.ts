import fs from 'node:fs';
import {createCanvas,Path2D as NativePath} from '@napi-rs/canvas';
import {describe,it,expect} from 'vitest';
import {ColoringEngine,type EngineCanvas} from '../packages/coloring-engine/src/index';
import {drawStorybookFinish,type MediumImages} from '../packages/coloring-engine/src/storybook-texture';
import type {MaterialType,PaintType,Template} from '../packages/shared-types/src/index';

const template=JSON.parse(fs.readFileSync('apps/web/public/content/templates/gen-princess-bunny-v6-master-v3.json','utf8')) as Template;
const bytes=(c:EngineCanvas)=>Buffer.from(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data);
function sample(version:3|4,paintType:PaintType,material:MaterialType,light:string,curves:boolean){
 const t=structuredClone(template),region={...t.regions[0],id:'sample',material,bounds:{x:0,y:0,width:1600,height:2000},path:'M0 0H1600V2000H0Z',direction:35};
 t.paintingProfile!.version=version;t.paintingProfile!.eyes=[];
 t.paintingProfile!.groups=[{id:'sample',name:'sample',regionIds:[region.id],bounds:region.bounds,direction:35,...(curves?{shading:{kind:'hair' as const,curves:[[0,.2,.3,.3,.6,.2,1,.4]]}}:{})}];
 t.paintingProfile!.formArtwork!.width=64;t.paintingProfile!.formArtwork!.height=64;
 const form=createCanvas(64,64);form.getContext('2d').fillStyle=light;form.getContext('2d').fillRect(0,0,64,64);
 const tooth=createCanvas(32,32),grain=tooth.getContext('2d');grain.fillStyle='#ffffff80';grain.fillRect(3,4,3,2);grain.fillRect(20,16,2,3);
 const media={form,paper:tooth,wax:tooth,pencil:tooth} as unknown as MediumImages;
 const c=createCanvas(160,200),ctx=c.getContext('2d');ctx.scale(.1,.1);
 drawStorybookFinish(ctx as unknown as CanvasRenderingContext2D,region,new NativePath(region.path) as unknown as Path2D,{color:'#886644',paintType},t,media);
 return Buffer.from(ctx.getImageData(0,0,160,200).data);
}

describe('I32 crayon pigment without automatic form lighting',()=>{
 it.each([3,4] as const)('ignores material lights, fold curves and form maps in profile v%s while preserving grain',version=>{
  const reference=sample(version,'crayon','standard','#000000',false);
  for(const material of ['skin','hair','fabric','metal','glass','plastic','fur','wood','stone'] as const){
   expect(sample(version,'crayon',material,'#ffffff',true).equals(reference),material).toBe(true);
  }
  const colors=new Set<string>();for(let p=0;p<reference.length;p+=4)colors.add(reference.subarray(p,p+3).toString('hex'));
  expect(colors.size,'wax and paper tooth must not become a solid fill').toBeGreaterThan(5);
 });
 it.each(['smooth','pencil'] as const)('retains the authored form lighting for %s',paintType=>{
  expect(sample(4,paintType,'hair','#000000',true).equals(sample(4,paintType,'hair','#ffffff',true))).toBe(false);
 });
 it('retains automatic colored eyes and the exact blank-eye return on crayon erase',()=>{
  const makeCanvas=(w:number,h:number)=>createCanvas(w,h) as unknown as EngineCanvas;
  const c=makeCanvas(320,400),engine=new ColoringEngine(c,{createCanvas:makeCanvas,createPath:p=>new NativePath(p) as unknown as Path2D});
  engine.loadTemplate(template);engine.resize(320,400,1);
  const render=()=>{const shot=engine.renderSnapshot(320),pixels=bytes(shot);shot.width=shot.height=1;return pixels;};
  const blank=render(),eyes=template.paintingProfile!.eyes.map(e=>e.regionId);
  engine.paintMany(eyes,{color:'#2598FF',paintType:'crayon'});const crayon=render();
  expect(crayon.equals(blank)).toBe(false);
  const before=JSON.parse(fs.readFileSync(`test-results/smooth-home-i34/revision-1/before-files/${template.id}.json`,'utf8')) as Template;
  engine.loadTemplate(before);engine.paintMany(eyes,{color:'#2598FF',paintType:'crayon'});expect(render().equals(crayon)).toBe(true);
  engine.loadTemplate(template);engine.paintMany(eyes,{color:'#2598FF',paintType:'crayon'});
  engine.paintMany(eyes,null);expect(render().equals(blank)).toBe(true);engine.dispose();
 });
});
