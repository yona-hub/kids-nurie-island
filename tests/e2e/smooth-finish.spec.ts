import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {Page} from '@playwright/test';
import {COLOR_FAMILIES,THEMES} from '../../packages/content-schema/src/index';
import type {Template} from '../../packages/shared-types/src/index';
import {test,expect,startArtwork,project,catalog,settleAnimations,tapRegion} from './helpers';

const root=process.env.SMOOTH_EVIDENCE_OUTPUT??'test-results/smooth-home-i33/revision-1';
const palettes=JSON.parse(readFileSync(root+'/before/evidence.json','utf8')) as {theme:string;palette:Record<string,string>}[];
const rgb=(hex:string)=>{const n=parseInt(hex.slice(1),16);return[n>>>16,(n>>>8)&255,n&255];};
function choice(color:string){const target=rgb(color);return COLOR_FAMILIES.flatMap(f=>f.colors.map((hex,index)=>({family:f.name,index,hex,distance:rgb(hex).reduce((n,v,i)=>n+(v-target[i])**2,0)}))).sort((a,b)=>a.distance-b.distance)[0];}
async function fill(page:Page,t:Template,custom?:Record<string,string>){
 const palette={...palettes.find(p=>p.theme===t.themeId)!.palette,...custom},stage=page.getByTestId('artwork'),expected:Record<string,{color:string;paintType:'smooth'}>={};
 for(const [i,g]of t.paintingProfile!.groups.entries()){
  const c=choice(palette[g.id]);await page.getByRole('button',{name:`${c.family}のしま`,exact:true}).click();await page.locator('.shades button').nth(c.index).click();
  await stage.focus();if(i)await stage.press('ArrowRight');await stage.press('Enter');for(const id of g.regionIds)expected[id]={color:c.hex,paintType:'smooth'};
 }
 await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();return expected;
}
async function zoom(page:Page,t:Template,scale:number,focus?:{cx:number;cy:number}){
 const stage=page.getByTestId('artwork');await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
 const g=focus??t.paintingProfile!.eyes[0]?.geometry??{cx:800,cy:1000},b=(await stage.boundingBox())!,anchor={x:g.cx/1600*b.width,y:g.cy/2000*b.height};
 await stage.evaluate((el,a)=>{const b=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:-Math.log(a.scale)/.0015,clientX:b.x+a.anchor.x,clientY:b.y+a.anchor.y,bubbles:true,cancelable:true}));},{scale,anchor});
 if(scale>1){await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+b.width*.5-anchor.x+.37,b.y+b.height*.5+b.height*.4-anchor.y+.23,{steps:6});await page.mouse.up();}
 return stage.evaluate(el=>{const v=el.querySelector<HTMLElement>('.artwork-transform')!,c=el.querySelector('canvas')!;return {scale:Number(v.dataset.viewScale),dpr:devicePixelRatio,width:c.width,height:c.height,cssWidth:el.clientWidth,cssHeight:el.clientHeight,transform:getComputedStyle(v).transform};});
}

test('I34 Chrome contour neighborhoods at zoom4 DPR2 retain the reported face, glass, neck, tyre and stem edges',async({browser})=>{
 test.setTimeout(360_000);const out=root+'/browser-contours';mkdirSync(out,{recursive:true});const evidence=[];
 const focuses:Record<string,[string,number,number][]>= {princess:[['ear-cheek',680,590]],magic:[['chin',780,780]],construction:[['window-left',800,1000],['window-right',980,1000]],robots:[['neck',840,840]],vehicles:[['tyre',465,1030],['hood',1120,940]],flowers:[['stems-left',730,1070],['stems-right',910,1070]]};
 for(const [themeId,points]of Object.entries(focuses)){
  const context=await browser.newContext({viewport:{width:1200,height:1000},deviceScaleFactor:2}),page=await context.newPage();
  try{
   const entry=catalog.find(e=>e.themeId===themeId)!,t=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template,theme=THEMES.find(th=>th.id===themeId)!;
   const id=await startArtwork(page,theme.name,0,'group'),expected=await fill(page,t);await expect.poll(async()=>(await project(page,id)).regions).toEqual(expected);
   for(const [name,cx,cy]of points){const view=await zoom(page,t,4,{cx,cy});expect(view.scale).toBeCloseTo(4,4);expect(view.dpr).toBe(2);expect(view.transform).toBe('none');const file=`${themeId}-${name}-z4-dpr2.png`;await page.getByTestId('artwork').screenshot({path:out+'/'+file});evidence.push({file,theme:themeId,templateId:t.id,focus:{cx,cy},...view});}
   expect((await project(page,id)).regions).toEqual(expected);
  }finally{await context.close();}
 }
 writeFileSync(out+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
});

for(const entry of catalog)test(`I33 smooth ${entry.themeId}: actual choices, reload, finish, thumbnail and PNG`,async({page},info)=>{
 test.setTimeout(120_000);
 const t=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template,theme=THEMES.find(th=>th.id===entry.themeId)!;
 const out=`${root}/${info.project.name}/${entry.themeId}`;mkdirSync(out,{recursive:true});
 const id=await startArtwork(page,theme.name,0,'group'),stage=page.getByTestId('artwork'),canvas=stage.locator('canvas');
 const expected=await fill(page,t);await expect.poll(async()=>(await project(page,id)).regions).toEqual(expected);
 await settleAnimations(page);await page.screenshot({path:out+'/editor.png',fullPage:true});await stage.screenshot({path:out+'/fit.png'});
 const before=await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL());await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 expect((await project(page,id)).regions).toEqual(expected);await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(before);
 await page.getByRole('button',{name:'完成',exact:true}).click();await expect(page.getByRole('region',{name:'さくひんのしあげ'})).toBeVisible();await settleAnimations(page);await page.screenshot({path:out+'/finish.png',fullPage:true});
 await page.getByRole('button',{name:'さくひんへ',exact:true}).click();const pngButton=page.getByRole('button',{name:'PNG保存',exact:true});await expect(pngButton).toBeEnabled();
 const download=page.waitForEvent('download');await pngButton.click();await(await download).saveAs(out+'/actual-ui-export.png');const png=readFileSync(out+'/actual-ui-export.png');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([2048,2560]);
 await page.goto('/#/gallery');const thumb=page.locator('.gallery-thumb img');await expect(thumb).toHaveCount(1);await expect.poll(()=>thumb.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth===320)).toBe(true);await settleAnimations(page);await page.screenshot({path:out+'/gallery.png',fullPage:true});
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));expect(resources.some(u=>/finished-v1|originals\/|registered\.png/.test(u))).toBe(false);
 writeFileSync(out+'/evidence.json',JSON.stringify({templateId:t.id,templateSha256:createHash('sha256').update(readFileSync('apps/web/public'+entry.assetUrl)).digest('hex'),viewport:page.viewportSize(),project:await project(page,id),reloadCanvasExact:true,png:{width:2048,height:2560,sha256:createHash('sha256').update(png).digest('hex')},privateMasterNotRequested:true},null,2));
});

test('I34 wizard screenshot reproduction: dark hair, purple fabric, red mouth and unpainted star at native zoom',async({page})=>{
 test.setTimeout(150_000);const entry=catalog.find(e=>e.themeId==='magic')!,t=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template,out=root+'/wizard-reproduction';mkdirSync(out,{recursive:true});
 const id=await startArtwork(page,'まほう',0,'group'),expected=await fill(page,t,{g2:'#000000',g4:'#8764C9',g5:'#000000',g8:'#000000',g15:'#EF1111',g17:'#8764C9'}),stage=page.getByTestId('artwork');
 const star=t.paintingProfile!.groups.find(g=>g.name==='帽子の星');expect(star).toBeDefined();await page.getByRole('button',{name:'けす',exact:true}).click();await tapRegion(page,t.regions.findIndex(r=>r.id===star!.regionIds[0]),t.id);for(const rid of star!.regionIds)delete expected[rid];
 await expect.poll(async()=>(await project(page,id)).regions).toEqual(expected);const views=[];for(const scale of [1,2,4,2.65,1]){views.push(await zoom(page,t,scale));await stage.screenshot({path:out+`/face-z${scale}.png`});}
 const canvas=stage.locator('canvas'),before=await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL());await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(before);expect((await project(page,id)).regions).toEqual(expected);
 writeFileSync(out+'/evidence.json',JSON.stringify({templateId:t.id,views,paints:expected,reloadCanvasExact:true},null,2));
});

test('I34 unpainted eyes retain friendly white lineart when the parent face is smooth',async({page})=>{
 test.setTimeout(150_000);const out=root+'/unpainted-eyes';mkdirSync(out,{recursive:true});const evidence=[];
 for(const themeId of ['princess','magic','dinosaurs']){
  const entry=catalog.find(e=>e.themeId===themeId)!,t=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template,theme=THEMES.find(e=>e.id===themeId)!,eye=t.paintingProfile!.eyes[0],index=t.paintingProfile!.groups.findIndex(g=>g.regionIds.includes(eye.parentRegionId!)),group=t.paintingProfile!.groups[index];
  const id=await startArtwork(page,theme.name,0,'group'),stage=page.getByTestId('artwork'),c=choice('#F2D7BD');await page.getByRole('button',{name:`${c.family}のしま`,exact:true}).click();await page.locator('.shades button').nth(c.index).click();await stage.focus();for(let i=0;i<index;i++)await stage.press('ArrowRight');await stage.press('Enter');
  const expected=Object.fromEntries(group.regionIds.map(id=>[id,{color:c.hex,paintType:'smooth'}]));await expect.poll(async()=>(await project(page,id)).regions).toEqual(expected);
  await stage.screenshot({path:out+`/${themeId}-fit.png`});await zoom(page,t,4);await stage.screenshot({path:out+`/${themeId}-z4.png`});await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();const before=await stage.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL());await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();await expect.poll(()=>stage.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(before);
  for(const eye of t.paintingProfile!.eyes)expect((await project(page,id)).regions[eye.regionId]).toBeUndefined();evidence.push({themeId,templateId:t.id,regions:expected,unpaintedEyes:t.paintingProfile!.eyes.map(e=>e.regionId),reloadCanvasExact:true});
 }
 writeFileSync(out+'/evidence.json',JSON.stringify(evidence,null,2));
});

test('I33 princess partial/erase and native zoom 1/2/4/intermediate at DPR1/2/3',async({browser})=>{
 test.setTimeout(180_000);
 const entry=catalog.find(e=>e.themeId==='princess')!,t=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template;
 const out=root+'/browser-zoom';mkdirSync(out,{recursive:true});const evidence=[];
 for(const dpr of [1,2,3]){
  const ctx=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:4174',viewport:{width:390,height:844},deviceScaleFactor:dpr,locale:'ja-JP'}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const id=await startArtwork(page,'おひめさま',0,'group'),stage=page.getByTestId('artwork');await fill(page,t);const saved=await project(page,id);
   for(const scale of [1,2,4,2.65,1]){const actual=await zoom(page,t,scale);expect(actual.scale).toBeCloseTo(scale,4);expect(actual.transform).toBe('none');expect(actual.width).toBe(Math.round(actual.cssWidth*dpr));expect(actual.height).toBe(Math.round(actual.cssHeight*dpr));expect((await project(page,id)).regions).toEqual(saved.regions);const file=`face-z${scale}-dpr${dpr}.png`;await stage.screenshot({path:out+'/'+file});evidence.push({file,...actual});}
   if(dpr===1){
    await page.getByRole('button',{name:'こまかく',exact:true}).click();await page.getByRole('button',{name:'あおのしま',exact:true}).click();await page.locator('.shades button').nth(5).click();
    const g=t.paintingProfile!.groups.find(g=>g.id==='g4')!,rid=g.regionIds[0],index=t.regions.findIndex(r=>r.id===rid);await tapRegion(page,index,t.id);
    await expect.poll(async()=>(await project(page,id)).regions[rid]).toEqual({color:'#2598FF',paintType:'smooth'});const partial=await project(page,id);expect(Object.fromEntries(Object.entries(partial.regions).filter(([r])=>r!==rid))).toEqual(Object.fromEntries(Object.entries(saved.regions).filter(([r])=>r!==rid)));
    await stage.screenshot({path:out+'/partial.png'});await page.getByRole('button',{name:'けす',exact:true}).click();await tapRegion(page,index,t.id);await expect.poll(async()=>(await project(page,id)).regions[rid]).toBeUndefined();await stage.screenshot({path:out+'/erased.png'});
   }
   expect(errors).toEqual([]);
  }finally{await ctx.close();}
 }
 writeFileSync(out+'/evidence.json',JSON.stringify(evidence,null,2));
});
