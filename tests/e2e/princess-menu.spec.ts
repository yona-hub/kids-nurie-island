import {mkdirSync,writeFileSync} from 'node:fs';
import {test,expect} from './helpers';

const output=`${process.env.PRINCESS_EVIDENCE_OUTPUT??'test-results/princess-master'}/browser/menu`;
for(const width of [390,320,1000])test(`princess menu: natural islands and compact separate back button at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});mkdirSync(output,{recursive:true});
  await page.goto('/#/home');const islands=page.locator('.island-grid .island-card');await expect(islands).toHaveCount(12);
  await expect.poll(()=>islands.locator('img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);
  const metrics=await islands.evaluateAll(items=>items.map(el=>{
    const sky=el.querySelector('.island-sky')!,label=el.querySelector('.island-lettering')!,r=el.getBoundingClientRect(),s=getComputedStyle(el),c=getComputedStyle(sky);
    return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,border:s.borderWidth,background:s.backgroundColor,shadow:s.boxShadow,skyBorder:c.borderWidth,skyShadow:c.boxShadow,skyBackground:c.backgroundColor,labelFilter:getComputedStyle(label).filter};
  }));
  for(const m of metrics){expect(m.border).toBe('0px');expect(m.background).toBe('rgba(0, 0, 0, 0)');expect(m.shadow).toBe('none');expect(m.skyBorder).toBe('0px');expect(m.skyShadow).toBe('none');expect(m.skyBackground).toBe('rgba(0, 0, 0, 0)');expect(m.labelFilter).toBe('none');expect(m.x).toBeGreaterThanOrEqual(0);expect(m.right).toBeLessThanOrEqual(width+.1);}
  if(width===390)expect(metrics.filter(m=>m.bottom<=844).length).toBeGreaterThanOrEqual(8);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({path:`${output}/home-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'おひめさまのしま',exact:true}).click();await expect(page.locator('.template-grid')).toBeVisible();
  const back=page.getByRole('button',{name:'もどる',exact:true}),mark=page.locator('.theme-island-mark');await expect(back).toBeVisible();await expect(mark.locator('img')).toBeVisible();
  expect(await mark.evaluate(el=>el.closest('button,a'))).toBeNull();
  const b=(await back.boundingBox())!,m=(await mark.boundingBox())!,preview=(await page.locator('.template-paper').first().boundingBox())!;
  expect(b.width).toBe(44);expect(b.height).toBe(44);expect(m.width).toBe(80);expect(m.x-b.x-b.width).toBe(10);expect(preview.width).toBeLessThanOrEqual(width<768?200:340);
  await expect(page.locator('.theme-heading')).toHaveCount(0);await expect(page.getByText('どれを ぬってみる？',{exact:true})).toHaveCount(0);
  await page.screenshot({path:`${output}/princess-${width}.png`,fullPage:true});
  writeFileSync(`${output}/metrics-${width}.json`,JSON.stringify({width,islands:metrics,back:b,mark:m,preview},null,2));
  await back.click();await expect(islands).toHaveCount(12);
});
