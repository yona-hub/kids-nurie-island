import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import type { Template } from '../../packages/shared-types/src/index';
import { test, expect, home, startArtwork, tapRegion, project, noHorizontalOverflow, settleAnimations, catalog } from './helpers';

const evidenceRoot=process.env.UI_ART_EVIDENCE_OUTPUT??'test-results/ui-art-v1/revision-1';
const before=readFileSync('content/ui-art-v1/before/packages/content-schema/src/index.ts','utf8');
const originalFamilies=[...before.matchAll(/family\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g)].map(m=>({id:m[1],name:m[2],colors:m[3].split(' ')}));
const templateId=catalog.find(item=>item.themeId==='princess')!.id;
const template=JSON.parse(readFileSync('apps/web/public/content/templates/'+templateId+'.json','utf8')) as Template;
const skin=template.paintingProfile!.groups.find(group=>group.name==='おひめさまの肌')!;
const face=template.regions.filter(region=>skin.regionIds.includes(region.id)).sort((a,b)=>b.bounds.width*b.bounds.height-a.bounds.width*a.bounds.height)[0];
const faceIndex=template.regions.findIndex(region=>region.id===face.id);

async function imagesReady(page: import('@playwright/test').Page){
 await expect.poll(()=>page.locator('img.illustrated-icon').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
 await page.evaluate(()=>document.fonts.ready);
 await settleAnimations(page);
}

async function checkArrows(page: import('@playwright/test').Page,context: import('@playwright/test').BrowserContext,folder:string,touch:boolean){
 const evidence=[];
 await expect(page.locator('.palette-arrow:visible')).toHaveCount(4);
 for(const kind of ['families','shades']){
  const wrapper=page.locator('.palette-lane-'+kind);
  const lane=wrapper.locator(kind==='families'?'.color-families':'.shades');
  const left=wrapper.locator('[data-direction="left"]'),right=wrapper.locator('[data-direction="right"]');
  const position=()=>lane.evaluate(element=>element.scrollLeft);
  const max=await lane.evaluate(element=>element.scrollWidth-element.clientWidth);
  const css=await lane.evaluate(element=>({overflow:getComputedStyle(element).overflowX,scrollbar:getComputedStyle(element).scrollbarWidth}));
  expect(css).toEqual({overflow:'hidden',scrollbar:'none'});
  const overlay=await wrapper.evaluate(element=>{
   const lane=element.querySelector('.color-families,.shades')!;
   const rect=lane.getBoundingClientRect();
   return {lane:rect.toJSON(),mask:getComputedStyle(lane).maskImage,padding:getComputedStyle(lane).scrollPaddingLeft,
    arrows:[...element.querySelectorAll('.palette-arrow')].map(button=>({position:getComputedStyle(button).position,rect:button.getBoundingClientRect().toJSON()}))};
  });
  expect(overlay.mask).toContain('0.35');expect(overlay.padding).toBe('52px');
  for(const arrow of overlay.arrows){
   expect(arrow.position).toBe('absolute');
   expect(arrow.rect.left).toBeLessThan(overlay.lane.right);
   expect(arrow.rect.right).toBeGreaterThan(overlay.lane.left);
  }
  await expect(left).toBeDisabled();await expect(right).toBeEnabled();
  if(touch)await right.tap();else await right.click();
  await page.waitForTimeout(450);
  const short=await position();expect(short).toBeGreaterThan(0);expect(short).toBeLessThan(max);
  await left.focus();await left.press('Enter');await expect.poll(position).toBe(0);
  const bounds=(await right.boundingBox())!;
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await page.waitForTimeout(650);const middle=await position();
  expect(middle).toBeGreaterThan(50);expect(middle).toBeLessThan(max);
  await page.mouse.up();const released=await position();await page.waitForTimeout(180);
  expect(Math.abs(await position()-released)).toBeLessThanOrEqual(1);
  await page.mouse.move(0,0);await page.screenshot({path:folder+'/overlay-'+kind+'.png',fullPage:true});
  await right.click();await page.waitForTimeout(450);expect(await position()).toBeGreaterThan(released);
  await left.hover();await page.mouse.down();await expect(left).toBeDisabled({timeout:4000});await page.mouse.up();
  await right.hover();await page.mouse.down();
  await expect(right).toBeDisabled({timeout:4000});await page.mouse.up();
  const atEnd=await position();expect(Math.abs(atEnd-max)).toBeLessThanOrEqual(1);
  await left.hover();await page.mouse.down();await expect(left).toBeDisabled({timeout:4000});await page.mouse.up();
  expect(await position()).toBe(0);
  await right.focus();await right.press('Space');await page.waitForTimeout(450);expect(await position()).toBeGreaterThan(0);
  let canceled:number|null=null;
  if(touch){
   const session=await context.newCDPSession(page),box=(await left.boundingBox())!;
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
   await page.waitForTimeout(500);
   await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   canceled=await position();await page.waitForTimeout(180);
   expect(Math.abs(await position()-canceled)).toBeLessThanOrEqual(1);
   await session.detach();
  }
  // Losing window focus cancels a held pointer before it reaches the end.
  await right.hover();await page.mouse.down();await page.waitForTimeout(450);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  const blurred=await position();await page.waitForTimeout(180);
  expect(Math.abs(await position()-blurred)).toBeLessThanOrEqual(1);await page.mouse.up();
  evidence.push({kind,max,css,overlay,short,middle,released,atEnd,canceled,blurred});
  // Blur can stop beyond one page; return to the beginning with a full hold.
  await left.hover();await page.mouse.down();await expect(left).toBeDisabled({timeout:4000});await page.mouse.up();
  expect(await position()).toBe(0);
 }
 await page.mouse.move(0,0);
 await page.screenshot({path:folder+'/arrow-lanes.png',fullPage:true});
 return evidence;
}

test('I30 preserves 120 other colors and paints twelve unified browns through the UI',async({page},info)=>{
 test.setTimeout(180_000);
 const id=await startArtwork(page,'おひめさま',0,'group');
 await imagesReady(page);
 expect(originalFamilies).toHaveLength(11);
 for(const original of originalFamilies.filter(item=>item.id!=='brown')){
  await page.getByRole('button',{name:original.name+'のしま',exact:true}).click();
  const shades=page.getByRole('group',{name:original.name+'の12色',exact:true}).getByRole('button');
  await expect(shades).toHaveCount(12);
  for(let index=0;index<12;index++){
   const button=shades.nth(index);
   expect(await button.evaluate(element=>(element as HTMLElement).style.getPropertyValue('--swatch'))).toBe(original.colors[index]);
   await button.click();
   await expect(button).toHaveAttribute('aria-pressed','true');
  }
 }
 await page.getByRole('button',{name:'ちゃいろのしま',exact:true}).click();
 const shades=page.getByRole('group',{name:'ちゃいろの12色',exact:true}).getByRole('button');
 await expect(shades).toHaveCount(12);
 const colors=await shades.evaluateAll(buttons=>buttons.map(button=>({color:(button as HTMLElement).style.getPropertyValue('--swatch'),name:button.getAttribute('aria-label')})));
 expect(colors.map(item=>item.color)).toEqual('#FFF1E5 #F8D8C6 #E8C3AD #EAB58F #D39A73 #B87F5E #8C5A35 #754726 #5F371C #4A2B17 #392015 #291711'.split(' '));
 expect(new Set(colors.map(item=>item.color)).size).toBe(12);
 expect(new Set(colors.map(item=>item.name)).size).toBe(12);
 for(let index=0;index<12;index++){
  await shades.nth(index).click();
  await tapRegion(page,faceIndex,templateId);
  await expect.poll(async()=>{const current=await project(page,id);return skin.regionIds.every(regionId=>current.regions[regionId]?.color===colors[index].color);}).toBe(true);
 }
 // Unified browns remain ordinary RegionPaint values under each material.
 for(const [material,index] of [['クレヨン',5],['いろえんぴつ',6]] as const){
  await page.getByRole('button',{name:material,exact:true}).click();await shades.nth(index).click();await tapRegion(page,faceIndex,templateId);
  await expect.poll(async()=>(await project(page,id)).regions[face.id]?.paintType).toBe(material==='クレヨン'?'crayon':'pencil');
 }
 const saved=await project(page,id);
 expect(Object.keys(saved.regions).sort()).toEqual([...skin.regionIds].sort());
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 expect((await project(page,id)).regions).toEqual(saved.regions);
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await expect(page.locator('.finish-panel')).toBeVisible();
 await page.getByRole('button',{name:'さくひんへ',exact:true}).click();
 await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'PNG保存',exact:true}).click();
 const download=await downloadPromise,folder=evidenceRoot+'/'+info.project.name;mkdirSync(folder,{recursive:true});
 await download.saveAs(folder+'/brown-paint-2048.png');
 const metadata=await sharp(folder+'/brown-paint-2048.png').metadata();expect([metadata.width,metadata.height]).toEqual([2048,2560]);

 // Explicit IndexedDB fixture: colors retired from old palettes are arbitrary
 // valid RegionPaint values. Keep them exact after reload and another UI edit.
 const legacyId=await startArtwork(page,'おひめさま',0,'group');
 const retired=template.regions.filter(region=>!skin.regionIds.includes(region.id)).slice(0,2).map((region,index)=>({id:region.id,color:['#C4927A','#F2D7BD'][index]}));
 await page.evaluate(async({id,retired})=>{
  const database=await new Promise<IDBDatabase>((resolve,reject)=>{
   const request=indexedDB.open('kids-nurie-island-v1');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  await new Promise<void>((resolve,reject)=>{
   const transaction=database.transaction('projects','readwrite'),store=transaction.objectStore('projects'),request=store.getAll();
   request.onsuccess=()=>{
    const row=request.result.find((item:{project:{id:string}})=>item.project.id===id);
    if(!row){transaction.abort();reject(new Error('Legacy fixture project not found'));return;}
    for(const item of retired)row.project.regions[item.id]={color:item.color,paintType:'smooth'};
    store.put(row);
   };
   transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);
   transaction.onabort=()=>reject(transaction.error??new Error('Legacy fixture transaction aborted'));
  });database.close();
 },{id:legacyId,retired});
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 const legacyLoaded=await project(page,legacyId);
 for(const item of retired)expect(legacyLoaded.regions[item.id]?.color).toBe(item.color);
 await page.getByRole('button',{name:'ちゃいろのしま',exact:true}).click();
 await page.locator('.shades button').first().click();await tapRegion(page,faceIndex,templateId);
 await expect.poll(async()=>Object.keys((await project(page,legacyId)).regions).length).toBe(retired.length+skin.regionIds.length);
 const legacySaved=await project(page,legacyId);
 for(const item of retired)expect(legacySaved.regions[item.id]?.color).toBe(item.color);
 writeFileSync(folder+'/retired-colors.json',JSON.stringify({fixture:true,retired,legacyLoaded,legacySaved},null,2));

 writeFileSync(folder+'/brown-evidence.json',JSON.stringify({unchangedOtherColors:120,unifiedBrowns:colors,skinRegions:skin.regionIds,savedRegions:saved.regions,png:{width:metadata.width,height:metadata.height}},null,2));
});

test('I31 overlaid arrows keep the I30 palette, I28 I29 layout and finish-only decorations',async({page,context},info)=>{
 test.setTimeout(120_000);
 const folder=evidenceRoot+'/'+info.project.name;mkdirSync(folder,{recursive:true});
 await home(page);await imagesReady(page);
 await page.screenshot({path:folder+'/home.png',fullPage:true});
 const id=await startArtwork(page,'おひめさま',0,'group');await imagesReady(page);
 await expect(page.locator('.zoom-tools')).toHaveCount(1);
 await expect(page.locator('.palette-panel .zoom-tools')).toHaveCount(0);
 for(const name of ['ちいさく','もとの大きさ','おおきく'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(1);
 for(const name of ['はいけい','かざりわく'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
 expect(await page.locator('.palette-panel').evaluate(element=>getComputedStyle(element).backgroundImage)).toBe('none');
 expect(await page.locator('.palette-lane-families').evaluate(element=>getComputedStyle(element).backgroundImage)).toBe('none');
 expect(await page.locator('.palette-lane-shades').evaluate(element=>getComputedStyle(element).backgroundImage)).toContain('palette-wood-');
 const lanes=await page.locator('.color-families,.shades').evaluateAll(elements=>elements.map(element=>({
  name:element.getAttribute('aria-label'),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,
  rows:[...new Set([...element.children].map(child=>Math.round(child.getBoundingClientRect().top)))],
 })));
 for(const lane of lanes){
  expect(lane.rows,lane.name??'').toHaveLength(1);
  if(page.viewportSize()!.width<768)expect(lane.scrollWidth).toBeGreaterThan(lane.clientWidth);
  else expect(lane.scrollWidth).toBeLessThanOrEqual(lane.clientWidth);
 }
 await page.screenshot({path:folder+'/editor-default.png',fullPage:true});
 const originalViewport=page.viewportSize()!;
 const desktopResize=originalViewport.width>=768;
 if(desktopResize){
  await expect(page.locator('.palette-arrow:visible')).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
 }
 const arrowMovement=await checkArrows(page,context,folder,Boolean(info.project.use.hasTouch));
 expect((await project(page,id)).regions).toEqual({});
 if(desktopResize)await page.setViewportSize(originalViewport);
 await page.mouse.move(0,0);await imagesReady(page);
 await page.getByRole('button',{name:'ちゃいろのしま',exact:true}).click();
 await expect(page.locator('.color-families .illustrated-icon')).toHaveCount(11);
 await expect(page.getByRole('button',{name:'はだのしま',exact:true})).toHaveCount(0);
 await noHorizontalOverflow(page);
 const sizes=await page.locator('.color-families button,.shades button,.paint-tools button,.erase-button,.scene-buttons button,.paint-mode button,.complete-button,.tool-back,.zoom-tools:visible button,.palette-arrow:visible').evaluateAll(elements=>elements.map(element=>{const box=element.getBoundingClientRect();return{label:element.getAttribute('aria-label')??element.textContent,width:box.width,height:box.height};}));
 for(const box of sizes){expect(box.width,box.label??'').toBeGreaterThanOrEqual(44);expect(box.height,box.label??'').toBeGreaterThanOrEqual(44);}
 const ui=await page.locator('.color-island,.scene-buttons .small-button').evaluateAll(elements=>elements.map(element=>{const css=getComputedStyle(element);return{border:css.borderWidth,background:css.backgroundColor,shadow:css.boxShadow};}));
 expect(ui.every(item=>item.border==='0px'&&item.shadow==='none')).toBe(true);
 const initialLayout=await page.evaluate(()=>({scrollY,viewportHeight:innerHeight,documentHeight:document.documentElement.scrollHeight,shades:[...document.querySelectorAll('.shades button')].map(button=>button.getBoundingClientRect().toJSON())}));
 expect(initialLayout.scrollY).toBe(0);
 for(const rect of initialLayout.shades){expect(rect.top).toBeGreaterThanOrEqual(0);expect(rect.bottom).toBeLessThanOrEqual(initialLayout.viewportHeight);}
 await page.screenshot({path:folder+'/editor-brown.png',fullPage:true});
 const centerPixels=[];
 // Scroll each swatch into the actual viewport before sampling its live color.
 for(let index=0;index<12;index++){
  const button=page.locator('.shades button').nth(index);
  await button.scrollIntoViewIfNeeded();
  const hex=await button.evaluate(element=>(element as HTMLElement).style.getPropertyValue('--swatch'));
  const pixels=await sharp(await button.locator('span').screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const offset=(Math.floor(pixels.info.height/2)*pixels.info.width+Math.floor(pixels.info.width/2))*4;
  const rgb=[...pixels.data.slice(offset,offset+3)];
  expect(rgb,'Live color must remain exact under the generated dab').toEqual([1,3,5].map(position=>Number.parseInt(hex.slice(position,position+2),16)));
  centerPixels.push({hex,rgb});
 }
 const last=page.locator('.shades button').last();await last.focus();await last.press('Space');
 await expect(last).toHaveAttribute('aria-pressed','true');
 const focus=await last.evaluate(element=>({visible:element.matches(':focus-visible'),outline:getComputedStyle(element).outlineWidth,rect:element.getBoundingClientRect().toJSON()}));
 expect(focus.visible).toBe(true);expect(Number.parseFloat(focus.outline)).toBeGreaterThan(0);
 await expect.poll(()=>last.evaluate(element=>{const rect=element.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight&&rect.left>=0&&rect.right<=innerWidth;})).toBe(true);
 await page.screenshot({path:folder+'/editor-brown-last.png',fullPage:true});
 await imagesReady(page);
 const geometry=await page.getByTestId('artwork').boundingBox();expect(geometry!.height).toBeGreaterThanOrEqual(150);
 const zoom=await page.locator('.zoom-tools').boundingBox(),mode=await page.locator('.paint-mode').boundingBox(),stage=await page.locator('.editor-stage').boundingBox();
 expect(zoom!.y+zoom!.height).toBeLessThanOrEqual(stage!.y);
 expect(mode!.x+mode!.width).toBeLessThanOrEqual(zoom!.x);
 expect(Math.abs(mode!.y+mode!.height/2-zoom!.y-zoom!.height/2)).toBeLessThan(1);
 const tops=await page.locator('.zoom-tools button').evaluateAll(buttons=>buttons.map(button=>Math.round(button.getBoundingClientRect().top)));
 expect(new Set(tops).size).toBe(1);
 await noHorizontalOverflow(page);
 await page.getByRole('button',{name:'おおきく',exact:true}).click();
 await expect.poll(()=>page.locator('.artwork-transform').evaluate(element=>Number((element as HTMLElement).dataset.viewScale))).toBeGreaterThan(1);
 await page.getByRole('button',{name:'もとの大きさ',exact:true}).click();
 await expect.poll(()=>page.locator('.artwork-transform').evaluate(element=>Number((element as HTMLElement).dataset.viewScale))).toBe(1);
 expect((await project(page,id)).regions).toEqual({});
 await tapRegion(page,faceIndex,templateId);
 await expect.poll(async()=>Object.keys((await project(page,id)).regions).length).toBe(skin.regionIds.length);
 const painted=(await project(page,id)).regions;
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await expect(page.locator('.finish-panel')).toBeVisible();
 await expect(page.locator('.zoom-tools')).toHaveCount(0);
 await page.getByRole('button',{name:'はいけい',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'はいけいを えらぼう'})).toBeVisible();
 await page.getByRole('button',{name:'あおぞらのしま',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(async()=>(await project(page,id)).backgroundId).toBe('sky-island-scenic-v3');
 await page.getByRole('button',{name:'かざりわく',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'かざりわくを えらぼう'})).toBeVisible();
 await page.getByRole('button',{name:'カラードット',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(async()=>(await project(page,id)).frameId).toBe('color-dots-atelier-v3');
 await imagesReady(page);await page.screenshot({path:folder+'/finish-decorations.png',fullPage:true});
 await page.getByRole('button',{name:'もうすこしぬる',exact:true}).click();
 for(const name of ['はいけい','かざりわく'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
 await expect(page.locator('.zoom-tools')).toHaveCount(1);
 expect((await project(page,id)).regions).toEqual(painted);
 await imagesReady(page);await page.screenshot({path:folder+'/editor-decorated.png',fullPage:true});
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 for(const name of ['はいけい','かざりわく'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
 await expect(page.locator('.zoom-tools')).toHaveCount(1);
 const restored=await project(page,id);
 expect(restored).toMatchObject({backgroundId:'sky-island-scenic-v3',frameId:'color-dots-atelier-v3',regions:painted});
 writeFileSync(folder+'/ui-evidence.json',JSON.stringify({viewport:page.viewportSize(),lanes,desktopResize,arrowMovement,initialLayout,sizes,ui,focus,artwork:geometry,zoom,mode,stage,centerPixels,restored},null,2));
});
