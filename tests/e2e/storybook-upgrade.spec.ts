import {readFileSync} from 'node:fs';
import {test,expect,startArtwork,project,storedProjects,catalog} from './helpers';

async function backupOfSavedWork(page:import('@playwright/test').Page){
 await startArtwork(page,'おひめさま',0,'group');
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await expect(page.getByRole('region',{name:'さくひんのしあげ'})).toBeVisible();
 await page.goto('/#/settings');await expect(page.locator('.settings-page')).toBeVisible();
 const download=page.waitForEvent('download',{timeout:30_000});await page.getByRole('button',{name:'バックアップ',exact:true}).click();
 return JSON.parse(readFileSync((await(await download).path())!,'utf8'));
}

for(const version of [1,3,4])test(`improved copy v${version} keeps the old work and its renderer, preserves colors, and maps decorations`,async({page})=>{
 test.setTimeout(90_000);
 const backup=await backupOfSavedWork(page);
 const current=catalog.find(t=>t.themeId==='princess')!,oldId=version===4?'gen-princess-bunny-v6-master-v2':version===3?'gen-princess-bunny-v6-storybook-v2':'gen-princess-bunny-v6';
 backup.projects=[{...backup.projects[0],templateId:oldId,title:'以前のおひめさま',status:'completed',backgroundId:'sky-island',frameId:'color-dots',metadata:version>=3?{renderer:`storybook-v${version}`,paintMode:'region'}:{},regions:{r03:{color:'#8F542E',paintType:'crayon'},r10:{color:'#E74A91',paintType:'pencil'},r11:{color:'#FFFFFF',paintType:'smooth'}}}];
 await page.getByLabel('バックアップファイル').setInputFiles({name:'old-work.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.getByRole('button',{name:'復元する',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(async()=>(await storedProjects(page)).length).toBe(2);
 const original=(await storedProjects(page)).find(p=>p.templateId===oldId)!;
 await page.goto(`/#/art/${original.id}`);await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'改善版をつくる',exact:true}).click();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 const copyId=page.url().split('/paint/')[1];expect(copyId).not.toBe(original.id);const copy=await project(page,copyId);
 expect(copy.templateId).toBe(current.id);expect(copy.regions).toEqual(original.regions);expect(copy.backgroundId).toBe('sky-island-storybook-v1');expect(copy.frameId).toBe('color-dots-storybook-v1');expect(copy.metadata.paintMode).toBe('group');expect(copy.metadata.renderer).toBe('storybook-v4');
 expect(await project(page,original.id)).toEqual(original);expect(await storedProjects(page)).toHaveLength(3);
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();expect((await project(page,copyId)).regions).toEqual(original.regions);
 await page.goto(`/#/art/${original.id}`);await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();
 const pngDownload=page.waitForEvent('download',{timeout:30_000});await page.getByRole('button',{name:'PNG保存',exact:true}).click();const png=readFileSync((await(await pngDownload).path())!);expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([2048,2560]);
 expect(await project(page,original.id)).toEqual(original);
});

for(const version of [1,2])test(`faceless vehicle upgrade from renderer v${version} discards face paint, preserves actual parts and original work`,async({page})=>{
 test.setTimeout(90_000);const backup=await backupOfSavedWork(page);
 const current=catalog.find(t=>t.themeId==='construction')!,base=current.id.replace(/-(?:storybook-v2|smooth-v3)$/,''),oldId=version===2?`${base}-storybook-v1`:base;
 backup.projects=[{...backup.projects[0],templateId:oldId,title:`以前のショベル v${version}`,status:'completed',backgroundId:'white',frameId:'none',metadata:version===2?{renderer:'storybook-v2',paintMode:'region'}:{},regions:{r17:{color:'#F9A120',paintType:'crayon'},r20:{color:'#2598FF',paintType:'pencil'},r24:{color:'#F04BAD',paintType:'smooth'},r25:{color:'#F04BAD',paintType:'smooth'},r27:{color:'#FFFFFF',paintType:'smooth'},r28:{color:'#FFFFFF',paintType:'smooth'},r32:{color:'#778811',paintType:'smooth'}}}];
 await page.getByLabel('バックアップファイル').setInputFiles({name:'vehicle-history.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.getByRole('button',{name:'復元する',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(async()=>(await storedProjects(page)).length).toBe(2);
 const original=(await storedProjects(page)).find(p=>p.templateId===oldId)!;await page.goto(`/#/art/${original.id}`);await expect(page.getByRole('button',{name:'PNG保存',exact:true})).toBeEnabled();await page.getByRole('button',{name:'改善版をつくる',exact:true}).click();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 const id=page.url().split('/paint/')[1],copy=await project(page,id);expect(copy.id).not.toBe(original.id);expect(copy.templateId).toBe(current.id);expect(copy.metadata.renderer).toBe('storybook-v3');expect(copy.regions).toEqual({r17:original.regions.r17,r20:original.regions.r20});expect(await project(page,original.id)).toEqual(original);
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();expect((await project(page,id)).regions).toEqual(copy.regions);await page.goto(`/#/art/${id}`);await expect(page.getByRole('button',{name:'改善版をつくる',exact:true})).toHaveCount(0);
});

for(const theme of ['princess','magic','vehicles'])test(`I34 improved copy keeps the previous ${theme} work and all mixed paints`,async({page})=>{
 test.setTimeout(120_000);const backup=await backupOfSavedWork(page),current=catalog.find(t=>t.themeId===theme)!,t=JSON.parse(readFileSync('apps/web/public'+current.assetUrl,'utf8'));
 const oldId=t.paintingProfile.upgradeFrom,old=JSON.parse(readFileSync(`apps/web/public/content/templates/${oldId}.json`,'utf8'));
 const regions=Object.fromEntries(old.paintingProfile.groups.slice(0,3).map((g:{regionIds:string[]},i:number)=>[g.regionIds[0],[{color:'#12ABCE',paintType:'smooth'},{color:'#C4927A',paintType:'crayon'},{color:'#F2D7BD',paintType:'pencil'}][i]]));
 backup.projects=[{...backup.projects[0],templateId:oldId,title:'そのまま残す作品',status:'completed',backgroundId:'white',frameId:'none',metadata:{renderer:`storybook-v${old.paintingProfile.version}`,paintMode:'region'},regions}];
 await page.getByLabel('バックアップファイル').setInputFiles({name:'i34-previous.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.getByRole('button',{name:'復元する',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const original=(await storedProjects(page)).find(p=>p.templateId===oldId)!;await page.goto(`/#/art/${original.id}`);await expect(page.getByRole('button',{name:'改善版をつくる',exact:true})).toBeEnabled();await page.getByRole('button',{name:'改善版をつくる',exact:true}).click();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 const copyId=page.url().split('/paint/')[1],copy=await project(page,copyId);expect(copyId).not.toBe(original.id);expect(copy.templateId).toBe(current.id);expect(copy.regions).toEqual(regions);expect(copy.metadata.upgradedFrom).toBe(original.id);expect(await project(page,original.id)).toEqual(original);
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();expect((await project(page,copyId)).regions).toEqual(regions);expect(await project(page,original.id)).toEqual(original);
});
