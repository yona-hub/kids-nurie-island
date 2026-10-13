/** Read-only browser validation. It never manufactures a human approval. */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:4318');
 await page.getByText('制作時の技術確認済み。公開前の人間による内容・表現の確認が必要です。',{exact:true}).waitFor();
 assert.equal(await page.locator('canvas').count(),6);assert.equal(await page.locator('#region-rows tr').count(),35);
 const signatures=await page.locator('canvas').evaluateAll(elements=>elements.map(canvas=>canvas.toDataURL()));
 assert.equal(new Set(signatures).size,6,'six comparisons must be genuinely different');
 await page.getByLabel('r01 素材',{exact:true}).selectOption('metal');
 await page.getByLabel('r01 素材',{exact:true}).selectOption('hair');
 await page.getByRole('button',{name:'承認して保存',exact:true}).click();
 await page.getByText('全領域と3画材を確認し、確認者の名前を記入してください。',{exact:true}).waitFor();
 const result=await page.request.post('http://127.0.0.1:4318/api/templates/princess-bunny',{data:{regions:{}}});assert.equal(result.status(),403);
 await page.getByLabel('確認する線画').selectOption('bouquet-butterfly');
 await page.locator('#region-rows tr').nth(38).waitFor();assert.equal(await page.locator('#region-rows tr').count(),39);
 await page.getByLabel('確認する線画').selectOption('princess-bunny');
 await page.locator('#status').getByText(/うさぎと おひめさま/).waitFor();
 await fs.mkdir('tools/asset-pipeline/output',{recursive:true});
 await page.screenshot({path:'tools/asset-pipeline/output/review-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tools/asset-pipeline/output/review-mobile.png',fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({pass:true,previews:6,initialRegions:35,alternateRegions:39,missingConfirmationRejected:true,csrfRejected:true,consoleErrors:errors},null,2));
}finally{await browser.close();}
