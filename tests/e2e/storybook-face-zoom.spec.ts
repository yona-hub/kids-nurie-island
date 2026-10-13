import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {test,expect,catalog,startArtwork,project} from './helpers';
import type {Template} from '../../packages/shared-types/src/index';

test('authored faces and a protected vehicle detail remain smooth at actual 2x and 4x pan with DPR3',async({browser},info)=>{
 test.skip(info.project.name!=='chromium-mobile','Bounded DPR3 rendered-face proof is recorded once.');
 const output='test-results/vector-improvement/face-zoom',measurements=[];
 mkdirSync(output,{recursive:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,locale:'ja-JP'}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 try{
  for(const [theme,name]of [['princess','おひめさま'],['magic','まほう'],['dinosaurs','きょうりゅう'],['vehicles','のりもの']]){
   const t=JSON.parse(readFileSync(`apps/web/public${catalog.find(entry=>entry.themeId===theme)!.assetUrl}`,'utf8')) as Template;
   const id=await startArtwork(page,name,0,'group'),stage=page.getByTestId('artwork');await stage.focus();
   for(const index of t.paintingProfile!.groups.keys()){if(index)await stage.press('ArrowRight');await stage.press('Enter');}
   const before=(await project(page,id)).regions;
   const eyes=t.paintingProfile!.eyes.slice(0,2).map(eye=>t.regions.find(r=>r.id===eye.regionId)!.bounds);
   const center=eyes.length?{x:eyes.reduce((sum,b)=>sum+b.x+b.width/2,0)/eyes.length,y:eyes.reduce((sum,b)=>sum+b.y+b.height/2,0)/eyes.length}:{x:1340,y:1010};
   for(const zoom of [2,4]){
    await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
    const box=(await stage.boundingBox())!,anchor={x:center.x/1600*box.width,y:center.y/2000*box.height};
    await stage.evaluate((el,args)=>{const b=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:-Math.log(args.zoom)/.0015,clientX:b.x+args.anchor.x,clientY:b.y+args.anchor.y,bubbles:true,cancelable:true}));},{zoom,anchor});
    await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.5+(box.width*.5-anchor.x),box.y+box.height*.5+(box.height*.4-anchor.y),{steps:10});await page.mouse.up();
    const actual=await stage.evaluate((el,args)=>{const v=el.querySelector<HTMLElement>('.artwork-transform')!,scale=Number(v.dataset.viewScale),x=Number(v.dataset.viewX),y=Number(v.dataset.viewY),c=el.querySelector('canvas')!;return{zoom:scale,dpr:devicePixelRatio,css:{w:el.clientWidth,h:el.clientHeight},canvas:{w:c.width,h:c.height},face:{x:args.x/1600*el.clientWidth*scale+x,y:args.y/2000*el.clientHeight*scale+y},cssTransform:getComputedStyle(v).transform};},center);
    expect(actual.zoom).toBeCloseTo(zoom,4);expect(actual.dpr).toBe(3);expect(actual.cssTransform).toBe('none');
    expect(actual.face.x).toBeGreaterThan(actual.css.w*.2);expect(actual.face.x).toBeLessThan(actual.css.w*.8);expect(actual.face.y).toBeGreaterThan(actual.css.h*.2);expect(actual.face.y).toBeLessThan(actual.css.h*.6);
    expect((await project(page,id)).regions).toEqual(before);
    const file=`${theme}-${theme==='vehicles'?'lamp':'face'}-z${zoom}-dpr3.png`;await stage.screenshot({path:`${output}/${file}`});measurements.push({templateId:t.id,file,...actual});
   }
  }
  expect(errors).toEqual([]);writeFileSync(`${output}/measurements.json`,JSON.stringify({measurements,errors},null,2));
 }finally{await context.close();}
});
