import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {test,expect,home,startArtwork,project,catalog,noHorizontalOverflow} from './helpers';
import type {Template} from '../../packages/shared-types/src/index';
const out='test-results/vector-improvement/browser';
const themes:Record<string,string>={princess:'おひめさま',magic:'まほう',animals:'どうぶつ',ocean:'うみ',dinosaurs:'きょうりゅう',vehicles:'のりもの',construction:'はたらくくるま',robots:'ロボット',space:'うちゅう',flowers:'おはな'};
const template=(id:string)=>JSON.parse(readFileSync(`apps/web/public/content/templates/${id}.json`,'utf8')) as Template;
function point(t:Template,id:string){const r=t.regions.find(x=>x.id===id)!,ctx=createCanvas(1,1).getContext('2d'),path=new Path2D(r.path);for(const count of [1,4,8,16])for(let y=0;y<count;y++)for(let x=0;x<count;x++){const p={x:r.bounds.x+(x+.5)/count*r.bounds.width,y:r.bounds.y+(y+.5)/count*r.bounds.height};if(ctx.isPointInPath(path,p.x,p.y,r.fillRule??'nonzero'))return p;}throw Error(`no point ${id}`);}
async function tap(page:import('@playwright/test').Page,t:Template,id:string){const p=point(t,id),box=(await page.getByTestId('artwork').boundingBox())!;await page.mouse.click(box.x+p.x/1600*box.width,box.y+p.y/2000*box.height);}
test('compact home embeds curved readable labels and shows at least eight islands at 390×844',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await home(page);expect(await page.locator('.home-intro').count()).toBe(0);expect(await page.locator('.island-title,.island-water').count()).toBe(0);await expect(page.locator('.island-lettering textPath')).toHaveCount(12);
 const visible=await page.locator('.island-card').evaluateAll(elements=>elements.filter(e=>e.getBoundingClientRect().bottom<=innerHeight).length);expect(visible).toBeGreaterThanOrEqual(8);await noHorizontalOverflow(page);mkdirSync(out,{recursive:true});await page.screenshot({path:`${out}/home-${info.project.name}.png`,fullPage:true});await page.setViewportSize({width:320,height:740});await noHorizontalOverflow(page);
 expect(await page.locator('.storybook-home .app-footer').count()).toBe(0);
 const lettering=await page.locator('.island-lettering').evaluateAll(elements=>elements.map(element=>{const b=element.querySelector('text')!.getBBox();return {z:Number(getComputedStyle(element).zIndex),imageZ:Number(getComputedStyle(element.parentElement!.querySelector('img')!).zIndex),bounds:{width:b.width,height:b.height}};}));
 expect(lettering.every(label=>label.z>label.imageZ&&label.bounds.width>50&&label.bounds.height>20)).toBe(true);
});
test('wizard skin and princess hair group by anatomy; region mode and erase survive reload',async({page},info)=>{
 mkdirSync(out,{recursive:true});
 for(const theme of ['magic','princess']){const t=template(catalog.find(x=>x.themeId===theme)!.id),id=await startArtwork(page,themes[theme],0,'group');await expect(page.getByRole('button',{name:'まとめて',exact:true})).toHaveAttribute('aria-pressed','true');
  const group=t.paintingProfile!.groups.find(g=>g.name.includes(theme==='magic'?'肌':'髪'))!;
  await page.getByRole('button',{name:'クレヨン',exact:true}).click();await tap(page,t,group.regionIds[0]);await expect.poll(async()=>Object.keys((await project(page,id)).regions).length).toBe(group.regionIds.length);for(const r of group.regionIds)expect((await project(page,id)).regions[r].paintType).toBe('crayon');
  await page.getByRole('button',{name:'こまかく',exact:true}).click();await page.getByRole('button',{name:'けす',exact:true}).click();await tap(page,t,group.regionIds[0]);await expect.poll(async()=>(await project(page,id)).regions[group.regionIds[0]]).toBeUndefined();expect(Object.keys((await project(page,id)).regions)).toHaveLength(group.regionIds.length-1);
  await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'こまかく',exact:true})).toHaveAttribute('aria-pressed','true');expect(Object.keys((await project(page,id)).regions)).toHaveLength(group.regionIds.length-1);
  await page.getByRole('button',{name:'まとめて',exact:true}).click();await page.getByRole('button',{name:'けす',exact:true}).click();await tap(page,t,group.regionIds.at(-1)!);await expect.poll(async()=>Object.keys((await project(page,id)).regions).length).toBe(0);
  await page.getByRole('button',{name:'むらさきのしま',exact:true}).click();await page.getByRole('button',{name:'いろえんぴつ',exact:true}).click();await tap(page,t,group.regionIds[0]);await page.screenshot({path:`${out}/${theme}-group-${info.project.name}.png`,fullPage:true});
 }
});
test('all ten templates at 1/2/4x and DPR1/2/3 use native viewport pixels',async({browser},info)=>{
 test.skip(info.project.name!=='chromium-mobile','The 90-view DPR matrix runs once in Chromium mobile; other projects exercise the same templates and PNG rules.');test.setTimeout(240_000);mkdirSync(out,{recursive:true});const measurements=[];
 for(const dpr of [1,2,3]){const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,locale:'ja-JP'}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  try{for(const entry of catalog){const t=template(entry.id);await startArtwork(page,themes[t.themeId],0,'group');
   const stage=page.getByTestId('artwork');await stage.focus();const groups=t.paintingProfile!.groups;
   for(let index=0;index<groups.length;index++){if(index)await stage.press('ArrowRight');await stage.press('Enter');}
   for(const zoom of [1,2,4]){await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
    if(zoom!==1)await stage.evaluate((el,z)=>{const b=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:-Math.log(z)/.0015,clientX:b.x+b.width/2,clientY:b.y+b.height/2,bubbles:true,cancelable:true}));},zoom);
    const actual=await stage.evaluate(el=>{const c=el.querySelector('canvas')!,transform=el.querySelector<HTMLElement>('.artwork-transform')!;return {width:c.width,height:c.height,cssWidth:el.clientWidth,cssHeight:el.clientHeight,scale:Number(transform.dataset.viewScale),cssTransform:getComputedStyle(transform).transform};});
    expect(actual.scale).toBeCloseTo(zoom,4);expect(actual.width).toBe(Math.round(actual.cssWidth*dpr));expect(actual.height).toBe(Math.round(actual.cssHeight*dpr));expect(actual.cssTransform).toBe('none');
    await stage.screenshot({path:`${out}/${t.themeId}-z${zoom}-dpr${dpr}.png`});measurements.push({templateId:t.id,dpr,zoom,...actual});
   }
   // Fractional zoom, a real pointer pan and returning to fit must not paint or
   // leave a magnified bitmap behind. Preserve the same saved region values.
   const before=(await project(page)).regions;
   await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
   await stage.evaluate(el=>{const b=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:-Math.log(1.7)/.0015,clientX:b.x+b.width/2,clientY:b.y+b.height/2,bubbles:true,cancelable:true}));});
   const box=(await stage.boundingBox())!;await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4,{steps:8});await page.mouse.up();
   await expect.poll(async()=>Object.keys((await project(page)).regions).length).toBe(Object.keys(before).length);expect((await project(page)).regions).toEqual(before);
   await stage.screenshot({path:`${out}/${t.themeId}-fractional-pan-dpr${dpr}.png`});await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();await expect(stage.locator('.artwork-transform')).toHaveAttribute('data-view-scale','1');
   await stage.screenshot({path:`${out}/${t.themeId}-return-fit-dpr${dpr}.png`});
  }expect(errors).toEqual([]);}finally{await context.close();}
 }
 expect(measurements).toHaveLength(90);writeFileSync(`${out}/viewport-matrix.json`,JSON.stringify({recordedAt:new Date().toISOString(),measurements},null,2));
});
