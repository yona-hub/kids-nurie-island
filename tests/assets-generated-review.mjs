/** Read-only rendered review of the generated set; no human approval is sent. */
/* global Image, document */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base=process.env.ASSET_REVIEW_URL??'http://127.0.0.1:4320';
const catalog=JSON.parse(await fs.readFile('apps/web/public/content/catalog.json','utf8'));
const selected=catalog.find(item=>item.themeId==='princess');
const alternate=catalog.find(item=>item.themeId==='flowers');
const hashFiles=async paths=>Promise.all(paths.map(async path=>({path,sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex')})));
const protectedFiles=catalog.flatMap(item=>[`content/templates/reviews/${item.id}.json`,`apps/web/public${item.assetUrl}`]);
const before=await hashFiles(protectedFiles);
const codeFiles=['tests/assets-generated-review.mjs','tools/asset-pipeline/review-client.js','tools/asset-pipeline/review-server.mjs'];
const codeBefore=await hashFiles(codeFiles),startedAt=new Date().toISOString();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const uiPosts=[];page.on('request',request=>{if(request.method()==='POST')uiPosts.push(request.url());});
try{
 await page.goto(base);
 await page.getByLabel('確認する線画').selectOption(selected.id);
 await page.locator('#region-rows tr').nth(selected.regionCount-1).waitFor();
 await page.locator('#status').getByText(new RegExp(`${selected.regionCount}領域 / QA 合格`)).waitFor();
 assert.equal(await page.locator('canvas').count(),6);
 const originalExact=await page.evaluate(async id=>{
  const image=new Image();image.src=`/api/originals/${id}`;await image.decode();
  const expected=document.createElement('canvas');expected.width=400;expected.height=500;
  expected.getContext('2d').drawImage(image,0,0,400,500);
  return document.getElementById('original').toDataURL()===expected.toDataURL();
 },selected.id);
 assert.equal(originalExact,true,'original pane must show the untouched normalized source pixels');
 await page.getByLabel('r01 領域名',{exact:true}).fill('王冠（検査中・未保存）');
 await page.waitForFunction(()=>new Set([...document.querySelectorAll('canvas')].map(canvas=>canvas.toDataURL())).size===6);
 const pupilId=JSON.parse(await fs.readFile('content/generated-lineart/eye-region-map.json','utf8')).find(item=>item.templateId===selected.id).eyes[0].pupilIds[0];
 assert.equal(await page.getByLabel(`${pupilId} ハイライト`,{exact:true}).isChecked(),false);
 await page.getByRole('button',{name:'承認して保存',exact:true}).click();
 await page.getByText('全領域と3画材を確認し、確認者の名前を記入してください。',{exact:true}).waitFor();
 const rejected=await page.request.post(`${base}/api/templates/${selected.id}`,{data:{regions:{}}});assert.equal(rejected.status(),403);
 await page.getByLabel('確認する線画').selectOption(alternate.id);
 await page.locator('#status').getByText(new RegExp(`${alternate.regionCount}領域 / QA 合格`)).waitFor();
 await page.getByLabel('確認する線画').selectOption(selected.id);
 await page.locator('#status').getByText(new RegExp(`${selected.regionCount}領域 / QA 未検査`)).waitFor();
 await page.locator('#status').getByText('編集内容は未保存・未承認です。線画を切り替えて戻っても、この画面を開いている間は編集を保持します。',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('r01 領域名',{exact:true}).inputValue(),'王冠（検査中・未保存）');
 assert.equal(await page.locator('#confirm').isChecked(),false);
 assert.deepEqual(uiPosts,[],'A rejected confirmation must not send a UI save or approval request');
 await page.screenshot({path:'tools/asset-pipeline/output/generated-review-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'tools/asset-pipeline/output/generated-review-mobile.png',fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));
 const after=await hashFiles(protectedFiles),codeAfter=await hashFiles(codeFiles);
 assert.deepEqual(after,before,'All published templates and human approval records must remain byte-identical');
 assert.deepEqual(codeAfter,codeBefore,'The reviewed code must not change during the run');
 const result={pass:true,startedAt,finishedAt:new Date().toISOString(),browserVersion:browser.version(),source:codeBefore,protectedFiles:before,sourceUnchanged:true,protectedFilesUnchanged:true,templateId:selected.id,regions:selected.regionCount,previews:6,originalSourcePixelsExact:originalExact,independentPupilSettings:true,japaneseEditable:true,draftSurvivesTemplateSwitch:true,draftStatus:'未保存・未承認／QA 未検査',uiPostCount:uiPosts.length,missingConfirmationRejected:true,csrfRejected:rejected.status()===403,approvalUntouched:true,consoleErrors:errors};
 await fs.writeFile('tools/asset-pipeline/output/generated-review-result.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
}finally{await browser.close();}
