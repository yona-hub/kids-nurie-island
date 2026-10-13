import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test,expect,startArtwork,project,catalog,settleAnimations} from './helpers';
import type {Template} from '../../packages/shared-types/src/index';

const entry=catalog.find(t=>t.themeId==='princess')!;
const template=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')) as Template;
const colors:Record<string,[string,number]>={g1:['ちゃいろ',7],g2:['ちゃいろ',1],g3:['ピンク',4],g4:['ピンク',4],g5:['きいろ',4],g6:['ピンク',5],g7:['しろ',2],g8:['ピンク',2],g9:['みどり',3],g10:['ちゃいろ',6],g11:['ちゃいろ',6],g12:['きいろ',4],g13:['あか',3],g14:['ピンク',3],g15:['あか',3]};
test('I32 crayon keeps grain without form lighting through edit, reload, finish, thumbnail and PNG',async({page},info)=>{
 test.setTimeout(120_000);
 const folder=(process.env.CRAYON_EVIDENCE_OUTPUT??'test-results/crayon-flat-i32/revision-1')+'/'+info.project.name;
 mkdirSync(folder,{recursive:true});
 const id=await startArtwork(page,'おひめさま',0,'group'),artwork=page.getByTestId('artwork');
 await page.getByRole('button',{name:'クレヨン',exact:true}).click();
 for(const [i,group]of template.paintingProfile!.groups.entries()){
  const [family,index]=colors[group.id];
  await page.getByRole('button',{name:`${family}のしま`,exact:true}).click();await page.locator('.shades button').nth(index).click();
  await artwork.focus();if(i)await artwork.press('ArrowRight');await artwork.press('Enter');
 }
 await expect.poll(async()=>Object.keys((await project(page,id)).regions).length).toBe(template.regions.length-template.paintingProfile!.eyes.length);
 const saved=await project(page,id);expect(Object.values(saved.regions).every(p=>p.paintType==='crayon')).toBe(true);
 await settleAnimations(page);await page.screenshot({path:folder+'/editor-crayon.png',fullPage:true});
 const canvas=artwork.locator('canvas');const before=await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL());
 await page.reload();await expect(page.getByRole('button',{name:'完成',exact:true})).toBeEnabled();
 expect((await project(page,id)).regions).toEqual(saved.regions);
 await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).toBe(before);
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await expect(page.getByRole('region',{name:'さくひんのしあげ'})).toBeVisible();await settleAnimations(page);
 await page.screenshot({path:folder+'/finish-crayon.png',fullPage:true});
 await page.getByRole('button',{name:'さくひんへ',exact:true}).click();
 const pngButton=page.getByRole('button',{name:'PNG保存',exact:true});await expect(pngButton).toBeEnabled();
 const download=page.waitForEvent('download');await pngButton.click();await(await download).saveAs(folder+'/actual-ui-export.png');
 const png=readFileSync(folder+'/actual-ui-export.png');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([2048,2560]);
 await page.goto('/#/gallery');const thumbnail=page.locator('.gallery-thumb img');await expect(thumbnail).toHaveCount(1);
 await expect.poll(()=>thumbnail.evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth===320)).toBe(true);
 await settleAnimations(page);await page.screenshot({path:folder+'/gallery-crayon.png',fullPage:true});
 writeFileSync(folder+'/evidence.json',JSON.stringify({templateId:template.id,viewport:page.viewportSize(),project:saved,png:{width:2048,height:2560,sha256:createHash('sha256').update(png).digest('hex')},reloadCanvasExact:true},null,2));
});
