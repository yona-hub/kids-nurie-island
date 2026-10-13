import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test,expect,startArtwork,project,catalog,tapRegion} from './helpers';
import type {Template} from '../../packages/shared-types/src/index';
import type {Page} from '@playwright/test';

const entry=catalog.find(t=>t.themeId==='princess')!;
const template=JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`,'utf8')) as Template;
const output=`${process.env.PRINCESS_EVIDENCE_OUTPUT??'test-results/princess-master'}/browser/screens`;
// These are actual palette choices; no completed source painting is exposed.
const colors:Record<string,[string,number]>={g1:['ちゃいろ',5],g2:['ちゃいろ',1],g3:['ピンク',4],g4:['ピンク',4],g5:['きいろ',4],g6:['ピンク',5],g7:['しろ',2],g8:['ピンク',2],g9:['みどり',3],g10:['ちゃいろ',6],g11:['ちゃいろ',6],g12:['きいろ',4],g13:['あか',3],g14:['ピンク',3],g15:['あか',3]};
async function fillGroups(page:Page){
  const stage=page.getByTestId('artwork');
  for(const [i,group] of template.paintingProfile!.groups.entries()){
    const [family,shade]=colors[group.id];
    await page.getByRole('button',{name:`${family}のしま`,exact:true}).click();await page.locator('.shades button').nth(shade).click();
    await stage.focus();if(i)await stage.press('ArrowRight');await stage.press('Enter');
  }
  await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
}
async function zoomFace(page:Page,zoom:number){
  const stage=page.getByTestId('artwork');await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
  const eyes=template.paintingProfile!.eyes.slice(0,2).map(e=>e.geometry!),center={x:eyes.reduce((n,e)=>n+e.cx,0)/2,y:eyes.reduce((n,e)=>n+e.cy,0)/2};
  const b=(await stage.boundingBox())!,anchor={x:center.x/1600*b.width,y:center.y/2000*b.height};
  await stage.evaluate((el,args)=>{const r=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:-Math.log(args.zoom)/.0015,clientX:r.x+args.anchor.x,clientY:r.y+args.anchor.y,bubbles:true,cancelable:true}));},{zoom,anchor});
  if(zoom>1){await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+(b.width*.5-anchor.x)+.37,b.y+b.height*.5+(b.height*.4-anchor.y)+.23,{steps:8});await page.mouse.up();}
  return stage.evaluate(el=>{const v=el.querySelector<HTMLElement>('.artwork-transform')!,c=el.querySelector('canvas')!;return{scale:Number(v.dataset.viewScale),x:Number(v.dataset.viewX),y:Number(v.dataset.viewY),dpr:devicePixelRatio,css:{width:el.clientWidth,height:el.clientHeight},pixels:{width:c.width,height:c.height},transform:getComputedStyle(v).transform};});
}

test('master princess: three materials, native zoom at DPR1/2/3, save, reload and PNG use the private-master shading',async({browser})=>{
  test.setTimeout(240_000);mkdirSync(output,{recursive:true});const measurements=[];
  for(const dpr of [1,2,3]){
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,locale:'ja-JP',baseURL:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:4174'}),page=await context.newPage(),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    try{
      const id=await startArtwork(page,'おひめさま',0,'group'),stage=page.getByTestId('artwork');
      expect((await project(page,id)).templateId).toBe(template.id);expect((await project(page,id)).metadata.renderer).toBe('storybook-v4');
      await stage.screenshot({path:`${output}/blank-dpr${dpr}.png`});
      await fillGroups(page);await expect.poll(async()=>Object.keys((await project(page,id)).regions).length).toBe(template.regions.length-template.paintingProfile!.eyes.length);
      if(dpr===1){
        for(const medium of ['なめらか','クレヨン','いろえんぴつ']){
          await page.getByRole('group',{name:'画材',exact:true}).getByRole('button',{name:medium,exact:true}).click();
          // A pointer tap on one skirt piece must repaint all six pieces.
          await page.getByRole('button',{name:'ピンクのしま',exact:true}).click();await page.locator('.shades button').nth(4).click();
          const skirt=template.paintingProfile!.groups.find(g=>g.id==='g4')!;await tapRegion(page,template.regions.findIndex(r=>r.id===skirt.regionIds[0]),template.id);
          const expected=medium==='なめらか'?'smooth':medium==='クレヨン'?'crayon':'pencil';
          await expect.poll(async()=>{const saved=await project(page,id);return skirt.regionIds.every(r=>saved.regions[r]?.paintType===expected);}).toBe(true);
          await stage.screenshot({path:`${output}/fit-${expected}.png`});
        }
      }
      const before=(await project(page,id)).regions;
      for(const zoom of [1,2,4,2.65,1]){
        const actual=await zoomFace(page,zoom);expect(actual.scale).toBeCloseTo(zoom,4);expect(actual.dpr).toBe(dpr);expect(actual.transform).toBe('none');
        expect(actual.pixels.width).toBe(Math.round(actual.css.width*dpr));expect(actual.pixels.height).toBe(Math.round(actual.css.height*dpr));
        expect((await project(page,id)).regions).toEqual(before);
        const file=`face-z${zoom}-dpr${dpr}.png`;await stage.screenshot({path:`${output}/${file}`});measurements.push({file,...actual});
      }
      await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();expect((await project(page,id)).regions).toEqual(before);expect((await project(page,id)).metadata.renderer).toBe('storybook-v4');
      await page.getByRole('button',{name:'完成',exact:true}).click();await expect(page.getByRole('region',{name:'さくひんのしあげ'})).toBeVisible();
      await stage.screenshot({path:`${output}/finish-dpr${dpr}.png`});await page.getByRole('button',{name:'さくひんへ',exact:true}).click();await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();
      if(dpr===1){const download=page.waitForEvent('download');await page.getByRole('button',{name:'PNG保存',exact:true}).click();const file=`${output}/actual-ui-export.png`;await (await download).saveAs(file);const png=readFileSync(file);expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([2048,2560]);}
      expect(errors).toEqual([]);expect((await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name))).some(u=>/finished-v1|registered-master/.test(u))).toBe(false);
    }finally{await context.close();}
  }
  writeFileSync(`${output}/measurements.json`,JSON.stringify({templateId:template.id,templateSha256:createHash('sha256').update(readFileSync(`apps/web/public${entry.assetUrl}`)).digest('hex'),measurements},null,2));
});
