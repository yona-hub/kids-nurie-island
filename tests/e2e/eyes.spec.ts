import {readFileSync} from 'node:fs';
import {createCanvas,loadImage,Path2D} from '@napi-rs/canvas';
import {test,expect,startArtwork,project,catalog} from './helpers';
import type {Template,Point} from '../../packages/shared-types/src/index';
const themeNames:Record<string,string>={princess:'おひめさま',magic:'まほう',animals:'どうぶつ',ocean:'うみ',dinosaurs:'きょうりゅう',construction:'はたらくくるま',robots:'ロボット',space:'うちゅう'};
async function tap(page:import('@playwright/test').Page,p:Point){const box=(await page.getByTestId('artwork').boundingBox())!;await page.mouse.click(box.x+p.x/1600*box.width,box.y+p.y/2000*box.height);}
for(const entry of catalog){
 const t=JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`,'utf8')) as Template;
 if(!t.paintingProfile?.eyes.length)continue;
 test(`${t.id}: automatic eyes redirect highlights, retain per-eye control and match PNG`,async({page})=>{
  test.setTimeout(120_000);const id=await startArtwork(page,themeNames[t.themeId],0,'group');
  await page.getByRole('button',{name:'くろのしま',exact:true}).click();await page.locator('.shades button').nth(11).click();
  for(const eye of t.paintingProfile!.eyes){const b=t.regions.find(r=>r.id===eye.highlightId)!.bounds;await tap(page,{x:b.x+b.width/2,y:b.y+b.height/2});await expect.poll(async()=>(await project(page,id)).regions[eye.regionId]?.color).toBe('#000000');expect((await project(page,id)).regions[eye.highlightId]).toBeUndefined();}
  await page.getByRole('button',{name:'こまかく',exact:true}).click();
  const first=t.paintingProfile!.eyes[0],hb=t.regions.find(r=>r.id===first.highlightId)!.bounds;
  await page.getByRole('button',{name:'あおのしま',exact:true}).click();await page.locator('.shades button').nth(5).click();await tap(page,{x:hb.x+hb.width/2,y:hb.y+hb.height/2});
  await expect.poll(async()=>(await project(page,id)).regions[first.regionId]?.color).toBe('#2598FF');
  const sibling=t.paintingProfile!.eyes.find(e=>e.owner===first.owner&&e.regionId!==first.regionId);if(sibling)expect((await project(page,id)).regions[sibling.regionId].color).toBe('#000000');
  await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();expect((await project(page,id)).metadata.paintMode).toBe('region');
  await page.getByRole('button',{name:'完成',exact:true}).click();await page.getByRole('button',{name:'さくひんへ',exact:true}).click();await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();
  const downloaded=page.waitForEvent('download',{timeout:30_000});await page.getByRole('button',{name:'PNG保存',exact:true}).click();const png=await loadImage(readFileSync((await(await downloaded).path())!));expect([png.width,png.height]).toEqual([2048,2560]);
  const ctx=createCanvas(2048,2560).getContext('2d');ctx.drawImage(png,0,0);
  for(const eye of t.paintingProfile!.eyes){const b=new Path2D(eye.artwork!.reflections[0].path).computeTightBounds(),p={x:(b[0]+b[2])/2,y:(b[1]+b[3])/2};const pixel=ctx.getImageData(Math.round(p.x*1.28),Math.round(p.y*1.28),1,1).data;expect(Math.min(...pixel.slice(0,3)),`${eye.regionId}: automatic main reflection`).toBeGreaterThan(210);}
 });
}
